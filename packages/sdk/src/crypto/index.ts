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
export interface EncryptedData {
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
export interface EncryptionMetadata {
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
export class CryptoService {
    private static readonly ALGORITHM = "AES-GCM";
    private static readonly KEY_LENGTH = 256;
    private static readonly IV_LENGTH = 12;
    private static readonly TAG_LENGTH = 16;

    /**
     * Generate a unique 256-bit AES key for encryption
     */
    static async generateAESKey(): Promise<CryptoKey> {
        return await crypto.subtle.generateKey(
            {
                name: this.ALGORITHM,
                length: this.KEY_LENGTH,
            },
            true, // Extractable (needed for encryption to recipient's public key)
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypt a Blob using AES-256-GCM
     * @param blob The data to encrypt
     * @param key The AES key to use
     * @returns Encrypted data with IV
     */
    static async encryptBlob(blob: Blob, key: CryptoKey): Promise<EncryptedData> {
        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

        // Read blob as ArrayBuffer
        const plaintext = await blob.arrayBuffer();

        // Encrypt
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: this.ALGORITHM,
                iv,
                tagLength: this.TAG_LENGTH * 8,
            },
            key,
            plaintext
        );

        return {
            ciphertext,
            iv,
            algorithm: "AES-GCM",
            keyLength: 256,
        };
    }

    /**
     * Decrypt encrypted data using AES-256-GCM
     * @param encryptedData The encrypted data with IV
     * @param key The AES key to use
     * @returns Decrypted data as ArrayBuffer
     */
    static async decryptBlob(
        encryptedData: EncryptedData,
        key: CryptoKey
    ): Promise<ArrayBuffer> {
        return await crypto.subtle.decrypt(
            {
                name: this.ALGORITHM,
                iv: encryptedData.iv as any,
                tagLength: this.TAG_LENGTH * 8,
            },
            key,
            encryptedData.ciphertext as any
        );
    }

    /**
     * Export AES key to raw format for encryption with recipient's public key
     */
    static async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
        return await crypto.subtle.exportKey("raw", key);
    }

    /**
     * Import raw key data back to CryptoKey
     */
    static async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
        return await crypto.subtle.importKey(
            "raw",
            keyData,
            {
                name: this.ALGORITHM,
                length: this.KEY_LENGTH,
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Convert encrypted data to a single Blob (IV prepended to ciphertext)
     */
    static encryptedDataToBlob(encryptedData: EncryptedData): Blob {
        const combined = new Uint8Array(
            encryptedData.iv.length + encryptedData.ciphertext.byteLength
        );
        combined.set(encryptedData.iv, 0);

        // Fix for TS2322: Type 'Uint8Array' is not assignable to type 'ArrayLike<number>'
        // This is a known issue with DOM library types in some environments
        const ciphertextArray = new Uint8Array(encryptedData.ciphertext);
        for (let i = 0; i < ciphertextArray.length; i++) {
            combined[encryptedData.iv.length + i] = ciphertextArray[i];
        }

        return new Blob([combined]);
    }

    /**
     * Extract IV and ciphertext from a combined Blob
     */
    static async blobToEncryptedData(blob: Blob): Promise<EncryptedData> {
        const buffer = await blob.arrayBuffer();
        const data = new Uint8Array(buffer);

        return {
            iv: data.slice(0, this.IV_LENGTH),
            ciphertext: data.slice(this.IV_LENGTH).buffer,
            algorithm: "AES-GCM",
            keyLength: 256,
        };
    }

    /**
     * Calculate SHA-256 hash of data
     */
    static async sha256(data: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    /**
     * Get encryption metadata
     */
    static getMetadata(): EncryptionMetadata {
        return {
            algorithm: "AES-GCM",
            keyLength: 256,
            ivLength: 12,
            tagLength: 16,
        };
    }
}
