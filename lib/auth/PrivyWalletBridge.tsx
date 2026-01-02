"use client";

/**
 * PrivyWalletBridge - Bridges Privy auth with UnifiedWalletProvider
 *
 * This component syncs Privy's authentication state with our unified
 * wallet context, enabling seamless switching between auth methods.
 */

import { useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { AppStorage, STORAGE_KEYS } from "@/utils/storage";
import { WalletMode } from "./UnifiedWalletProvider";

const LOG_CONTEXT = "PrivyWalletBridge";

interface PrivyWalletBridgeProps {
  onStateChange: (state: {
    isConnected: boolean;
    address: string | null;
    isEmbeddedWallet: boolean;
    mode: WalletMode;
  }) => void;
}

export function PrivyWalletBridge({ onStateChange }: PrivyWalletBridgeProps) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const syncState = useCallback(() => {
    if (!ready) return;

    const stored = AppStorage.get<{ mode: WalletMode }>(
      STORAGE_KEYS.WALLET_CONNECTION
    );

    // Only sync if we're in Privy mode
    if (stored?.mode !== "privy" && authenticated) {
      // User authenticated with Privy but wasn't in Privy mode
      // This happens on fresh Privy login
      AppStorage.set(STORAGE_KEYS.WALLET_CONNECTION, { mode: "privy" });
    }

    if (authenticated) {
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
      );
      const externalWallet = wallets.find(
        (w) => w.walletClientType !== "privy"
      );
      const activeWallet = externalWallet || embeddedWallet;

      if (activeWallet) {
        ErrorLogger.debug(LOG_CONTEXT, "Syncing Privy state", {
          address: activeWallet.address,
          isEmbedded: activeWallet === embeddedWallet,
        });

        onStateChange({
          isConnected: true,
          address: activeWallet.address,
          isEmbeddedWallet: activeWallet === embeddedWallet,
          mode: "privy",
        });
      }
    } else if (stored?.mode === "privy") {
      // Was in Privy mode but no longer authenticated
      onStateChange({
        isConnected: false,
        address: null,
        isEmbeddedWallet: false,
        mode: "none",
      });
    }
  }, [ready, authenticated, wallets, onStateChange]);

  useEffect(() => {
    syncState();
  }, [syncState]);

  // This component doesn't render anything
  return null;
}
