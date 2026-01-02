/**
 * Paymaster Module Types
 *
 * Type definitions for gasless transaction sponsorship.
 * Used for the backend relayer architecture since Polkadot Asset Hub
 * doesn't support ERC-4337 bundlers yet.
 */

/**
 * User intent for storing a message (unsigned transaction data)
 */
export interface MessageIntent {
    encryptedKeyCID: string;
    encryptedMessageCID: string;
    messageHash: string;
    unlockTimestamp: number;
    recipient: string;
    sender: string;
}

/**
 * Signed intent from user - proves they authorized this action
 */
export interface SignedIntent {
    intent: MessageIntent;
    signature: string;
    timestamp: number;
    nonce: string;
}

/**
 * Result of a sponsored transaction
 */
export interface SponsoredTxResult {
    success: boolean;
    transactionHash?: string;
    messageId?: string;
    blockHash?: string;
    gasUsed?: bigint;
    error?: string;
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
    gasLimit: bigint;
    gasPriceWei: bigint;
    totalCostWei: bigint;
    totalCostUsd: number;
    timestamp: number;
}

/**
 * Sponsorship eligibility check result
 */
export interface SponsorshipEligibility {
    eligible: boolean;
    reason?: string;
    remainingDaily?: number;
    tier: "free" | "personal" | "legacy" | "enterprise";
}

/**
 * Paymaster configuration from environment
 */
export interface PaymasterConfig {
    relayerPrivateKey: string;
    relayerAddress: string;
    maxGasPerTx: number;
    dailyGasBudget: number;
    enabled: boolean;
}

/**
 * Rate limit tracking for free tier users
 */
export interface RateLimitState {
    userId: string;
    dailyGasUsed: number;
    lastReset: number;
    monthlyMessages: number;
    monthlyReset: number;
}
