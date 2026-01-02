/**
 * RelayerService - Backend transaction relay
 *
 * Server-side service that holds PAS tokens and submits
 * transactions on behalf of users. Used because Polkadot
 * Asset Hub doesn't support ERC-4337 bundlers yet.
 *
 * IMPORTANT: This file should only be imported in API routes
 * (server-side), never in client components.
 */

import { ethers } from "ethers";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { getRpcEndpoints, getCurrentNetwork } from "@/lib/config/networks";
import solidityAbi from "@/contract/solidity-abi.json";
import type { SignedIntent, SponsoredTxResult, PaymasterConfig } from "./types";
import { PaymasterService } from "./PaymasterService";

const LOG_CONTEXT = "RelayerService";

export class RelayerService {
    private static wallet: ethers.Wallet | null = null;
    private static provider: ethers.JsonRpcProvider | null = null;
    private static contract: ethers.Contract | null = null;

    /**
     * Get paymaster configuration from environment
     */
    static getConfig(): PaymasterConfig {
        const relayerPrivateKey = process.env.RELAY_PRIVATE_KEY;
        const relayerAddress = process.env.RELAY_ADDRESS;

        if (!relayerPrivateKey || !relayerAddress) {
            throw new Error(
                "Relayer not configured. Set RELAY_PRIVATE_KEY and RELAY_ADDRESS."
            );
        }

        return {
            relayerPrivateKey,
            relayerAddress,
            maxGasPerTx: parseInt(process.env.MAX_GAS_PER_TX || "150000", 10),
            dailyGasBudget: parseInt(process.env.DAILY_GAS_BUDGET || "1000000", 10),
            enabled: process.env.NEXT_PUBLIC_GASLESS_ENABLED === "true",
        };
    }

    /**
     * Initialize the relayer wallet
     */
    private static async initialize(): Promise<void> {
        if (this.wallet && this.provider && this.contract) {
            return;
        }

        const config = this.getConfig();
        const network = getCurrentNetwork();
        const rpcEndpoints = getRpcEndpoints();

        // Create network without ENS
        const ethNetwork = new ethers.Network(network.name, network.chainId);

        // Connect to RPC
        this.provider = new ethers.JsonRpcProvider(rpcEndpoints[0], ethNetwork, {
            staticNetwork: ethNetwork,
        });

        // Create wallet from private key
        this.wallet = new ethers.Wallet(config.relayerPrivateKey, this.provider);

        // Verify wallet address matches config
        if (this.wallet.address.toLowerCase() !== config.relayerAddress.toLowerCase()) {
            ErrorLogger.error(
                new Error("Relayer address mismatch"),
                LOG_CONTEXT,
                {
                    expected: config.relayerAddress,
                    actual: this.wallet.address,
                }
            );
            throw new Error("Relayer wallet address does not match configured address");
        }

        // Get contract address
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!contractAddress) {
            throw new Error("Contract address not configured");
        }

        // Create contract instance with relayer wallet as signer
        this.contract = new ethers.Contract(contractAddress, solidityAbi, this.wallet);

        ErrorLogger.info(LOG_CONTEXT, "Relayer initialized", {
            address: this.wallet.address,
            network: network.name,
        });
    }

    /**
     * Get relayer wallet balance
     */
    static async getBalance(): Promise<bigint> {
        await this.initialize();
        return this.provider!.getBalance(this.wallet!.address);
    }

    /**
     * Check if relayer has sufficient balance
     */
    static async hasSufficientBalance(requiredGas: bigint): Promise<boolean> {
        const balance = await this.getBalance();
        const feeData = await this.provider!.getFeeData();
        const gasPrice = feeData.gasPrice ?? 1_000_000_000n;
        const requiredBalance = requiredGas * gasPrice;

        return balance >= requiredBalance;
    }

    /**
     * Submit a sponsored transaction
     *
     * Validates the signed intent, then submits the transaction
     * using the relayer wallet to pay gas.
     */
    static async submitTransaction(
        signedIntent: SignedIntent
    ): Promise<SponsoredTxResult> {
        try {
            await this.initialize();

            // Validate signature
            const isValidSignature = PaymasterService.verifySignature(signedIntent);
            if (!isValidSignature) {
                return {
                    success: false,
                    error: "Invalid signature",
                };
            }

            // Check intent timestamp is recent (within 5 minutes)
            const now = Date.now();
            if (Math.abs(now - signedIntent.timestamp) > 5 * 60 * 1000) {
                return {
                    success: false,
                    error: "Intent expired. Please try again.",
                };
            }

            // Check relayer balance
            const config = this.getConfig();
            const hasBalance = await this.hasSufficientBalance(BigInt(config.maxGasPerTx));
            if (!hasBalance) {
                ErrorLogger.error(
                    new Error("Relayer out of funds"),
                    LOG_CONTEXT,
                    { address: this.wallet!.address }
                );
                return {
                    success: false,
                    error: "Gasless transactions temporarily unavailable. Please try again later.",
                };
            }

            const { intent } = signedIntent;

            ErrorLogger.info(LOG_CONTEXT, "Submitting sponsored transaction", {
                sender: intent.sender,
                recipient: intent.recipient,
            });

            // Submit transaction
            const tx = await this.contract!.storeMessage(
                intent.encryptedKeyCID,
                intent.encryptedMessageCID,
                intent.messageHash,
                intent.unlockTimestamp,
                intent.recipient,
                {
                    gasLimit: config.maxGasPerTx,
                }
            );

            // Wait for confirmation
            const receipt = await tx.wait();

            // Extract messageId from event
            const event = receipt.logs
                .map((log: ethers.Log) => {
                    try {
                        return this.contract!.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((e: ethers.LogDescription | null) => e?.name === "MessageStored");

            const result: SponsoredTxResult = {
                success: true,
                transactionHash: receipt.hash,
                blockHash: receipt.blockHash,
                messageId: event?.args?.messageId?.toString(),
                gasUsed: receipt.gasUsed,
            };

            ErrorLogger.info(LOG_CONTEXT, "Sponsored transaction confirmed", {
                txHash: receipt.hash,
                gasUsed: receipt.gasUsed.toString(),
                messageId: result.messageId,
            });

            return result;
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "submitTransaction" }
            );

            return {
                success: false,
                error: error instanceof Error ? error.message : "Transaction failed",
            };
        }
    }
}
