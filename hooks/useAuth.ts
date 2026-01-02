"use client";

/**
 * useAuth - Privy authentication hook
 *
 * Provides a simple interface for authentication state and wallet access.
 * Replaces the old useWallet hook with Privy-based authentication.
 */

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback, useMemo } from "react";
import { BrowserProvider, Signer } from "ethers";

export interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  isReady: boolean;
  user: ReturnType<typeof usePrivy>["user"];

  // Wallet state (from Privy embedded wallet)
  isConnected: boolean;
  address: string | null;
  
  // Actions
  login: () => void;
  logout: () => Promise<void>;
  
  // Wallet operations
  getProvider: () => Promise<BrowserProvider>;
  getSigner: () => Promise<Signer>;
  signMessage: (message: string) => Promise<string>;
}

export function useAuth(): AuthState {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Get the active wallet (prefer external, fallback to embedded)
  const activeWallet = useMemo(() => {
    const external = wallets.find((w) => w.walletClientType !== "privy");
    const embedded = wallets.find((w) => w.walletClientType === "privy");
    return external || embedded;
  }, [wallets]);

  const getProvider = useCallback(async (): Promise<BrowserProvider> => {
    if (!activeWallet) {
      throw new Error("No wallet available. Please sign in first.");
    }
    const ethereumProvider = await activeWallet.getEthereumProvider();
    return new BrowserProvider(ethereumProvider);
  }, [activeWallet]);

  const getSigner = useCallback(async (): Promise<Signer> => {
    const provider = await getProvider();
    return provider.getSigner();
  }, [getProvider]);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!activeWallet) {
        throw new Error("No wallet available. Please sign in first.");
      }
      const provider = await getProvider();
      const signer = await provider.getSigner();
      return signer.signMessage(message);
    },
    [activeWallet, getProvider]
  );

  return {
    isAuthenticated: authenticated,
    isReady: ready,
    user,
    isConnected: authenticated && !!activeWallet,
    address: activeWallet?.address || null,
    login,
    logout,
    getProvider,
    getSigner,
    signMessage,
  };
}
