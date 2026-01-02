"use client";

/**
 * usePrivySync - Syncs Privy authentication state with UnifiedWalletProvider
 *
 * This hook bridges Privy's auth state with our unified wallet context,
 * allowing seamless integration of both auth methods.
 */

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useUnifiedWallet, WalletMode } from "./UnifiedWalletProvider";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { AppStorage, STORAGE_KEYS } from "@/utils/storage";

const LOG_CONTEXT = "usePrivySync";

/**
 * Hook to sync Privy state with UnifiedWalletProvider
 * Must be used inside both PrivyProvider and UnifiedWalletProvider
 */
export function usePrivySync() {
  const { ready, authenticated, user, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const unified = useUnifiedWallet();

  useEffect(() => {
    if (!ready) return;

    // Check if we should be using Privy
    const stored = AppStorage.get<{ mode: WalletMode }>(
      STORAGE_KEYS.WALLET_CONNECTION
    );

    // If authenticated with Privy and we're in Privy mode (or no mode set)
    if (authenticated && (stored?.mode === "privy" || !stored?.mode)) {
      // Find the active wallet
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
      );
      const externalWallet = wallets.find(
        (w) => w.walletClientType !== "privy"
      );
      const activeWallet = externalWallet || embeddedWallet;

      if (activeWallet && activeWallet.address !== unified.address) {
        ErrorLogger.info(LOG_CONTEXT, "Syncing Privy wallet state", {
          address: activeWallet.address,
          isEmbedded: activeWallet === embeddedWallet,
        });

        // Note: We can't directly update UnifiedWalletProvider state from here
        // The sync happens through the PrivyWalletBridge component
      }
    }

    // If not authenticated but we were in Privy mode, clear state
    if (!authenticated && stored?.mode === "privy" && unified.isConnected) {
      ErrorLogger.info(LOG_CONTEXT, "Privy logged out, clearing state");
      unified.disconnect();
    }
  }, [ready, authenticated, wallets, unified]);

  return {
    ready,
    authenticated,
    user,
    privyLogout,
  };
}
