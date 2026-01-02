/**
 * @license Apache-2.0
 * Copyright 2025-2026 SovSeal Protocol Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { ethers } from "ethers";
import type {
    SovSealClientConfig,
    MessageMetadata,
    CreateMessageParams,
    TransactionResult,
} from "./types";

/**
 * SovSeal Contract ABI (minimal interface)
 */
const SOVSEAL_ABI = [
    "function storeMessage(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address recipient) returns (uint64)",
    "function getSentMessages(address sender) view returns (tuple(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address sender, address recipient, uint64 createdAt)[])",
    "function getReceivedMessages(address recipient) view returns (tuple(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address sender, address recipient, uint64 createdAt)[])",
    "function getMessage(uint64 messageId) view returns (tuple(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address sender, address recipient, uint64 createdAt))",
    "function getMessageCount() view returns (uint64)",
    "event MessageStored(uint64 indexed messageId, address indexed sender, address indexed recipient, uint64 unlockTimestamp)",
];

/**
 * SovSealClient - TypeScript client for interacting with the SovSeal Protocol
 *
 * @example
 * ```typescript
 * import { SovSealClient } from '@sovseal/sdk';
 *
 * const client = new SovSealClient({
 *   rpcUrl: 'https://polkadot-asset-hub-eth-rpc.polkadot.io',
 *   contractAddress: '0x...',
 * });
 *
 * // Get messages for an address
 * const messages = await client.getReceivedMessages('0x...');
 *
 * // Store a new message (requires signer)
 * const result = await client.storeMessage({
 *   encryptedKeyCid: 'bafybeig...',
 *   encryptedMessageCid: 'bafybeih...',
 *   messageHash: 'abc123...',
 *   unlockTimestamp: Date.now() + 86400000,
 *   recipient: '0x...',
 * });
 * ```
 */
export class SovSealClient {
    private provider: ethers.Provider;
    private contract: ethers.Contract;
    private signer: ethers.Signer | null = null;

    constructor(private config: SovSealClientConfig) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.contract = new ethers.Contract(
            config.contractAddress,
            SOVSEAL_ABI,
            this.provider
        );
    }

    /**
     * Connect a signer for write operations
     */
    connect(signer: ethers.Signer): SovSealClient {
        this.signer = signer;
        this.contract = this.contract.connect(signer) as ethers.Contract;
        return this;
    }

    /**
     * Store a new time-locked message on-chain
     * @param params Message creation parameters
     * @returns Transaction result with message ID
     */
    async storeMessage(params: CreateMessageParams): Promise<TransactionResult> {
        if (!this.signer) {
            throw new Error("Signer required for write operations. Call connect() first.");
        }

        const tx = await this.contract.storeMessage(
            params.encryptedKeyCid,
            params.encryptedMessageCid,
            params.messageHash,
            params.unlockTimestamp,
            params.recipient
        );

        const receipt = await tx.wait();

        // Parse the MessageStored event to get the message ID
        const event = receipt.logs.find(
            (log: ethers.Log) => log.topics[0] === ethers.id("MessageStored(uint64,address,address,uint64)")
        );

        let messageId: bigint | undefined;
        if (event) {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint64"],
                event.topics[1]
            );
            messageId = decoded[0];
        }

        return {
            hash: receipt.hash,
            success: receipt.status === 1,
            messageId,
        };
    }

    /**
     * Get all messages sent by an address
     */
    async getSentMessages(sender: string): Promise<MessageMetadata[]> {
        const messages = await this.contract.getSentMessages(sender);
        return messages.map(this.parseMessageMetadata);
    }

    /**
     * Get all messages received by an address
     */
    async getReceivedMessages(recipient: string): Promise<MessageMetadata[]> {
        const messages = await this.contract.getReceivedMessages(recipient);
        return messages.map(this.parseMessageMetadata);
    }

    /**
     * Get a specific message by ID
     */
    async getMessage(messageId: bigint): Promise<MessageMetadata> {
        const message = await this.contract.getMessage(messageId);
        return {
            ...this.parseMessageMetadata(message),
            id: messageId,
        };
    }

    /**
     * Get total message count
     */
    async getMessageCount(): Promise<bigint> {
        return await this.contract.getMessageCount();
    }

    /**
     * Check if a message can be unlocked (timestamp has passed)
     */
    isUnlockable(message: MessageMetadata): boolean {
        return BigInt(Date.now()) >= message.unlockTimestamp * 1000n;
    }

    /**
     * Get time remaining until unlock (in milliseconds)
     */
    getTimeUntilUnlock(message: MessageMetadata): number {
        const unlockTimeMs = Number(message.unlockTimestamp) * 1000;
        const remaining = unlockTimeMs - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Parse raw contract response to MessageMetadata
     */
    private parseMessageMetadata = (raw: any, index?: number): MessageMetadata => ({
        id: BigInt(index ?? 0),
        encryptedKeyCid: raw.encryptedKeyCid,
        encryptedMessageCid: raw.encryptedMessageCid,
        messageHash: raw.messageHash,
        unlockTimestamp: BigInt(raw.unlockTimestamp),
        sender: raw.sender,
        recipient: raw.recipient,
        createdAt: BigInt(raw.createdAt),
    });
}
