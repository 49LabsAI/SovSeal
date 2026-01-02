/**
 * Service for creating and managing redeem packages for recipients without wallets
 *
 * This service enables senders to create passphrase-protected packages that allow
 * recipients to claim messages after setting up a wallet.
 */

import type {
  RedeemPackage,
  EncryptedRedeemPackage,
  ClaimLink,
  DecryptedRedeemPackage,
} from "@/types/redeem";

export class RedeemPackageService {
  /**
   * Derives a cryptographic key from a passphrase using PBKDF2
   *
   * @param passphrase - User-provided passphrase
   * @param salt - Random salt for key derivation
   * @returns Derived AES-GCM key
   */
  private static async deriveKeyFromPassphrase(
    passphrase: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    // Import passphrase as key material
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    // Derive AES-GCM key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: 100000, // OWASP recommended minimum
        hash: "SHA-256",
      },
      passphraseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Creates a redeem package with the provided message metadata
   *
   * @param encryptedKeyCID - CID of the encrypted AES key
   * @param encryptedMessageCID - CID of the encrypted message blob
   * @param messageHash - SHA-256 hash of encrypted message
   * @param unlockTimestamp - When the message can be unlocked
   * @param sender - Sender's wallet address
   * @param expirationDays - Days until package expires (default: 365 for legacy use cases)
   * @returns Redeem package object
   */
  static createRedeemPackage(
    encryptedKeyCID: string,
    encryptedMessageCID: string,
    messageHash: string,
    unlockTimestamp: number,
    sender: string,
    expirationDays: number = 365
  ): RedeemPackage {
    const expiresAt = Date.now() + expirationDays * 24 * 60 * 60 * 1000;

    return {
      encryptedKeyCID,
      encryptedMessageCID,
      messageHash,
      unlockTimestamp,
      sender,
      instructions: `This is a time-locked message from ${sender}. To claim this message:
1. Install the Talisman wallet browser extension
2. Create or import a wallet
3. Return to this page and enter the passphrase shared with you
4. Wait until ${new Date(unlockTimestamp).toLocaleString()} to unlock the message`,
      expiresAt,
    };
  }

  /**
   * Encrypts a redeem package with a passphrase
   *
   * @param redeemPackage - Package to encrypt
   * @param passphrase - User-provided passphrase
   * @returns Encrypted package with IV and salt
   */
  static async encryptRedeemPackage(
    redeemPackage: RedeemPackage,
    passphrase: string
  ): Promise<EncryptedRedeemPackage> {
    if (!passphrase || passphrase.length < 8) {
      throw new Error("Passphrase must be at least 8 characters long");
    }

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from passphrase
    const key = await this.deriveKeyFromPassphrase(passphrase, salt);

    // Convert package to JSON and encrypt
    const encoder = new TextEncoder();
    const packageData = encoder.encode(JSON.stringify(redeemPackage));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      packageData
    );

    return {
      encryptedData,
      iv,
      salt,
    };
  }

  /**
   * Decrypts a redeem package with a passphrase
   *
   * @param encryptedPackage - Encrypted package data
   * @param passphrase - User-provided passphrase
   * @returns Decrypted redeem package
   */
  static async decryptRedeemPackage(
    encryptedPackage: EncryptedRedeemPackage,
    passphrase: string
  ): Promise<DecryptedRedeemPackage> {
    try {
      // Derive key from passphrase
      const key = await this.deriveKeyFromPassphrase(
        passphrase,
        encryptedPackage.salt
      );

      // Decrypt package data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: encryptedPackage.iv as BufferSource,
        },
        key,
        encryptedPackage.encryptedData as BufferSource
      );

      // Parse JSON
      const decoder = new TextDecoder();
      const packageJson = decoder.decode(decryptedData);
      const redeemPackage = JSON.parse(packageJson) as RedeemPackage;

      // Verify expiration
      if (redeemPackage.expiresAt && Date.now() > redeemPackage.expiresAt) {
        throw new Error("This redeem package has expired");
      }

      return {
        ...redeemPackage,
        decrypted: true,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        throw error;
      }
      throw new Error("Invalid passphrase or corrupted package");
    }
  }

  /**
   * Serializes an encrypted package for IPFS upload
   *
   * @param encryptedPackage - Encrypted package
   * @returns Blob ready for upload
   */
  static serializeEncryptedPackage(
    encryptedPackage: EncryptedRedeemPackage
  ): Blob {
    // Create a structured format: salt (16 bytes) + iv (12 bytes) + encrypted data
    const saltArray = new Uint8Array(encryptedPackage.salt);
    const ivArray = new Uint8Array(encryptedPackage.iv);
    const dataArray = new Uint8Array(encryptedPackage.encryptedData);

    const combined = new Uint8Array(
      saltArray.length + ivArray.length + dataArray.length
    );
    combined.set(saltArray, 0);
    combined.set(ivArray, saltArray.length);
    combined.set(dataArray, saltArray.length + ivArray.length);

    return new Blob([combined], { type: "application/octet-stream" });
  }

  /**
   * Deserializes an encrypted package from IPFS download
   *
   * @param blob - Downloaded blob
   * @returns Encrypted package object
   */
  static async deserializeEncryptedPackage(
    blob: Blob
  ): Promise<EncryptedRedeemPackage> {
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Extract salt (first 16 bytes), iv (next 12 bytes), and encrypted data (rest)
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encryptedData = data.slice(28).buffer;

    return {
      encryptedData,
      iv,
      salt,
    };
  }

  /**
   * Generates a claim link for a redeem package
   *
   * @param packageCID - CID of the encrypted package on IPFS
   * @param baseUrl - Base URL of the application
   * @param expiresAt - Optional expiration timestamp
   * @returns Claim link object
   */
  static generateClaimLink(
    packageCID: string,
    baseUrl: string,
    expiresAt?: number
  ): ClaimLink {
    const url = `${baseUrl}/claim/${packageCID}`;
    return {
      url,
      packageCID,
      expiresAt,
    };
  }
}
