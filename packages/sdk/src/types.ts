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

/**
 * Configuration for the SovSeal client
 */
export interface SovSealClientConfig {
    /** RPC URL for the blockchain network */
    rpcUrl: string;
    /** Address of the deployed SovSeal contract */
    contractAddress: string;
    /** Address of the deployed SovSealRecovery contract (optional) */
    recoveryContractAddress?: string;
    /** Chain ID of the network */
    chainId?: number;
}

/**
 * Message metadata as stored on-chain
 */
export interface MessageMetadata {
    /** Unique message ID */
    id: bigint;
    /** IPFS CID of the encrypted AES key */
    encryptedKeyCid: string;
    /** IPFS CID of the encrypted message blob */
    encryptedMessageCid: string;
    /** SHA-256 hash of the encrypted message */
    messageHash: string;
    /** Unix timestamp when message can be unlocked */
    unlockTimestamp: bigint;
    /** Address of the message sender */
    sender: string;
    /** Address of the message recipient */
    recipient: string;
    /** Timestamp when message was created */
    createdAt: bigint;
}

/**
 * Parameters for creating a new message
 */
export interface CreateMessageParams {
    /** IPFS CID of the encrypted AES key */
    encryptedKeyCid: string;
    /** IPFS CID of the encrypted message blob */
    encryptedMessageCid: string;
    /** SHA-256 hash of the encrypted message */
    messageHash: string;
    /** Unix timestamp when message can be unlocked */
    unlockTimestamp: number;
    /** Address of the message recipient */
    recipient: string;
}

/**
 * Guardian configuration for social recovery
 */
export interface Guardian {
    /** Guardian's wallet address */
    address: string;
    /** Guardian's voting weight */
    weight: number;
    /** Whether the guardian is active */
    isActive: boolean;
}

/**
 * Recovery request status
 */
export interface RecoveryRequest {
    /** Recovery request ID */
    id: bigint;
    /** Original account owner */
    owner: string;
    /** Proposed new owner */
    newOwner: string;
    /** Required approval weight */
    threshold: bigint;
    /** Current approval weight */
    approvalWeight: bigint;
    /** When recovery was initiated */
    initiatedAt: bigint;
    /** When execution becomes possible */
    executeAfter: bigint;
    /** Whether recovery has been executed */
    executed: boolean;
    /** Whether recovery was cancelled */
    cancelled: boolean;
}

/**
 * Transaction result
 */
export interface TransactionResult {
    /** Transaction hash */
    hash: string;
    /** Whether transaction was successful */
    success: boolean;
    /** The message ID (for storeMessage) */
    messageId?: bigint;
}
