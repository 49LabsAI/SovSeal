/**
 * GasEstimator - Estimate gas costs for transactions
 *
 * Provides gas estimation and USD conversion for sponsored transactions.
 * Caches prices to avoid excessive RPC calls.
 */

"use client";

import { ethers } from "ethers";
import { ContractService } from "@/lib/contract/ContractService";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import type { GasEstimate } from "./types";

const LOG_CONTEXT = "GasEstimator";

// Cache duration for gas price (30 seconds)
const GAS_PRICE_CACHE_TTL = 30_000;

// Estimated gas for storeMessage (based on contract analysis)
// This includes: base tx cost + storage writes + event emission
const STORE_MESSAGE_GAS_ESTIMATE = 150_000n;

// PAS to USD conversion (placeholder - should come from price oracle)
// For testnet, we use a dummy value
const PAS_USD_RATE = 0.00001; // $0.00001 per wei (placeholder)

interface GasPriceCache {
    price: bigint;
    timestamp: number;
}

export class GasEstimator {
    private static gasPriceCache: GasPriceCache | null = null;

    /**
     * Get current gas price with caching
     */
    static async getGasPrice(): Promise<bigint> {
        const now = Date.now();

        // Return cached price if still valid
        if (
            this.gasPriceCache &&
            now - this.gasPriceCache.timestamp < GAS_PRICE_CACHE_TTL
        ) {
            return this.gasPriceCache.price;
        }

        try {
            const provider = await ContractService.getProvider();
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice ?? 1_000_000_000n; // Default to 1 gwei

            this.gasPriceCache = {
                price: gasPrice,
                timestamp: now,
            };

            ErrorLogger.debug(LOG_CONTEXT, "Gas price fetched", {
                gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
            });

            return gasPrice;
        } catch (error) {
            ErrorLogger.warn(LOG_CONTEXT, "Failed to fetch gas price, using default", {
                error: error instanceof Error ? error.message : String(error),
            });
            // Return default gas price on failure
            return 1_000_000_000n; // 1 gwei default
        }
    }

    /**
     * Estimate gas cost for storing a message
     */
    static async estimateStoreMessage(): Promise<GasEstimate> {
        const gasPrice = await this.getGasPrice();
        const gasLimit = STORE_MESSAGE_GAS_ESTIMATE;
        const totalCostWei = gasLimit * gasPrice;

        // Convert to USD (simplified - production should use price oracle)
        const totalCostUsd = Number(totalCostWei) * PAS_USD_RATE;

        return {
            gasLimit,
            gasPriceWei: gasPrice,
            totalCostWei,
            totalCostUsd,
            timestamp: Date.now(),
        };
    }

    /**
     * Check if a transaction is within budget
     */
    static async isWithinBudget(
        gasLimit: bigint,
        maxBudgetWei: bigint
    ): Promise<boolean> {
        const gasPrice = await this.getGasPrice();
        const estimatedCost = gasLimit * gasPrice;
        return estimatedCost <= maxBudgetWei;
    }

    /**
     * Format gas cost for display
     */
    static formatGasCost(estimate: GasEstimate): string {
        if (estimate.totalCostUsd < 0.01) {
            return "<$0.01";
        }
        return `$${estimate.totalCostUsd.toFixed(2)}`;
    }
}
