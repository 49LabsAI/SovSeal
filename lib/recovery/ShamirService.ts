/**
 * ShamirService - Shamir's Secret Sharing implementation
 *
 * Wraps the audited `shamir-secret-sharing` library (by Privy) for
 * secure key splitting and reconstruction.
 *
 * Security: Uses GF(2^8), audited by Cure53 and Zellic.
 */

"use client";

import { split, combine } from "shamir-secret-sharing";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import type { SplitResult } from "./types";

const LOG_CONTEXT = "ShamirService";

// Default configuration
const DEFAULT_THRESHOLD = 3; // Minimum shares needed
const DEFAULT_TOTAL_SHARES = 5; // Total shares to create
const MIN_THRESHOLD = 2;
const MAX_SHARES = 255; // GF(2^8) limit

export class ShamirService {
    /**
     * Split a secret into n shares, requiring k to reconstruct
     *
     * @param secret The secret to split (e.g., AES key)
     * @param threshold Minimum shares required to reconstruct (k)
     * @param totalShares Total number of shares to create (n)
     * @returns Array of shares as Uint8Arrays
     */
    static async splitSecret(
        secret: Uint8Array,
        threshold: number = DEFAULT_THRESHOLD,
        totalShares: number = DEFAULT_TOTAL_SHARES
    ): Promise<SplitResult> {
        // Validate inputs
        this.validateSplitParams(secret, threshold, totalShares);

        try {
            ErrorLogger.info(LOG_CONTEXT, "Splitting secret", {
                secretLength: secret.length,
                threshold,
                totalShares,
            });

            const shares = await split(secret, totalShares, threshold);

            ErrorLogger.info(LOG_CONTEXT, "Secret split successfully", {
                sharesCreated: shares.length,
            });

            return {
                shares,
                threshold,
                totalShares,
            };
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "splitSecret", threshold, totalShares }
            );
            throw new Error(
                `Failed to split secret: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Combine k shares to reconstruct the original secret
     *
     * @param shares Array of shares (must have at least threshold shares)
     * @returns The reconstructed secret
     */
    static async combineShares(shares: Uint8Array[]): Promise<Uint8Array> {
        if (!shares || shares.length === 0) {
            throw new Error("No shares provided for reconstruction");
        }

        if (shares.length < MIN_THRESHOLD) {
            throw new Error(
                `At least ${MIN_THRESHOLD} shares required, got ${shares.length}`
            );
        }

        // Validate share formats
        for (let i = 0; i < shares.length; i++) {
            if (!this.isValidShare(shares[i])) {
                throw new Error(`Invalid share format at index ${i}`);
            }
        }

        try {
            ErrorLogger.info(LOG_CONTEXT, "Combining shares", {
                shareCount: shares.length,
            });

            const secret = await combine(shares);

            ErrorLogger.info(LOG_CONTEXT, "Shares combined successfully", {
                secretLength: secret.length,
            });

            return secret;
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "combineShares", shareCount: shares.length }
            );
            throw new Error(
                `Failed to reconstruct secret: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Validate that a share has the correct format
     *
     * Shares from shamir-secret-sharing have a specific structure:
     * - First byte is the share index (x-coordinate)
     * - Remaining bytes are the share value (y-coordinates for each byte)
     *
     * @param share The share to validate
     * @returns true if valid, false otherwise
     */
    static isValidShare(share: Uint8Array): boolean {
        if (!share || !(share instanceof Uint8Array)) {
            return false;
        }

        // Shares must have at least 2 bytes (index + at least 1 byte of data)
        if (share.length < 2) {
            return false;
        }

        // First byte is the share index (1-indexed), must be in valid range
        const index = share[0];
        if (index < 1 || index > MAX_SHARES) {
            return false;
        }

        return true;
    }

    /**
     * Get the index (x-coordinate) of a share
     *
     * @param share The share
     * @returns The share index (1-indexed)
     */
    static getShareIndex(share: Uint8Array): number {
        if (!this.isValidShare(share)) {
            throw new Error("Invalid share format");
        }
        return share[0];
    }

    /**
     * Encode a share to base64 for storage/transmission
     *
     * @param share The share as Uint8Array
     * @returns Base64 encoded string
     */
    static encodeShare(share: Uint8Array): string {
        return Buffer.from(share).toString("base64");
    }

    /**
     * Decode a base64 share back to Uint8Array
     *
     * @param encoded Base64 encoded share
     * @returns The share as Uint8Array
     */
    static decodeShare(encoded: string): Uint8Array {
        return new Uint8Array(Buffer.from(encoded, "base64"));
    }

    /**
     * Validate split parameters
     */
    private static validateSplitParams(
        secret: Uint8Array,
        threshold: number,
        totalShares: number
    ): void {
        if (!secret || secret.length === 0) {
            throw new Error("Secret cannot be empty");
        }

        if (threshold < MIN_THRESHOLD) {
            throw new Error(`Threshold must be at least ${MIN_THRESHOLD}`);
        }

        if (totalShares > MAX_SHARES) {
            throw new Error(`Cannot create more than ${MAX_SHARES} shares`);
        }

        if (threshold > totalShares) {
            throw new Error(
                `Threshold (${threshold}) cannot exceed total shares (${totalShares})`
            );
        }
    }

    /**
     * Get default configuration values
     */
    static getDefaults(): { threshold: number; totalShares: number } {
        return {
            threshold: DEFAULT_THRESHOLD,
            totalShares: DEFAULT_TOTAL_SHARES,
        };
    }
}
