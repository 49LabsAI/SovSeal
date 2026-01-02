"use client";

/**
 * usePrivyWallet - Hook for Privy wallet interactions
 *
 * Provides a unified interface for:
 * - Authentication state
 * - Embedded wallet access
 * - External wallet support
 * - Message signing
 */

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback, useMemo } from "react";
import { BrowserProvider, Signer } from "ethers";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";

const LOG_CONTEXT = "usePrivyWallet";

export interface PrivyWalletState {
  ready: boolean;
  authenticated: boolean;
  user: ReturnType<typeof usePrivy>["user"];
  address: string | null;
  isEmbeddedWallet: boolean;
  login: () => void;
  logout: () => Promise<void>;
  getProvider: () => Promise<BrowserProvider>;
  getSigner: () => Promise<Signer>;
  signMessage: (message: string) => Promise<string>;
}

export function usePrivyWallet(): PrivyWalletState {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Find embedded wallet (created by Privy)
  const embeddedWallet = useMemo(() => {
    return wallets.find((wallet) => wallet.walletClientType === "privy");
  }, [wallets]);

  // Find external wallet (MetaMask, Talisman, etc.)
  const externalWallet = useMemo(() => {
    return wallets.find((wallet) => wallet.walletClientType !== "privy");
  }, [wallets]);

  // Prefer external wallet if connected, otherwise use embedded
  const activeWallet = externalWallet || embeddedWallet;

  const getProvider = useCallback(async (): Promise<BrowserProvider> => {
    if (!activeWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const ethereumProvider = await activeWallet.getEthereumProvider();
      return new BrowserProvider(ethereumProvider);
    } catch (error) {
      ErrorLogger.error(
        error instanceof Error ? error : new Error(String(error)),
        LOG_CONTEXT,
        { operation: "getProvider" }
      );
      throw new Error("Failed to get wallet provider");
    }
  }, [activeWallet]);

  const getSigner = useCallback(async (): Promise<Signer> => {
    const provider = await getProvider();
    return provider.getSigner();
  }, [getProvider]);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!activeWallet) {
        throw new Error("No wallet connected");
      }

      try {
        ErrorLogger.debug(LOG_CONTEXT, "Requesting message signature...");
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const signature = await signer.signMessage(message);
        ErrorLogger.debug(LOG_CONTEXT, "Message signed successfully");
        return signature;
      } catch (error) {
        ErrorLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          LOG_CONTEXT,
          { operation: "signMessage" }
        );

        if (error instanceof Error && error.message.includes("User rejected")) {
          throw new Error(
            "Signature rejected. Please approve the signature request."
          );
        }

        throw error;
      }
    },
    [activeWallet, getProvider]
  );

  return {
    ready,
    authenticated,
    user,
    address: activeWallet?.address || null,
    isEmbeddedWallet: activeWallet === embeddedWallet,
    login,
    logout,
    getProvider,
    getSigner,
    signMessage,
  };
}
