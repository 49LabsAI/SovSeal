/**
 * Environment Configuration for SovSeal
 * 
 * Centralized environment detection and configuration.
 * Supports both testnet (Passet Hub) and mainnet (Polkadot Asset Hub).
 */

import { getCurrentNetwork, isTestnet } from './networks';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Get the current environment based on configuration
 */
export function getEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    const network = getCurrentNetwork();

    if (env === 'development') {
        return 'development';
    }

    // Production environment is determined by mainnet usage
    if (!network.isTestnet) {
        return 'production';
    }

    return 'staging';
}

/**
 * Check if running in production (mainnet)
 */
export function isProduction(): boolean {
    return getEnvironment() === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
    return getEnvironment() === 'development';
}

/**
 * Get display string for current environment
 */
export function getEnvironmentDisplay(): string {
    const network = getCurrentNetwork();
    const env = getEnvironment();

    return `${env} (${network.displayName})`;
}

/**
 * Mainnet deployment configuration
 * 
 * Polkadot Asset Hub mainnet launches January 20, 2026
 * This configuration will be activated when NEXT_PUBLIC_NETWORK=asset-hub
 */
export const MAINNET_CONFIG = {
    name: 'asset-hub',
    chainId: 420420421,
    launchDate: new Date('2026-01-20T00:00:00Z'),
    rpcEndpoints: [
        'https://polkadot-asset-hub-eth-rpc.polkadot.io',
        'https://asset-hub-polkadot.api.onfinality.io/public',
    ],
    blockExplorer: 'https://assethub-polkadot.subscan.io',
} as const;

/**
 * Check if mainnet is available (post January 20, 2026)
 */
export function isMainnetAvailable(): boolean {
    return new Date() >= MAINNET_CONFIG.launchDate;
}

/**
 * Get days until mainnet launch
 */
export function getDaysUntilMainnet(): number {
    const now = new Date();
    const diff = MAINNET_CONFIG.launchDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Validate that the current configuration is valid for production
 */
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const network = getCurrentNetwork();

    // Check for mainnet
    if (network.isTestnet) {
        errors.push('Production requires mainnet (set NEXT_PUBLIC_NETWORK=asset-hub)');
    }

    // Check mainnet availability
    if (!network.isTestnet && !isMainnetAvailable()) {
        errors.push(`Mainnet launches on ${MAINNET_CONFIG.launchDate.toDateString()}`);
    }

    // Check contract address
    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        errors.push('NEXT_PUBLIC_CONTRACT_ADDRESS is required');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
