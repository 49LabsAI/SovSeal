/**
 * GuardianManager - Guardian registration and management
 *
 * Handles guardian lifecycle: registration, share distribution,
 * and retrieval for social recovery.
 */

"use client";

import { v4 as uuidv4 } from "crypto";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { AsymmetricCrypto } from "@/lib/crypto/AsymmetricCrypto";
import { ShamirService } from "./ShamirService";
import type { Guardian, GuardianInput, RecoveryConfig } from "./types";

const LOG_CONTEXT = "GuardianManager";

// Storage key for recovery config in localStorage (temporary until Supabase integration)
const RECOVERY_CONFIG_KEY = "sovseal_recovery_config";

export class GuardianManager {
    /**
     * Register a new guardian for a user
     *
     * @param userAddress The user's wallet address
     * @param guardian Guardian information
     * @returns The created guardian with generated ID
     */
    static async registerGuardian(
        userAddress: string,
        guardian: GuardianInput
    ): Promise<Guardian> {
        this.validateGuardianInput(guardian);

        const newGuardian: Guardian = {
            ...guardian,
            id: crypto.randomUUID(),
            registeredAt: Date.now(),
            status: "active",
        };

        try {
            // Get existing config or create new
            const config = await this.getRecoveryConfig(userAddress);

            // Check for duplicate
            const existing = config.guardians.find(
                (g) => g.address.toLowerCase() === guardian.address.toLowerCase()
            );
            if (existing) {
                throw new Error("Guardian already registered with this address");
            }

            // Add guardian
            config.guardians.push(newGuardian);
            config.totalShares = config.guardians.length;
            config.updatedAt = Date.now();

            // Save config
            await this.saveRecoveryConfig(config);

            ErrorLogger.info(LOG_CONTEXT, "Guardian registered", {
                guardianId: newGuardian.id,
                type: newGuardian.type,
            });

            return newGuardian;
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "registerGuardian", guardianAddress: guardian.address }
            );
            throw error;
        }
    }

    /**
     * Get all guardians for a user
     *
     * @param userAddress The user's wallet address
     * @returns Array of guardians
     */
    static async getGuardians(userAddress: string): Promise<Guardian[]> {
        const config = await this.getRecoveryConfig(userAddress);
        return config.guardians.filter((g) => g.status === "active");
    }

    /**
     * Remove a guardian
     *
     * @param userAddress The user's wallet address
     * @param guardianId The guardian ID to remove
     */
    static async removeGuardian(
        userAddress: string,
        guardianId: string
    ): Promise<void> {
        const config = await this.getRecoveryConfig(userAddress);

        const index = config.guardians.findIndex((g) => g.id === guardianId);
        if (index === -1) {
            throw new Error("Guardian not found");
        }

        // Mark as revoked instead of deleting (for audit trail)
        config.guardians[index].status = "revoked";
        config.totalShares = config.guardians.filter(
            (g) => g.status === "active"
        ).length;
        config.updatedAt = Date.now();

        await this.saveRecoveryConfig(config);

        ErrorLogger.info(LOG_CONTEXT, "Guardian removed", { guardianId });
    }

    /**
     * Distribute shares to guardians
     *
     * @param userAddress The user's wallet address
     * @param secret The secret to split (e.g., encryption key)
     * @param threshold Minimum shares required to recover
     */
    static async distributeShares(
        userAddress: string,
        secret: Uint8Array,
        threshold: number
    ): Promise<void> {
        const guardians = await this.getGuardians(userAddress);

        if (guardians.length < threshold) {
            throw new Error(
                `Need at least ${threshold} guardians, have ${guardians.length}`
            );
        }

        try {
            // Split the secret
            const { shares } = await ShamirService.splitSecret(
                secret,
                threshold,
                guardians.length
            );

            // Encrypt each share to the corresponding guardian's address
            for (let i = 0; i < guardians.length; i++) {
                const guardian = guardians[i];
                const share = shares[i];

                // Get guardian's public key from their address
                const publicKey = await AsymmetricCrypto.getPublicKeyFromTalisman(
                    guardian.address
                );

                // Encrypt the share
                const encryptedKey = await AsymmetricCrypto.encryptAESKey(
                    share.buffer.slice(
                        share.byteOffset,
                        share.byteOffset + share.byteLength
                    ),
                    publicKey
                );

                // Store encrypted share with guardian
                guardian.encryptedShare = JSON.stringify(encryptedKey);
            }

            // Update config with threshold
            const config = await this.getRecoveryConfig(userAddress);
            config.threshold = threshold;
            config.guardians = config.guardians.map((g) => {
                const updated = guardians.find((ug) => ug.id === g.id);
                return updated || g;
            });
            config.updatedAt = Date.now();

            await this.saveRecoveryConfig(config);

            ErrorLogger.info(LOG_CONTEXT, "Shares distributed", {
                guardianCount: guardians.length,
                threshold,
            });
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "distributeShares" }
            );
            throw error;
        }
    }

    /**
     * Get the recovery configuration for a user
     *
     * @param userAddress The user's wallet address
     * @returns Recovery configuration
     */
    static async getRecoveryConfig(userAddress: string): Promise<RecoveryConfig> {
        // TODO: Replace with Supabase storage
        if (typeof window === "undefined") {
            return this.createDefaultConfig(userAddress);
        }

        const stored = localStorage.getItem(
            `${RECOVERY_CONFIG_KEY}_${userAddress.toLowerCase()}`
        );
        if (!stored) {
            return this.createDefaultConfig(userAddress);
        }

        try {
            return JSON.parse(stored) as RecoveryConfig;
        } catch {
            return this.createDefaultConfig(userAddress);
        }
    }

    /**
     * Save recovery configuration
     */
    private static async saveRecoveryConfig(
        config: RecoveryConfig
    ): Promise<void> {
        // TODO: Replace with Supabase storage
        if (typeof window === "undefined") {
            return;
        }

        localStorage.setItem(
            `${RECOVERY_CONFIG_KEY}_${config.userAddress.toLowerCase()}`,
            JSON.stringify(config)
        );
    }

    /**
     * Create default recovery configuration
     */
    private static createDefaultConfig(userAddress: string): RecoveryConfig {
        const defaults = ShamirService.getDefaults();
        return {
            userAddress: userAddress.toLowerCase(),
            threshold: defaults.threshold,
            totalShares: 0,
            guardians: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }

    /**
     * Validate guardian input
     */
    private static validateGuardianInput(guardian: GuardianInput): void {
        if (!guardian.address || !guardian.address.startsWith("0x")) {
            throw new Error("Invalid guardian address");
        }

        if (guardian.address.length !== 42) {
            throw new Error("Guardian address must be 42 characters");
        }

        if (!["trusted_contact", "time_lock", "institutional"].includes(guardian.type)) {
            throw new Error("Invalid guardian type");
        }

        if (guardian.weight !== undefined && guardian.weight < 1) {
            throw new Error("Guardian weight must be at least 1");
        }
    }

    /**
     * Check if recovery is configured for a user
     *
     * @param userAddress The user's wallet address
     * @returns true if recovery is set up
     */
    static async isRecoveryConfigured(userAddress: string): Promise<boolean> {
        const config = await this.getRecoveryConfig(userAddress);
        const activeGuardians = config.guardians.filter(
            (g) => g.status === "active"
        );
        return activeGuardians.length >= config.threshold;
    }
}
