/**
 * useGaslessTransaction - React hook for gasless message creation
 *
 * Provides a simple interface for components to:
 * 1. Check gasless eligibility
 * 2. Create and sign intents
 * 3. Submit via relay
 * 4. Fall back to normal tx if relay fails
 */

"use client";

import { useState, useCallback } from "react";
import { usePrivyWallet } from "@/lib/auth/usePrivyWallet";
import {
    PaymasterService,
    type MessageIntent,
    type SignedIntent,
    type SponsorshipEligibility,
    type GasEstimate,
} from "@/lib/paymaster";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";

const LOG_CONTEXT = "useGaslessTransaction";

export interface GaslessTransactionState {
    isLoading: boolean;
    error: string | null;
    eligibility: SponsorshipEligibility | null;
    gasEstimate: GasEstimate | null;
}

export interface GaslessTransactionResult {
    success: boolean;
    transactionHash?: string;
    messageId?: string;
    error?: string;
    wasSponsored: boolean;
}

export interface UseGaslessTransactionReturn {
    state: GaslessTransactionState;
    isGaslessEnabled: boolean;
    checkEligibility: () => Promise<SponsorshipEligibility>;
    estimateGas: () => Promise<GasEstimate>;
    submitGasless: (
        params: Omit<MessageIntent, "sender">
    ) => Promise<GaslessTransactionResult>;
}

export function useGaslessTransaction(): UseGaslessTransactionReturn {
    const { address, signMessage, authenticated } = usePrivyWallet();

    const [state, setState] = useState<GaslessTransactionState>({
        isLoading: false,
        error: null,
        eligibility: null,
        gasEstimate: null,
    });

    const isGaslessEnabled = PaymasterService.isEnabled();

    /**
     * Check if user is eligible for gas sponsorship
     */
    const checkEligibility = useCallback(async (): Promise<SponsorshipEligibility> => {
        if (!address) {
            const notEligible: SponsorshipEligibility = {
                eligible: false,
                reason: "Wallet not connected",
                tier: "free",
            };
            setState((prev) => ({ ...prev, eligibility: notEligible }));
            return notEligible;
        }

        try {
            const eligibility = await PaymasterService.checkEligibility(address);
            setState((prev) => ({ ...prev, eligibility }));
            return eligibility;
        } catch (error) {
            const notEligible: SponsorshipEligibility = {
                eligible: false,
                reason: "Failed to check eligibility",
                tier: "free",
            };
            setState((prev) => ({ ...prev, eligibility: notEligible }));
            return notEligible;
        }
    }, [address]);

    /**
     * Estimate gas cost for message creation
     */
    const estimateGas = useCallback(async (): Promise<GasEstimate> => {
        const estimate = await PaymasterService.estimateGas();
        setState((prev) => ({ ...prev, gasEstimate: estimate }));
        return estimate;
    }, []);

    /**
     * Submit a message via gasless relay
     */
    const submitGasless = useCallback(
        async (
            params: Omit<MessageIntent, "sender">
        ): Promise<GaslessTransactionResult> => {
            if (!address || !authenticated) {
                return {
                    success: false,
                    error: "Wallet not connected",
                    wasSponsored: false,
                };
            }

            if (!isGaslessEnabled) {
                return {
                    success: false,
                    error: "Gasless transactions not enabled",
                    wasSponsored: false,
                };
            }

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                // Create intent
                const intent = PaymasterService.createIntent(params, address);
                const nonce = PaymasterService.generateNonce();
                const timestamp = Date.now();

                // Create signable message
                const message = PaymasterService.createSignableMessage(intent, nonce);

                ErrorLogger.debug(LOG_CONTEXT, "Requesting signature for gasless tx");

                // Sign with Privy wallet
                const signature = await signMessage(message);

                // Create signed intent
                const signedIntent: SignedIntent = {
                    intent,
                    signature,
                    nonce,
                    timestamp,
                };

                ErrorLogger.debug(LOG_CONTEXT, "Submitting to relay");

                // Submit to relay
                const result = await PaymasterService.submitToRelay(signedIntent);

                setState((prev) => ({ ...prev, isLoading: false }));

                if (result.success) {
                    return {
                        success: true,
                        transactionHash: result.transactionHash,
                        wasSponsored: true,
                    };
                }

                // Relay failed
                setState((prev) => ({ ...prev, error: result.error || null }));
                return {
                    success: false,
                    error: result.error,
                    wasSponsored: false,
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";

                ErrorLogger.error(
                    error instanceof Error ? error : new Error(errorMessage),
                    LOG_CONTEXT,
                    { operation: "submitGasless" }
                );

                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: errorMessage,
                }));

                return {
                    success: false,
                    error: errorMessage,
                    wasSponsored: false,
                };
            }
        },
        [address, authenticated, isGaslessEnabled, signMessage]
    );

    return {
        state,
        isGaslessEnabled,
        checkEligibility,
        estimateGas,
        submitGasless,
    };
}
