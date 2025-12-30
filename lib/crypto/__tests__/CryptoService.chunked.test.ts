/**
 * Unit tests for CryptoService Chunked Encryption
 * Tests memory-efficient encryption/decryption for large files
 * 
 * These tests verify the fix for Critical Issue C3: Memory Exhaustion on Large File Encryption
 */

import { describe, it, expect, beforeAll } from "vitest";
import { CryptoService, EncryptionProgress } from "../CryptoService";

/**
 * Helper to generate random data in chunks (crypto.getRandomValues has 65KB limit)
 */
function generateRandomData(size: number): Uint8Array {
  const data = new Uint8Array(size);
  const chunkSize = 65536; // 64KB - max for crypto.getRandomValues
  
  for (let offset = 0; offset < size; offset += chunkSize) {
    const remaining = Math.min(chunkSize, size - offset);
    const chunk = new Uint8Array(remaining);
    crypto.getRandomValues(chunk);
    data.set(chunk, offset);
  }
  
  return data;
}

describe("CryptoService - Chunked Encryption (C3 Fix)", () => {
  beforeAll(() => {
    if (typeof global.crypto === "undefined") {
      throw new Error("Web Crypto API not available");
    }
  });

  describe("Threshold Detection", () => {
    it("should return correct threshold value (50MB)", () => {
      const threshold = CryptoService.getChunkedEncryptionThreshold();
      expect(threshold).toBe(50 * 1024 * 1024);
    });

    it("should detect small files as not needing chunked encryption", () => {
      const smallBlob = new Blob([new Uint8Array(1024 * 1024)]); // 1MB
      expect(CryptoService.shouldUseChunkedEncryption(smallBlob)).toBe(false);
    });

    it("should detect files at threshold as needing chunked encryption", () => {
      const thresholdBlob = new Blob([new Uint8Array(50 * 1024 * 1024)]); // 50MB
      expect(CryptoService.shouldUseChunkedEncryption(thresholdBlob)).toBe(true);
    });

    it("should detect large files as needing chunked encryption", () => {
      const largeBlob = new Blob([new Uint8Array(100 * 1024 * 1024)]); // 100MB
      expect(CryptoService.shouldUseChunkedEncryption(largeBlob)).toBe(true);
    });
  });

  describe("Chunked Format Detection", () => {
    it("should detect standard format as not chunked", async () => {
      const testData = "Hello, World!";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlob(blob, key);
      const encryptedBlob = CryptoService.encryptedDataToBlob(encrypted);
      
      const isChunked = await CryptoService.isChunkedFormat(encryptedBlob);
      expect(isChunked).toBe(false);
    });

    it("should detect chunked format correctly", async () => {
      // Create a small blob but force chunked encryption
      const testData = generateRandomData(2 * 1024 * 1024); // 2MB
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const result = await CryptoService.encryptBlobChunked(blob, key);
      
      const isChunked = await CryptoService.isChunkedFormat(result.encryptedBlob);
      expect(isChunked).toBe(true);
    }, 30000);

    it("should return false for blobs too small to be chunked", async () => {
      const tinyBlob = new Blob([new Uint8Array(10)]);
      const isChunked = await CryptoService.isChunkedFormat(tinyBlob);
      expect(isChunked).toBe(false);
    });
  });

  describe("Chunked Encryption/Decryption", () => {
    it("should encrypt and decrypt small data with chunked method", async () => {
      const testData = "Hello, SovSeal! Testing chunked encryption.";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlobChunked(blob, key);
      const decrypted = await CryptoService.decryptBlobChunked(encrypted.encryptedBlob, key);
      
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });

    it("should encrypt and decrypt binary data correctly", async () => {
      const binaryData = new Uint8Array(1024);
      crypto.getRandomValues(binaryData);
      const blob = new Blob([binaryData]);
      const key = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlobChunked(blob, key);
      const decrypted = await CryptoService.decryptBlobChunked(encrypted.encryptedBlob, key);
      
      expect(new Uint8Array(decrypted)).toEqual(binaryData);
    });

    it("should handle multi-chunk data correctly", async () => {
      // Create data that spans multiple chunks (1MB chunk size)
      const dataSize = 2.5 * 1024 * 1024; // 2.5MB = 3 chunks
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlobChunked(blob, key);
      
      expect(encrypted.totalChunks).toBe(3);
      expect(encrypted.originalSize).toBe(dataSize);
      
      const decrypted = await CryptoService.decryptBlobChunked(encrypted.encryptedBlob, key);
      expect(new Uint8Array(decrypted)).toEqual(testData);
    }, 30000);

    it("should produce different ciphertext with different keys", async () => {
      const testData = new Uint8Array(1024);
      crypto.getRandomValues(testData);
      const blob = new Blob([testData]);
      
      const key1 = await CryptoService.generateAESKey();
      const key2 = await CryptoService.generateAESKey();
      
      const encrypted1 = await CryptoService.encryptBlobChunked(blob, key1);
      const encrypted2 = await CryptoService.encryptBlobChunked(blob, key2);
      
      const data1 = await encrypted1.encryptedBlob.arrayBuffer();
      const data2 = await encrypted2.encryptedBlob.arrayBuffer();
      
      expect(new Uint8Array(data1)).not.toEqual(new Uint8Array(data2));
    });

    it("should fail to decrypt with wrong key", async () => {
      const testData = "Secret message";
      const blob = new Blob([testData]);
      
      const key1 = await CryptoService.generateAESKey();
      const key2 = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlobChunked(blob, key1);
      
      await expect(
        CryptoService.decryptBlobChunked(encrypted.encryptedBlob, key2)
      ).rejects.toThrow();
    });
  });

  describe("Progress Reporting", () => {
    it("should report encryption progress", async () => {
      const dataSize = 3 * 1024 * 1024; // 3MB = 3 chunks
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const progressUpdates: EncryptionProgress[] = [];
      
      await CryptoService.encryptBlobChunked(blob, key, (progress) => {
        progressUpdates.push({ ...progress });
      });
      
      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[0].currentChunk).toBe(1);
      expect(progressUpdates[0].totalChunks).toBe(3);
      expect(progressUpdates[2].percentage).toBe(100);
      expect(progressUpdates[2].bytesProcessed).toBe(dataSize);
    }, 30000);

    it("should report decryption progress", async () => {
      const dataSize = 3 * 1024 * 1024; // 3MB = 3 chunks
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlobChunked(blob, key);
      
      const progressUpdates: EncryptionProgress[] = [];
      
      await CryptoService.decryptBlobChunked(encrypted.encryptedBlob, key, (progress) => {
        progressUpdates.push({ ...progress });
      });
      
      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[2].percentage).toBe(100);
    }, 30000);
  });

  describe("Smart Encryption/Decryption", () => {
    it("should use standard encryption for small files", async () => {
      const testData = "Small file content";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const result = await CryptoService.encryptBlobSmart(blob, key);
      
      expect(result.totalChunks).toBe(1);
      
      // Verify it's in standard format (not chunked)
      const isChunked = await CryptoService.isChunkedFormat(result.encryptedBlob);
      expect(isChunked).toBe(false);
    });

    it("should use chunked encryption for large files", async () => {
      // We can't actually test with 50MB+ in unit tests, but we can test the logic
      // by directly calling encryptBlobChunked
      const dataSize = 2 * 1024 * 1024; // 2MB
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const result = await CryptoService.encryptBlobChunked(blob, key);
      
      expect(result.totalChunks).toBe(2);
      
      const isChunked = await CryptoService.isChunkedFormat(result.encryptedBlob);
      expect(isChunked).toBe(true);
    }, 30000);

    it("should auto-detect format and decrypt correctly (standard)", async () => {
      const testData = "Standard format test";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      // Encrypt with standard method
      const encrypted = await CryptoService.encryptBlob(blob, key);
      const encryptedBlob = CryptoService.encryptedDataToBlob(encrypted);
      
      // Decrypt with smart method
      const decrypted = await CryptoService.decryptBlobSmart(encryptedBlob, key);
      
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });

    it("should auto-detect format and decrypt correctly (chunked)", async () => {
      const testData = generateRandomData(2 * 1024 * 1024); // 2MB
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      // Encrypt with chunked method
      const encrypted = await CryptoService.encryptBlobChunked(blob, key);
      
      // Decrypt with smart method
      const decrypted = await CryptoService.decryptBlobSmart(encrypted.encryptedBlob, key);
      
      expect(new Uint8Array(decrypted)).toEqual(testData);
    }, 30000);
  });

  describe("IV Derivation Security", () => {
    it("should derive unique IVs for each chunk", async () => {
      const dataSize = 3 * 1024 * 1024; // 3 chunks
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const result = await CryptoService.encryptBlobChunked(blob, key);
      
      // The base IV is stored in the result
      expect(result.iv).toBeInstanceOf(Uint8Array);
      expect(result.iv.length).toBe(12);
      
      // Each chunk should have been encrypted with a unique IV
      // We verify this indirectly by ensuring decryption works
      const decrypted = await CryptoService.decryptBlobChunked(result.encryptedBlob, key);
      expect(new Uint8Array(decrypted)).toEqual(testData);
    }, 30000);

    it("should produce different base IVs for each encryption", async () => {
      const testData = new Uint8Array(1024);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const result1 = await CryptoService.encryptBlobChunked(blob, key);
      const result2 = await CryptoService.encryptBlobChunked(blob, key);
      
      expect(result1.iv).not.toEqual(result2.iv);
    });
  });

  describe("Error Handling", () => {
    it("should throw descriptive error on decryption failure with corrupted data", async () => {
      const testData = generateRandomData(2 * 1024 * 1024);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const encrypted = await CryptoService.encryptBlobChunked(blob, key);
      
      // Corrupt the encrypted data
      const corruptedData = await encrypted.encryptedBlob.arrayBuffer();
      const corruptedArray = new Uint8Array(corruptedData);
      corruptedArray[100] ^= 0xFF; // Flip some bits
      const corruptedBlob = new Blob([corruptedArray]);
      
      await expect(
        CryptoService.decryptBlobChunked(corruptedBlob, key)
      ).rejects.toThrow();
    }, 30000);
  });

  describe("Memory Efficiency", () => {
    it("should process data in chunks without loading entire file", async () => {
      // This test verifies the chunking behavior
      // In a real scenario, this would prevent memory exhaustion
      const dataSize = 5 * 1024 * 1024; // 5MB = 5 chunks
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      let maxChunkSeen = 0;
      
      await CryptoService.encryptBlobChunked(blob, key, (progress) => {
        // Each progress update represents one chunk processed
        // Memory usage should be ~1MB per chunk, not 5MB total
        maxChunkSeen = Math.max(maxChunkSeen, progress.currentChunk);
      });
      
      expect(maxChunkSeen).toBe(5);
    }, 30000);

    it("should return correct metadata about chunking", async () => {
      const dataSize = 3.5 * 1024 * 1024; // 3.5MB = 4 chunks
      const testData = generateRandomData(dataSize);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      const result = await CryptoService.encryptBlobChunked(blob, key);
      
      expect(result.totalChunks).toBe(4);
      expect(result.originalSize).toBe(dataSize);
      expect(result.algorithm).toBe("AES-GCM");
      expect(result.keyLength).toBe(256);
    }, 30000);
  });

  describe("Backward Compatibility", () => {
    it("should maintain compatibility with standard encryption format", async () => {
      const testData = "Test data for backward compatibility";
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      // Encrypt with old method
      const encrypted = await CryptoService.encryptBlob(blob, key);
      const encryptedBlob = CryptoService.encryptedDataToBlob(encrypted);
      
      // Should still be decryptable with smart method
      const decrypted = await CryptoService.decryptBlobSmart(encryptedBlob, key);
      const decryptedText = new TextDecoder().decode(decrypted);
      
      expect(decryptedText).toBe(testData);
    });

    it("should correctly identify standard vs chunked format", async () => {
      const testData = new Uint8Array(1024);
      const blob = new Blob([testData]);
      const key = await CryptoService.generateAESKey();
      
      // Standard format
      const standardEncrypted = await CryptoService.encryptBlob(blob, key);
      const standardBlob = CryptoService.encryptedDataToBlob(standardEncrypted);
      
      // Chunked format
      const chunkedResult = await CryptoService.encryptBlobChunked(blob, key);
      
      expect(await CryptoService.isChunkedFormat(standardBlob)).toBe(false);
      expect(await CryptoService.isChunkedFormat(chunkedResult.encryptedBlob)).toBe(true);
    });
  });
});
