import { ethers } from 'ethers';

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
interface SovSealClientConfig {
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
interface MessageMetadata {
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
interface CreateMessageParams {
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
 * Transaction result
 */
interface TransactionResult {
    /** Transaction hash */
    hash: string;
    /** Whether transaction was successful */
    success: boolean;
    /** The message ID (for storeMessage) */
    messageId?: bigint;
}

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
declare class SovSealClient {
    private config;
    private provider;
    private contract;
    private signer;
    constructor(config: SovSealClientConfig);
    /**
     * Connect a signer for write operations
     */
    connect(signer: ethers.Signer): SovSealClient;
    /**
     * Store a new time-locked message on-chain
     * @param params Message creation parameters
     * @returns Transaction result with message ID
     */
    storeMessage(params: CreateMessageParams): Promise<TransactionResult>;
    /**
     * Get all messages sent by an address
     */
    getSentMessages(sender: string): Promise<MessageMetadata[]>;
    /**
     * Get all messages received by an address
     */
    getReceivedMessages(recipient: string): Promise<MessageMetadata[]>;
    /**
     * Get a specific message by ID
     */
    getMessage(messageId: bigint): Promise<MessageMetadata>;
    /**
     * Get total message count
     */
    getMessageCount(): Promise<bigint>;
    /**
     * Check if a message can be unlocked (timestamp has passed)
     */
    isUnlockable(message: MessageMetadata): boolean;
    /**
     * Get time remaining until unlock (in milliseconds)
     */
    getTimeUntilUnlock(message: MessageMetadata): number;
    /**
     * Parse raw contract response to MessageMetadata
     */
    private parseMessageMetadata;
}

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
 * Encrypted data structure
 */
interface EncryptedData {
    /** The encrypted ciphertext */
    ciphertext: ArrayBuffer;
    /** Initialization vector (12 bytes for AES-GCM) */
    iv: Uint8Array;
    /** Encryption algorithm used */
    algorithm: "AES-GCM";
    /** Key length in bits */
    keyLength: 256;
}
/**
 * Encryption metadata
 */
interface EncryptionMetadata {
    algorithm: "AES-GCM";
    keyLength: 256;
    ivLength: 12;
    tagLength: 16;
}
/**
 * CryptoService - Core encryption utilities for the SovSeal Protocol
 *
 * Implements AES-256-GCM encryption using the Web Crypto API.
 * All encryption is performed client-side for true zero-knowledge security.
 *
 * @example
 * ```typescript
 * import { CryptoService } from '@sovseal/sdk';
 *
 * // Generate a new encryption key
 * const key = await CryptoService.generateAESKey();
 *
 * // Encrypt data
 * const blob = new Blob(['Hello, future!']);
 * const encrypted = await CryptoService.encryptBlob(blob, key);
 *
 * // Decrypt data
 * const decrypted = await CryptoService.decryptBlob(encrypted, key);
 * ```
 */
declare class CryptoService {
    private static readonly ALGORITHM;
    private static readonly KEY_LENGTH;
    private static readonly IV_LENGTH;
    private static readonly TAG_LENGTH;
    /**
     * Generate a unique 256-bit AES key for encryption
     */
    static generateAESKey(): Promise<CryptoKey>;
    /**
     * Encrypt a Blob using AES-256-GCM
     * @param blob The data to encrypt
     * @param key The AES key to use
     * @returns Encrypted data with IV
     */
    static encryptBlob(blob: Blob, key: CryptoKey): Promise<EncryptedData>;
    /**
     * Decrypt encrypted data using AES-256-GCM
     * @param encryptedData The encrypted data with IV
     * @param key The AES key to use
     * @returns Decrypted data as ArrayBuffer
     */
    static decryptBlob(encryptedData: EncryptedData, key: CryptoKey): Promise<ArrayBuffer>;
    /**
     * Export AES key to raw format for encryption with recipient's public key
     */
    static exportKey(key: CryptoKey): Promise<ArrayBuffer>;
    /**
     * Import raw key data back to CryptoKey
     */
    static importKey(keyData: ArrayBuffer): Promise<CryptoKey>;
    /**
     * Convert encrypted data to a single Blob (IV prepended to ciphertext)
     */
    static encryptedDataToBlob(encryptedData: EncryptedData): Blob;
    /**
     * Extract IV and ciphertext from a combined Blob
     */
    static blobToEncryptedData(blob: Blob): Promise<EncryptedData>;
    /**
     * Calculate SHA-256 hash of data
     */
    static sha256(data: ArrayBuffer): Promise<string>;
    /**
     * Get encryption metadata
     */
    static getMetadata(): EncryptionMetadata;
}

export { type CreateMessageParams, CryptoService, type EncryptedData, type EncryptionMetadata, type MessageMetadata, SovSealClient, type SovSealClientConfig };
