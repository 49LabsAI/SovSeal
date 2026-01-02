/**
 * Recovery Module Types
 *
 * TypeScript types for Shamir's Secret Sharing and guardian recovery.
 */

/**
 * Guardian types supported by SovSeal
 */
export type GuardianType = "trusted_contact" | "time_lock" | "institutional";

/**
 * Guardian status
 */
export type GuardianStatus = "active" | "pending" | "revoked";

/**
 * Guardian representation
 */
export interface Guardian {
    id: string;
    type: GuardianType;
    address: string; // Ethereum address
    name?: string; // Human-readable name (optional)
    email?: string; // Contact email for notifications
    encryptedShare?: string; // Share encrypted to guardian's address (base64)
    registeredAt: number; // Unix timestamp
    weight: number; // Voting weight (default: 1)
    status: GuardianStatus;
}

/**
 * Guardian registration input
 */
export type GuardianInput = Omit<
    Guardian,
    "id" | "registeredAt" | "status" | "encryptedShare"
>;

/**
 * Recovery configuration for a user
 */
export interface RecoveryConfig {
    userAddress: string;
    threshold: number; // Required shares to recover (k)
    totalShares: number; // Total shares distributed (n)
    guardians: Guardian[];
    createdAt: number;
    updatedAt: number;
}

/**
 * Recovery session status
 */
export type RecoveryStatus =
    | "pending" // Initiated, waiting for guardian approvals
    | "collecting" // Collecting shares from guardians
    | "ready" // Threshold met, waiting for time-lock
    | "executable" // Time-lock expired, can execute
    | "executed" // Recovery completed
    | "cancelled"; // Cancelled by owner or guardians

/**
 * Recovery session tracking
 */
export interface RecoverySession {
    id: string;
    userAddress: string; // Original owner
    newOwnerAddress: string; // New owner after recovery
    status: RecoveryStatus;
    threshold: number;
    collectedShares: string[]; // Guardian IDs who submitted shares
    initiatedAt: number;
    executeAfter: number; // Time-lock expiry (Unix timestamp)
    executedAt?: number;
    cancelledAt?: number;
    onChainRequestId?: number; // Smart contract request ID
}

/**
 * Share submission by guardian
 */
export interface ShareSubmission {
    sessionId: string;
    guardianAddress: string;
    encryptedShare: string; // Base64 encoded
    signature: string; // Guardian's signature proving ownership
    submittedAt: number;
}

/**
 * Result of SSS split operation
 */
export interface SplitResult {
    shares: Uint8Array[];
    threshold: number;
    totalShares: number;
}

/**
 * Recovery initiation request
 */
export interface RecoveryRequest {
    userAddress: string;
    newOwnerAddress: string;
    proofOfIdentity?: string; // Optional proof for institutional guardians
}

/**
 * Recovery execution result
 */
export interface RecoveryResult {
    success: boolean;
    reconstructedSecret?: Uint8Array;
    error?: string;
    transactionHash?: string;
}
