/**
 * Network configuration for multi-RPC fallback support
 *
 * Provides redundant RPC endpoints for improved reliability and
 * automatic failover when primary endpoints are unavailable.
 */

export interface NetworkConfig {
  name: string;
  displayName: string;
  rpcEndpoints: string[];
  chainId: number;
  blockExplorer?: string;
  isTestnet: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  "passet-hub": {
    name: "passet-hub",
    displayName: "Passet Hub Testnet",
    rpcEndpoints: [
      "https://testnet-passet-hub-eth-rpc.polkadot.io",
      // Add backup endpoints as they become available
    ],
    chainId: 420420422,
    blockExplorer: "https://blockscout-passet-hub.parity-testnet.parity.io",
    isTestnet: true,
  },
  "asset-hub": {
    name: "asset-hub",
    displayName: "Polkadot Asset Hub",
    // Mainnet available January 20, 2026
    rpcEndpoints: [
      "https://polkadot-asset-hub-eth-rpc.polkadot.io",
      "https://asset-hub-polkadot.api.onfinality.io/public",
      // Add more endpoints as they become available for redundancy
    ],
    chainId: 420420421,
    blockExplorer: "https://assethub-polkadot.subscan.io",
    isTestnet: false,
  },
  // Base Mainnet - Primary production network (Coinbase L2)
  // Very low fees (~$0.001-0.01 per tx), available now
  "base": {
    name: "base",
    displayName: "Base",
    rpcEndpoints: [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
      "https://base.drpc.org",
    ],
    chainId: 8453,
    blockExplorer: "https://basescan.org",
    isTestnet: false,
  },
  // Base Sepolia Testnet
  "base-sepolia": {
    name: "base-sepolia",
    displayName: "Base Sepolia",
    rpcEndpoints: [
      "https://sepolia.base.org",
    ],
    chainId: 84532,
    blockExplorer: "https://sepolia.basescan.org",
    isTestnet: true,
  },
};

/**
 * Get network configuration by name
 */
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = NETWORKS[networkName];
  if (!config) {
    throw new Error(
      `Unknown network: ${networkName}. Available networks: ${Object.keys(NETWORKS).join(", ")}`
    );
  }
  return config;
}

/**
 * Get the current network from environment
 */
export function getCurrentNetwork(): NetworkConfig {
  const networkName = process.env.NEXT_PUBLIC_NETWORK || "passet-hub";
  return getNetworkConfig(networkName);
}

/**
 * Get all RPC endpoints for the current network
 * Includes environment override as first priority
 */
export function getRpcEndpoints(): string[] {
  const network = getCurrentNetwork();
  const envEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT;

  // If env specifies an endpoint, use it as primary
  if (envEndpoint && !network.rpcEndpoints.includes(envEndpoint)) {
    return [envEndpoint, ...network.rpcEndpoints];
  }

  return network.rpcEndpoints;
}

/**
 * Check if current network is testnet
 */
export function isTestnet(): boolean {
  return getCurrentNetwork().isTestnet;
}
