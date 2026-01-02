// src/client.ts
import { ethers } from "ethers";
var SOVSEAL_ABI = [
  "function storeMessage(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address recipient) returns (uint64)",
  "function getSentMessages(address sender) view returns (tuple(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address sender, address recipient, uint64 createdAt)[])",
  "function getReceivedMessages(address recipient) view returns (tuple(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address sender, address recipient, uint64 createdAt)[])",
  "function getMessage(uint64 messageId) view returns (tuple(string encryptedKeyCid, string encryptedMessageCid, string messageHash, uint64 unlockTimestamp, address sender, address recipient, uint64 createdAt))",
  "function getMessageCount() view returns (uint64)",
  "event MessageStored(uint64 indexed messageId, address indexed sender, address indexed recipient, uint64 unlockTimestamp)"
];
var SovSealClient = class {
  constructor(config) {
    this.config = config;
    this.signer = null;
    /**
     * Parse raw contract response to MessageMetadata
     */
    this.parseMessageMetadata = (raw, index) => ({
      id: BigInt(index ?? 0),
      encryptedKeyCid: raw.encryptedKeyCid,
      encryptedMessageCid: raw.encryptedMessageCid,
      messageHash: raw.messageHash,
      unlockTimestamp: BigInt(raw.unlockTimestamp),
      sender: raw.sender,
      recipient: raw.recipient,
      createdAt: BigInt(raw.createdAt)
    });
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
  connect(signer) {
    this.signer = signer;
    this.contract = this.contract.connect(signer);
    return this;
  }
  /**
   * Store a new time-locked message on-chain
   * @param params Message creation parameters
   * @returns Transaction result with message ID
   */
  async storeMessage(params) {
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
    const event = receipt.logs.find(
      (log) => log.topics[0] === ethers.id("MessageStored(uint64,address,address,uint64)")
    );
    let messageId;
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
      messageId
    };
  }
  /**
   * Get all messages sent by an address
   */
  async getSentMessages(sender) {
    const messages = await this.contract.getSentMessages(sender);
    return messages.map(this.parseMessageMetadata);
  }
  /**
   * Get all messages received by an address
   */
  async getReceivedMessages(recipient) {
    const messages = await this.contract.getReceivedMessages(recipient);
    return messages.map(this.parseMessageMetadata);
  }
  /**
   * Get a specific message by ID
   */
  async getMessage(messageId) {
    const message = await this.contract.getMessage(messageId);
    return {
      ...this.parseMessageMetadata(message),
      id: messageId
    };
  }
  /**
   * Get total message count
   */
  async getMessageCount() {
    return await this.contract.getMessageCount();
  }
  /**
   * Check if a message can be unlocked (timestamp has passed)
   */
  isUnlockable(message) {
    return BigInt(Date.now()) >= message.unlockTimestamp * 1000n;
  }
  /**
   * Get time remaining until unlock (in milliseconds)
   */
  getTimeUntilUnlock(message) {
    const unlockTimeMs = Number(message.unlockTimestamp) * 1e3;
    const remaining = unlockTimeMs - Date.now();
    return Math.max(0, remaining);
  }
};

// src/crypto/index.ts
var CryptoService = class {
  /**
   * Generate a unique 256-bit AES key for encryption
   */
  static async generateAESKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      // Extractable (needed for encryption to recipient's public key)
      ["encrypt", "decrypt"]
    );
  }
  /**
   * Encrypt a Blob using AES-256-GCM
   * @param blob The data to encrypt
   * @param key The AES key to use
   * @returns Encrypted data with IV
   */
  static async encryptBlob(blob, key) {
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const plaintext = await blob.arrayBuffer();
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv,
        tagLength: this.TAG_LENGTH * 8
      },
      key,
      plaintext
    );
    return {
      ciphertext,
      iv,
      algorithm: "AES-GCM",
      keyLength: 256
    };
  }
  /**
   * Decrypt encrypted data using AES-256-GCM
   * @param encryptedData The encrypted data with IV
   * @param key The AES key to use
   * @returns Decrypted data as ArrayBuffer
   */
  static async decryptBlob(encryptedData, key) {
    return await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: encryptedData.iv,
        tagLength: this.TAG_LENGTH * 8
      },
      key,
      encryptedData.ciphertext
    );
  }
  /**
   * Export AES key to raw format for encryption with recipient's public key
   */
  static async exportKey(key) {
    return await crypto.subtle.exportKey("raw", key);
  }
  /**
   * Import raw key data back to CryptoKey
   */
  static async importKey(keyData) {
    return await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ["encrypt", "decrypt"]
    );
  }
  /**
   * Convert encrypted data to a single Blob (IV prepended to ciphertext)
   */
  static encryptedDataToBlob(encryptedData) {
    const combined = new Uint8Array(
      encryptedData.iv.length + encryptedData.ciphertext.byteLength
    );
    combined.set(encryptedData.iv, 0);
    const ciphertextArray = new Uint8Array(encryptedData.ciphertext);
    for (let i = 0; i < ciphertextArray.length; i++) {
      combined[encryptedData.iv.length + i] = ciphertextArray[i];
    }
    return new Blob([combined]);
  }
  /**
   * Extract IV and ciphertext from a combined Blob
   */
  static async blobToEncryptedData(blob) {
    const buffer = await blob.arrayBuffer();
    const data = new Uint8Array(buffer);
    return {
      iv: data.slice(0, this.IV_LENGTH),
      ciphertext: data.slice(this.IV_LENGTH).buffer,
      algorithm: "AES-GCM",
      keyLength: 256
    };
  }
  /**
   * Calculate SHA-256 hash of data
   */
  static async sha256(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Get encryption metadata
   */
  static getMetadata() {
    return {
      algorithm: "AES-GCM",
      keyLength: 256,
      ivLength: 12,
      tagLength: 16
    };
  }
};
CryptoService.ALGORITHM = "AES-GCM";
CryptoService.KEY_LENGTH = 256;
CryptoService.IV_LENGTH = 12;
CryptoService.TAG_LENGTH = 16;
export {
  CryptoService,
  SovSealClient
};
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
