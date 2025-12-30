/**
 * Unit tests for CryptoService
 * Tests encryption/decryption, key generation, and secure cleanup
 */

import { describe, it, expect, beforeAll } from "vitest";
import { CryptoService } from "../CryptoService";

describe("CryptoService", () => {
  beforeAll(() => {
    // Ensure crypto is available
    if (typeof global.crypto === "undefined") {
      throw new Error("Web Crypto API not available");
    }
  });

  describe("Key Generation", () => {
    it("should generate a valid AES-256 key", async () => {
      const key = await CryptoService.generateAESKey();

      expect(key).toBeDefined();
      expect(key.type).toBe("secret");
      expect(key.algorithm.name).toBe("AES-GCM");
    });

    it("should generate unique keys", async () => {
      const key1 = await CryptoService.generateAESKey();
      const key2 = await CryptoService.generateAESKey();

      const exported1 = await CryptoService.exportKey(key1);
      const exported2 = await CryptoService.exportKey(key2);

      expect(new Uint8Array(exported1)).not.toEqual(new Uint8Array(exported2));
    });
  });

  describe("Blob Encryption", () => {
    it("should encrypt a blob successfully", async () => {
      const testData = "Hello, SovSeal!";
      const blob = new Blob([testData], { type: "text/plain" });
      const key = await CryptoService.generateAESKey();

      const encrypted = await CryptoService.encryptBlob(blob, key);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeInstanceOf(ArrayBuffer);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv.length).toBe(12); // 96 bits
      expect(encrypted.algorithm).toBe("AES-GCM");
      expect(encrypted.keyLength).toBe(256);
    });

    it("should produce different ciphertext for same data with different keys", async () => {
      const testData = "Test data";
      const blob = new Blob([testData]);

      const key1 = await CryptoService.generateAESKey();
      const key2 = await CryptoService.generateAESKey();

      const encrypted1 = await CryptoService.encryptBlob(blob, key1);
      const encrypted2 = await CryptoService.encryptBlob(blob, key2);

      expect(new Uint8Array(encrypted1.ciphertext)).not.toEqual(
        new Uint8Array(encrypted2.ciphertext)
      );
    });

    it("should produce different ciphertext for same data with same key (different IV)", async () => {
      const testData = "Test data";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();

      const encrypted1 = await CryptoService.encryptBlob(blob, key);
      const encrypted2 = await CryptoService.encryptBlob(blob, key);

      // IVs should be different
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
      // Ciphertext should be different due to different IVs
      expect(new Uint8Array(encrypted1.ciphertext)).not.toEqual(
        new Uint8Array(encrypted2.ciphertext)
      );
    });
  });

  describe("Blob Decryption", () => {
    it("should decrypt encrypted blob correctly", async () => {
      const testData = "Hello, SovSeal!";
      const blob = new Blob([testData], { type: "text/plain" });
      const key = await CryptoService.generateAESKey();

      const encrypted = await CryptoService.encryptBlob(blob, key);
      const decrypted = await CryptoService.decryptBlob(encrypted, key);

      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });

    it("should fail to decrypt with wrong key", async () => {
      const testData = "Secret message";
      const blob = new Blob([testData]);

      const key1 = await CryptoService.generateAESKey();
      const key2 = await CryptoService.generateAESKey();

      const encrypted = await CryptoService.encryptBlob(blob, key1);

      await expect(
        CryptoService.decryptBlob(encrypted, key2)
      ).rejects.toThrow();
    });

    it("should handle binary data correctly", async () => {
      const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
      const blob = new Blob([binaryData]);
      const key = await CryptoService.generateAESKey();

      const encrypted = await CryptoService.encryptBlob(blob, key);
      const decrypted = await CryptoService.decryptBlob(encrypted, key);

      expect(new Uint8Array(decrypted)).toEqual(binaryData);
    });
  });

  describe("Key Export/Import", () => {
    it("should export and import key correctly", async () => {
      const originalKey = await CryptoService.generateAESKey();
      const exported = await CryptoService.exportKey(originalKey);
      const imported = await CryptoService.importKey(exported);

      // Test that imported key works for encryption/decryption
      const testData = "Test data";
      const blob = new Blob([testData]);

      const encrypted = await CryptoService.encryptBlob(blob, originalKey);
      const decrypted = await CryptoService.decryptBlob(encrypted, imported);

      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });

    it("should export key as ArrayBuffer", async () => {
      const key = await CryptoService.generateAESKey();
      const exported = await CryptoService.exportKey(key);

      expect(exported).toBeInstanceOf(ArrayBuffer);
      expect(exported.byteLength).toBe(32); // 256 bits = 32 bytes
    });
  });

  describe("Blob Conversion", () => {
    it("should convert encrypted data to blob", async () => {
      const testData = "Test data";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();

      const encrypted = await CryptoService.encryptBlob(blob, key);
      const encryptedBlob = CryptoService.encryptedDataToBlob(encrypted);

      expect(encryptedBlob).toBeInstanceOf(Blob);
      expect(encryptedBlob.type).toBe("application/octet-stream");
    });

    it("should convert blob back to encrypted data", async () => {
      const testData = "Test data";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();

      const encrypted = await CryptoService.encryptBlob(blob, key);
      const encryptedBlob = CryptoService.encryptedDataToBlob(encrypted);
      const recovered = await CryptoService.blobToEncryptedData(encryptedBlob);

      expect(recovered.iv).toEqual(encrypted.iv);
      expect(new Uint8Array(recovered.ciphertext)).toEqual(
        new Uint8Array(encrypted.ciphertext)
      );
    });

    it("should maintain data integrity through blob conversion", async () => {
      const testData = "Hello, World!";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();

      // Encrypt
      const encrypted = await CryptoService.encryptBlob(blob, key);

      // Convert to blob and back
      const encryptedBlob = CryptoService.encryptedDataToBlob(encrypted);
      const recovered = await CryptoService.blobToEncryptedData(encryptedBlob);

      // Decrypt recovered data
      const decrypted = await CryptoService.decryptBlob(recovered, key);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBe(testData);
    });
  });

  describe("Secure Cleanup", () => {
    it("should handle null and undefined buffers", () => {
      expect(() => {
        CryptoService.secureCleanup(null, undefined);
      }).not.toThrow();
    });

    it("should handle ArrayBuffer cleanup", () => {
      const buffer = new ArrayBuffer(32);
      const view = new Uint8Array(buffer);
      view.fill(255);

      CryptoService.secureCleanup(buffer);

      // Buffer should be zeroed
      expect(Array.from(view).every((byte) => byte === 0)).toBe(true);
    });

    it("should handle Uint8Array cleanup", () => {
      const array = new Uint8Array(32);
      array.fill(255);

      CryptoService.secureCleanup(array);

      // Array should be zeroed
      expect(Array.from(array).every((byte) => byte === 0)).toBe(true);
    });

    it("should handle multiple buffers", () => {
      const buffer1 = new Uint8Array(16).fill(255);
      const buffer2 = new Uint8Array(16).fill(255);

      CryptoService.secureCleanup(buffer1, buffer2);

      expect(Array.from(buffer1).every((byte) => byte === 0)).toBe(true);
      expect(Array.from(buffer2).every((byte) => byte === 0)).toBe(true);
    });
  });

  describe("Metadata", () => {
    it("should return correct encryption metadata", () => {
      const metadata = CryptoService.getMetadata();

      expect(metadata.algorithm).toBe("AES-GCM");
      expect(metadata.keyLength).toBe(256);
      expect(metadata.ivLength).toBe(12);
      expect(metadata.tagLength).toBe(16);
    });
  });
});
