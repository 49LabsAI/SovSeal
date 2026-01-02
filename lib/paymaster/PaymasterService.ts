/**
 * PaymasterService - Gas sponsorship logic
 *
 * Handles gasless transaction sponsorship for SovSeal users.
 * Uses a backend relayer architecture since Polkadot Asset Hub
 * doesn't support ERC-4337 bundlers yet.
 */

"use client";

import { ethers } from "ethers";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { GasEstimator } from "./GasEstimator";
import type {
    MessageIntent,
    SignedIntent,
    SponsorshipEligibility,
    GasEstimate,
} from "./types";

const LOG_CONTEXT = "PaymasterService";

// Free tier limits
const FREE_TIER_MONTHLY_LIMIT = 1;
const FREE_TIER_DAILY_GAS_LIMIT = 200_000n;

export class PaymasterService {
    /**
     * Check if gasless transactions are enabled
     */
    static isEnabled(): boolean {
        return process.env.NEXT_PUBLIC_GASLESS_ENABLED === "true";
    }

    /**
     * Create a message intent for signing
     *
     * This creates the data structure that the user will sign
     * to authorize the relayer to submit the transaction.
     */
    static createIntent(
        params: Omit<MessageIntent, "sender">,
        senderAddress: string
    ): MessageIntent {
        return {
            ...params,
            sender: senderAddress,
        };
    }

    /**
     * Generate a unique nonce for the intent
     * Prevents replay attacks
     */
    static generateNonce(): string {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    /**
     * Create the message to be signed by the user
     *
     * Uses EIP-712 style structured data for clear user consent
     */
    static createSignableMessage(intent: MessageIntent, nonce: string): string {
        const message = {
            action: "SovSeal Message Creation",
            encryptedKeyCID: intent.encryptedKeyCID,
            encryptedMessageCID: intent.encryptedMessageCID,
            messageHash: intent.messageHash,
            unlockTimestamp: intent.unlockTimestamp,
            recipient: intent.recipient,
            nonce,
            timestamp: Date.now(),
        };

        return JSON.stringify(message, null, 2);
    }

    /**
     * Verify a signed intent
     *
     * Recovers the signer address from the signature and compares
     * it to the declared sender in the intent.
     */
    static verifySignature(signedIntent: SignedIntent): boolean {
        try {
            const message = this.createSignableMessage(
                signedIntent.intent,
                signedIntent.nonce
            );
            const recoveredAddress = ethers.verifyMessage(
                message,
                signedIntent.signature
            );

            const isValid =
                recoveredAddress.toLowerCase() ===
                signedIntent.intent.sender.toLowerCase();

            if (!isValid) {
                ErrorLogger.warn(LOG_CONTEXT, "Signature verification failed", {
                    expected: signedIntent.intent.sender,
                    recovered: recoveredAddress,
                });
            }

            return isValid;
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "verifySignature" }
            );
            return false;
        }
    }

    /**
     * Check if a user is eligible for gas sponsorship
     *
     * TODO: Integrate with user tier system and rate limiting
     * For now, returns eligible for all users (testnet)
     */
    static async checkEligibility(
        _userAddress: string
    ): Promise<SponsorshipEligibility> {
        // For testnet, allow all users
        // Production will check:
        // 1. User tier (free/personal/legacy/enterprise)
        // 2. Monthly message count
        // 3. Daily gas budget
        // 4. Account standing

        return {
            eligible: true,
            tier: "free",
            remainingDaily: FREE_TIER_MONTHLY_LIMIT,
            reason: undefined,
        };
    }

    /**
     * Estimate gas cost for a message creation
     */
    static async estimateGas(): Promise<GasEstimate> {
        return GasEstimator.estimateStoreMessage();
    }

    /**
     * Format eligibility status for display
     */
    static formatEligibility(eligibility: SponsorshipEligibility): string {
        if (eligibility.eligible) {
            if (eligibility.tier === "free") {
                return `${eligibility.remainingDaily} free message${eligibility.remainingDaily === 1 ? "" : "s"} remaining this month`;
            }
            return "Unlimited gasless transactions";
        }
        return eligibility.reason || "Not eligible for gas sponsorship";
    }

    /**
     * Submit a signed intent to the relay endpoint
     *
     * This is the client-side method that sends the signed intent
     * to our backend for sponsored submission.
     */
    static async submitToRelay(
        signedIntent: SignedIntent
    ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
        try {
            const response = await fetch("/api/relay", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(signedIntent),
            });

            const data = await response.json();

            if (!response.ok) {
                ErrorLogger.warn(LOG_CONTEXT, "Relay submission failed", {
                    status: response.status,
                    error: data.error,
                });
                return {
                    success: false,
                    error: data.error || "Relay submission failed",
                };
            }

            ErrorLogger.info(LOG_CONTEXT, "Transaction relayed successfully", {
                transactionHash: data.transactionHash,
            });

            return {
                success: true,
                transactionHash: data.transactionHash,
            };
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "submitToRelay" }
            );
            return {
                success: false,
                error: error instanceof Error ? error.message : "Network error",
            };
        }
    }
}
