/**
 * RecoveryOrchestrator - Coordinates the full recovery flow
 *
 * Manages recovery sessions: initiation, share collection,
 * time-lock enforcement, and key reconstruction.
 */

"use client";

import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { ShamirService } from "./ShamirService";
import { GuardianManager } from "./GuardianManager";
import type {
    RecoverySession,
    RecoveryRequest,
    RecoveryResult,
    ShareSubmission,
} from "./types";

const LOG_CONTEXT = "RecoveryOrchestrator";

// Recovery time-lock duration (7 days in milliseconds)
const RECOVERY_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

// Storage key for recovery sessions
const RECOVERY_SESSIONS_KEY = "sovseal_recovery_sessions";

export class RecoveryOrchestrator {
    /**
     * Initiate a recovery process
     *
     * @param request Recovery request details
     * @returns The created recovery session
     */
    static async initiateRecovery(
        request: RecoveryRequest
    ): Promise<RecoverySession> {
        const { userAddress, newOwnerAddress } = request;

        // Validate addresses
        if (!userAddress || !newOwnerAddress) {
            throw new Error("Both user and new owner addresses are required");
        }

        if (userAddress.toLowerCase() === newOwnerAddress.toLowerCase()) {
            throw new Error("New owner cannot be the same as current owner");
        }

        // Check if recovery is configured
        const isConfigured =
            await GuardianManager.isRecoveryConfigured(userAddress);
        if (!isConfigured) {
            throw new Error(
                "Recovery not configured - need at least threshold guardians"
            );
        }

        // Get recovery config
        const config = await GuardianManager.getRecoveryConfig(userAddress);

        // Check for existing active session
        const existingSession = await this.getActiveSession(userAddress);
        if (existingSession) {
            throw new Error(
                "Recovery already in progress. Cancel existing session first."
            );
        }

        const now = Date.now();
        const session: RecoverySession = {
            id: crypto.randomUUID(),
            userAddress: userAddress.toLowerCase(),
            newOwnerAddress: newOwnerAddress.toLowerCase(),
            status: "pending",
            threshold: config.threshold,
            collectedShares: [],
            initiatedAt: now,
            executeAfter: now + RECOVERY_DELAY_MS,
        };

        try {
            await this.saveSession(session);

            ErrorLogger.info(LOG_CONTEXT, "Recovery initiated", {
                sessionId: session.id,
                userAddress,
                newOwnerAddress,
                threshold: config.threshold,
                executeAfter: new Date(session.executeAfter).toISOString(),
            });

            // TODO: Submit to smart contract
            // const contractRequestId = await this.submitToContract(session);
            // session.onChainRequestId = contractRequestId;
            // await this.saveSession(session);

            return session;
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "initiateRecovery" }
            );
            throw error;
        }
    }

    /**
     * Guardian submits their share for a recovery session
     *
     * @param submission Share submission details
     */
    static async submitShare(submission: ShareSubmission): Promise<void> {
        const { sessionId, guardianAddress, encryptedShare } = submission;

        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error("Recovery session not found");
        }

        if (session.status === "executed" || session.status === "cancelled") {
            throw new Error(`Recovery session is ${session.status}`);
        }

        // Verify guardian is authorized
        const guardians = await GuardianManager.getGuardians(session.userAddress);
        const guardian = guardians.find(
            (g) => g.address.toLowerCase() === guardianAddress.toLowerCase()
        );
        if (!guardian) {
            throw new Error("Not an authorized guardian");
        }

        // Check if already submitted
        if (session.collectedShares.includes(guardian.id)) {
            throw new Error("Share already submitted");
        }

        try {
            // Store the share submission
            session.collectedShares.push(guardian.id);

            // Store encrypted share for later reconstruction
            await this.storeSubmittedShare(sessionId, guardian.id, encryptedShare);

            // Update session status
            if (session.collectedShares.length >= session.threshold) {
                session.status = "ready";
            } else {
                session.status = "collecting";
            }

            await this.saveSession(session);

            ErrorLogger.info(LOG_CONTEXT, "Share submitted", {
                sessionId,
                guardianId: guardian.id,
                collectedCount: session.collectedShares.length,
                threshold: session.threshold,
            });
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "submitShare", sessionId }
            );
            throw error;
        }
    }

    /**
     * Check if threshold is met and ready for execution
     *
     * @param sessionId The recovery session ID
     * @returns true if ready to execute
     */
    static async checkReadiness(sessionId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) {
            return false;
        }

        const thresholdMet = session.collectedShares.length >= session.threshold;
        const timeLockExpired = Date.now() >= session.executeAfter;

        if (thresholdMet && timeLockExpired && session.status === "ready") {
            session.status = "executable";
            await this.saveSession(session);
        }

        return session.status === "executable";
    }

    /**
     * Execute the recovery (reconstruct the key)
     *
     * @param sessionId The recovery session ID
     * @returns Recovery result with reconstructed secret
     */
    static async executeRecovery(sessionId: string): Promise<RecoveryResult> {
        const session = await this.getSession(sessionId);
        if (!session) {
            return { success: false, error: "Recovery session not found" };
        }

        // Check threshold
        if (session.collectedShares.length < session.threshold) {
            return {
                success: false,
                error: `Need ${session.threshold} shares, have ${session.collectedShares.length}`,
            };
        }

        // Check time-lock
        if (Date.now() < session.executeAfter) {
            const remaining = session.executeAfter - Date.now();
            const hours = Math.ceil(remaining / (60 * 60 * 1000));
            return {
                success: false,
                error: `Time-lock not expired. ${hours} hours remaining.`,
            };
        }

        try {
            // Retrieve submitted shares
            const shares = await this.getSubmittedShares(sessionId);

            // Reconstruct the secret
            const reconstructedSecret = await ShamirService.combineShares(shares);

            // Mark session as executed
            session.status = "executed";
            session.executedAt = Date.now();
            await this.saveSession(session);

            // TODO: Transfer ownership on-chain

            ErrorLogger.info(LOG_CONTEXT, "Recovery executed successfully", {
                sessionId,
                executedAt: new Date().toISOString(),
            });

            return {
                success: true,
                reconstructedSecret,
            };
        } catch (error) {
            ErrorLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                LOG_CONTEXT,
                { operation: "executeRecovery", sessionId }
            );
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to execute recovery",
            };
        }
    }

    /**
     * Cancel a recovery session
     *
     * @param sessionId The recovery session ID
     * @param cancellerAddress Address of the canceller (must be owner or guardian)
     */
    static async cancelRecovery(
        sessionId: string,
        cancellerAddress: string
    ): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error("Recovery session not found");
        }

        if (session.status === "executed") {
            throw new Error("Cannot cancel executed recovery");
        }

        if (session.status === "cancelled") {
            throw new Error("Recovery already cancelled");
        }

        // Verify canceller is authorized (owner or guardian)
        const isOwner =
            cancellerAddress.toLowerCase() === session.userAddress.toLowerCase();
        const guardians = await GuardianManager.getGuardians(session.userAddress);
        const isGuardian = guardians.some(
            (g) => g.address.toLowerCase() === cancellerAddress.toLowerCase()
        );

        if (!isOwner && !isGuardian) {
            throw new Error("Not authorized to cancel recovery");
        }

        session.status = "cancelled";
        session.cancelledAt = Date.now();
        await this.saveSession(session);

        // TODO: Cancel on-chain

        ErrorLogger.info(LOG_CONTEXT, "Recovery cancelled", {
            sessionId,
            cancelledBy: cancellerAddress,
        });
    }

    /**
     * Get a recovery session by ID
     */
    static async getSession(sessionId: string): Promise<RecoverySession | null> {
        const sessions = await this.getAllSessions();
        return sessions.find((s) => s.id === sessionId) || null;
    }

    /**
     * Get active recovery session for a user
     */
    static async getActiveSession(
        userAddress: string
    ): Promise<RecoverySession | null> {
        const sessions = await this.getAllSessions();
        return (
            sessions.find(
                (s) =>
                    s.userAddress.toLowerCase() === userAddress.toLowerCase() &&
                    s.status !== "executed" &&
                    s.status !== "cancelled"
            ) || null
        );
    }

    /**
     * Get time remaining until execution allowed
     *
     * @param sessionId The recovery session ID
     * @returns Milliseconds remaining, 0 if expired
     */
    static async getTimeRemaining(sessionId: string): Promise<number> {
        const session = await this.getSession(sessionId);
        if (!session) {
            return 0;
        }
        return Math.max(0, session.executeAfter - Date.now());
    }

    // ============ Private Storage Methods ============

    private static async getAllSessions(): Promise<RecoverySession[]> {
        if (typeof window === "undefined") {
            return [];
        }

        const stored = localStorage.getItem(RECOVERY_SESSIONS_KEY);
        if (!stored) {
            return [];
        }

        try {
            return JSON.parse(stored) as RecoverySession[];
        } catch {
            return [];
        }
    }

    private static async saveSession(session: RecoverySession): Promise<void> {
        if (typeof window === "undefined") {
            return;
        }

        const sessions = await this.getAllSessions();
        const index = sessions.findIndex((s) => s.id === session.id);

        if (index >= 0) {
            sessions[index] = session;
        } else {
            sessions.push(session);
        }

        localStorage.setItem(RECOVERY_SESSIONS_KEY, JSON.stringify(sessions));
    }

    private static async storeSubmittedShare(
        sessionId: string,
        guardianId: string,
        encryptedShare: string
    ): Promise<void> {
        if (typeof window === "undefined") {
            return;
        }

        const key = `sovseal_shares_${sessionId}`;
        const stored = localStorage.getItem(key);
        const shares: Record<string, string> = stored ? JSON.parse(stored) : {};
        shares[guardianId] = encryptedShare;
        localStorage.setItem(key, JSON.stringify(shares));
    }

    private static async getSubmittedShares(
        sessionId: string
    ): Promise<Uint8Array[]> {
        if (typeof window === "undefined") {
            return [];
        }

        const key = `sovseal_shares_${sessionId}`;
        const stored = localStorage.getItem(key);
        if (!stored) {
            return [];
        }

        const sharesMap: Record<string, string> = JSON.parse(stored);
        return Object.values(sharesMap).map((encoded) =>
            ShamirService.decodeShare(encoded)
        );
    }
}
