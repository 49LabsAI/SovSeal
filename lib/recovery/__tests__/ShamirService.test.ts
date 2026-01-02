/**
 * ShamirService Tests
 *
 * Unit tests for Shamir's Secret Sharing implementation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the shamir-secret-sharing library
vi.mock("shamir-secret-sharing", () => ({
    split: vi.fn(async (secret: Uint8Array, n: number, k: number) => {
        // Create mock shares with proper format (first byte is index)
        const shares: Uint8Array[] = [];
        for (let i = 0; i < n; i++) {
            const share = new Uint8Array(secret.length + 1);
            share[0] = i + 1; // Share index (1-indexed)
            // Fill with mock data derived from secret
            for (let j = 0; j < secret.length; j++) {
                share[j + 1] = (secret[j] + i) % 256;
            }
            shares.push(share);
        }
        return shares;
    }),
    combine: vi.fn(async (shares: Uint8Array[]) => {
        // Mock reconstruction - just return based on first share
        if (shares.length === 0) throw new Error("No shares");
        const share = shares[0];
        const secret = new Uint8Array(share.length - 1);
        const index = share[0] - 1;
        for (let i = 0; i < secret.length; i++) {
            secret[i] = (share[i + 1] - index + 256) % 256;
        }
        return secret;
    }),
}));

// Mock ErrorLogger
vi.mock("@/lib/monitoring/ErrorLogger", () => ({
    ErrorLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { ShamirService } from "../ShamirService";

describe("ShamirService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("splitSecret", () => {
        it("should split a secret into the correct number of shares", async () => {
            const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const threshold = 3;
            const totalShares = 5;

            const result = await ShamirService.splitSecret(
                secret,
                threshold,
                totalShares
            );

            expect(result.shares).toHaveLength(totalShares);
            expect(result.threshold).toBe(threshold);
            expect(result.totalShares).toBe(totalShares);
        });

        it("should use default values when not specified", async () => {
            const secret = new Uint8Array([1, 2, 3, 4]);

            const result = await ShamirService.splitSecret(secret);

            const defaults = ShamirService.getDefaults();
            expect(result.threshold).toBe(defaults.threshold);
            expect(result.totalShares).toBe(defaults.totalShares);
        });

        it("should throw if secret is empty", async () => {
            await expect(
                ShamirService.splitSecret(new Uint8Array([]), 3, 5)
            ).rejects.toThrow("Secret cannot be empty");
        });

        it("should throw if threshold is less than 2", async () => {
            const secret = new Uint8Array([1, 2, 3, 4]);

            await expect(ShamirService.splitSecret(secret, 1, 5)).rejects.toThrow(
                "Threshold must be at least 2"
            );
        });

        it("should throw if total shares exceeds 255", async () => {
            const secret = new Uint8Array([1, 2, 3, 4]);

            await expect(ShamirService.splitSecret(secret, 3, 256)).rejects.toThrow(
                "Cannot create more than 255 shares"
            );
        });

        it("should throw if threshold exceeds total shares", async () => {
            const secret = new Uint8Array([1, 2, 3, 4]);

            await expect(ShamirService.splitSecret(secret, 5, 3)).rejects.toThrow(
                "Threshold (5) cannot exceed total shares (3)"
            );
        });
    });

    describe("combineShares", () => {
        it("should combine shares to reconstruct the secret", async () => {
            const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const { shares } = await ShamirService.splitSecret(secret, 3, 5);

            // Take only threshold shares
            const subsetShares = shares.slice(0, 3);
            const reconstructed = await ShamirService.combineShares(subsetShares);

            // With our mock, it should return the original secret
            expect(reconstructed).toEqual(secret);
        });

        it("should throw if no shares provided", async () => {
            await expect(ShamirService.combineShares([])).rejects.toThrow(
                "No shares provided"
            );
        });

        it("should throw if fewer than 2 shares provided", async () => {
            const share = new Uint8Array([1, 100, 200]);

            await expect(ShamirService.combineShares([share])).rejects.toThrow(
                "At least 2 shares required"
            );
        });
    });

    describe("isValidShare", () => {
        it("should return true for valid share format", () => {
            // Valid share: first byte is index (1-255), at least 2 bytes total
            const validShare = new Uint8Array([1, 100, 200, 50]);
            expect(ShamirService.isValidShare(validShare)).toBe(true);
        });

        it("should return false for null/undefined", () => {
            expect(ShamirService.isValidShare(null as unknown as Uint8Array)).toBe(
                false
            );
            expect(
                ShamirService.isValidShare(undefined as unknown as Uint8Array)
            ).toBe(false);
        });

        it("should return false for share with length < 2", () => {
            expect(ShamirService.isValidShare(new Uint8Array([1]))).toBe(false);
            expect(ShamirService.isValidShare(new Uint8Array([]))).toBe(false);
        });

        it("should return false for share with invalid index", () => {
            // Index 0 is invalid
            expect(ShamirService.isValidShare(new Uint8Array([0, 100, 200]))).toBe(
                false
            );
        });
    });

    describe("getShareIndex", () => {
        it("should return the share index", () => {
            const share = new Uint8Array([5, 100, 200]);
            expect(ShamirService.getShareIndex(share)).toBe(5);
        });

        it("should throw for invalid share", () => {
            expect(() => ShamirService.getShareIndex(new Uint8Array([]))).toThrow(
                "Invalid share format"
            );
        });
    });

    describe("encodeShare / decodeShare", () => {
        it("should encode and decode a share correctly", () => {
            const original = new Uint8Array([1, 100, 200, 50, 75]);

            const encoded = ShamirService.encodeShare(original);
            expect(typeof encoded).toBe("string");

            const decoded = ShamirService.decodeShare(encoded);
            expect(decoded).toEqual(original);
        });
    });

    describe("getDefaults", () => {
        it("should return default threshold and total shares", () => {
            const defaults = ShamirService.getDefaults();

            expect(defaults.threshold).toBe(3);
            expect(defaults.totalShares).toBe(5);
        });
    });
});
