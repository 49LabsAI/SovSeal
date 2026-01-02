"use client";

/**
 * UnifiedWalletProvider - Unified wallet interface supporting multiple auth methods
 *
 * Supports:
 * - Privy (passkeys, email, social login, embedded wallets)
 * - External wallets (Talisman, MetaMask)
 *
 * Migration strategy: Existing users can continue using Talisman/MetaMask,
 * while new users get the frictionless Privy experience.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { BrowserProvider, Signer } from "ethers";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { AppStorage, STORAGE_KEYS } from "@/utils/storage";
import { WalletAccount } from "@/types/wallet";

const LOG_CONTEXT = "UnifiedWalletProvider";

export type WalletMode = "privy" | "external" | "none";

export interface UnifiedWalletState {
  mode: WalletMode;
  isConnected: boolean;
  isReady: boolean;
  address: string | null;
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  isEmbeddedWallet: boolean;
}

export interface UnifiedWalletContextValue extends UnifiedWalletState {
  // Connection methods
  connectWithPrivy: () => Promise<void>;
  connectWithExternal: (preferredAddress?: string) => Promise<void>;
  disconnect: () => Promise<void>;

  // Account management
  selectAccount: (address: string) => void;

  // Signing
  signMessage: (message: string) => Promise<string>;
  getProvider: () => Promise<BrowserProvider>;
  getSigner: () => Promise<Signer>;

  // Health
  isHealthy: boolean;
  checkHealth: () => Promise<boolean>;
  reconnect: () => Promise<void>;

  // Event listeners
  onConnectionChange: (listener: (connected: boolean) => void) => () => void;
}

const UnifiedWalletContext = createContext<
  UnifiedWalletContextValue | undefined
>(undefined);

interface UnifiedWalletProviderProps {
  children: ReactNode;
}

// EIP-1193 Provider interface
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
  isMetaMask?: boolean;
  isTalisman?: boolean;
}

// Extend Window interface for wallet providers
// Using module augmentation to avoid conflicts
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    talismanEth?: EthereumProvider;
  }
}

// Type assertion helper for ethereum provider
const getEthereumProvider = (): EthereumProvider | undefined => {
  if (typeof window !== "undefined") {
    return window.ethereum as EthereumProvider | undefined;
  }
  return undefined;
};

export function UnifiedWalletProvider({ children }: UnifiedWalletProviderProps) {
  const [state, setState] = useState<UnifiedWalletState>({
    mode: "none",
    isConnected: false,
    isReady: false,
    address: null,
    accounts: [],
    selectedAccount: null,
    isEmbeddedWallet: false,
  });
  const [isHealthy, setIsHealthy] = useState(true);
  const [connectionListeners] = useState(
    () => new Set<(connected: boolean) => void>()
  );

  // Check for Privy availability
  const isPrivyAvailable = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Initialize - check for stored connection
  useEffect(() => {
    const stored = AppStorage.get<{ mode: WalletMode }>(
      STORAGE_KEYS.WALLET_CONNECTION
    );

    // Mark as ready after initial check
    setState((prev) => ({ ...prev, isReady: true }));

    // If external wallet was previously connected, try to restore
    if (stored?.mode === "external" && typeof window !== "undefined") {
      restoreExternalConnection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore external wallet connection
  const restoreExternalConnection = async () => {
    try {
      const ethereum = getEthereumProvider();
      if (!ethereum) return;

      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        const walletName = ethereum.isTalisman
          ? "Talisman"
          : ethereum.isMetaMask
            ? "MetaMask"
            : "Ethereum Wallet";

        const selectedAddress = accounts[0];
        const allAccounts = accounts.map((addr, index) => ({
          address: addr,
          meta: {
            name: `${walletName} Account ${index + 1}`,
            source: walletName,
          },
          type: "ethereum" as const,
        }));

        setState((prev) => ({
          ...prev,
          mode: "external",
          isConnected: true,
          address: selectedAddress,
          accounts: allAccounts,
          selectedAccount: allAccounts[0],
          isEmbeddedWallet: false,
        }));

        ErrorLogger.info(LOG_CONTEXT, "Restored external wallet connection");
      }
    } catch (error) {
      ErrorLogger.debug(LOG_CONTEXT, "Could not restore external connection", {
        error: error instanceof Error ? error.message : String(error),
      });
      AppStorage.remove(STORAGE_KEYS.WALLET_CONNECTION);
    }
  };

  // Connect with Privy (passkeys, email, social)
  const connectWithPrivy = useCallback(async () => {
    if (!isPrivyAvailable) {
      throw new Error(
        "Privy is not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID."
      );
    }

    // Privy login is handled by the PrivyProvider's login() method
    // This is called from the UI component that has access to usePrivy()
    ErrorLogger.info(LOG_CONTEXT, "Privy connection initiated");

    // The actual state update happens via the usePrivySync hook
    AppStorage.set(STORAGE_KEYS.WALLET_CONNECTION, { mode: "privy" });
  }, [isPrivyAvailable]);

  // Connect with external wallet (Talisman, MetaMask)
  const connectWithExternal = useCallback(
    async (preferredAddress?: string) => {
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error(
          "No Ethereum wallet detected. Please install Talisman or MetaMask."
        );
      }

      try {
        ErrorLogger.info(LOG_CONTEXT, "Connecting to external wallet...");

        const accounts = (await ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found in wallet");
        }

        const walletName = ethereum.isTalisman
          ? "Talisman"
          : ethereum.isMetaMask
            ? "MetaMask"
            : "Ethereum Wallet";

        const selectedAddress =
          preferredAddress && accounts.includes(preferredAddress)
            ? preferredAddress
            : accounts[0];

        const allAccounts = accounts.map((addr, index) => ({
          address: addr,
          meta: {
            name: `${walletName} Account ${index + 1}`,
            source: walletName,
          },
          type: "ethereum" as const,
        }));

        const selectedAccount = allAccounts.find(
          (acc) => acc.address === selectedAddress
        )!;

        setState({
          mode: "external",
          isConnected: true,
          isReady: true,
          address: selectedAddress,
          accounts: allAccounts,
          selectedAccount,
          isEmbeddedWallet: false,
        });

        AppStorage.set(STORAGE_KEYS.WALLET_CONNECTION, { mode: "external" });
        setIsHealthy(true);

        ErrorLogger.info(LOG_CONTEXT, "External wallet connected", {
          address: selectedAddress,
          wallet: walletName,
        });
      } catch (error) {
        ErrorLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          LOG_CONTEXT,
          { operation: "connectWithExternal" }
        );

        if (error instanceof Error) {
          if (
            error.message.includes("User rejected") ||
            error.message.includes("User denied")
          ) {
            throw new Error("Connection rejected. Please approve the request.");
          }
          throw error;
        }

        throw new Error("Failed to connect wallet");
      }
    },
    []
  );

  // Disconnect
  const disconnect = useCallback(async () => {
    ErrorLogger.info(LOG_CONTEXT, "Disconnecting wallet");

    setState({
      mode: "none",
      isConnected: false,
      isReady: true,
      address: null,
      accounts: [],
      selectedAccount: null,
      isEmbeddedWallet: false,
    });

    AppStorage.remove(STORAGE_KEYS.WALLET_CONNECTION);
  }, []);

  // Select account
  const selectAccount = useCallback(
    (address: string) => {
      const account = state.accounts.find((acc) => acc.address === address);
      if (account) {
        setState((prev) => ({
          ...prev,
          address: account.address,
          selectedAccount: account,
        }));
      }
    },
    [state.accounts]
  );

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!state.selectedAccount) {
        throw new Error("No account selected");
      }

      if (state.mode === "external") {
        const ethereum = getEthereumProvider();
        if (!ethereum) {
          throw new Error("Ethereum wallet not available");
        }

        const messageHex = "0x" + Buffer.from(message, "utf8").toString("hex");
        const signature = (await ethereum.request({
          method: "personal_sign",
          params: [messageHex, state.selectedAccount.address],
        })) as string;

        return signature;
      }

      // For Privy, signing is handled via the usePrivyWallet hook
      throw new Error("Use usePrivyWallet for Privy signing");
    },
    [state.selectedAccount, state.mode]
  );

  // Get provider
  const getProvider = useCallback(async (): Promise<BrowserProvider> => {
    if (state.mode === "external") {
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error("Ethereum wallet not available");
      }
      return new BrowserProvider(ethereum);
    }

    throw new Error("Use usePrivyWallet for Privy provider");
  }, [state.mode]);

  // Get signer
  const getSigner = useCallback(async (): Promise<Signer> => {
    const provider = await getProvider();
    return provider.getSigner();
  }, [getProvider]);

  // Health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (state.mode === "external") {
      return typeof window !== "undefined" && !!getEthereumProvider();
    }
    return true;
  }, [state.mode]);

  // Reconnect
  const reconnect = useCallback(async () => {
    const previousAddress = state.address;
    await disconnect();
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (state.mode === "external") {
      await connectWithExternal(previousAddress || undefined);
    }
  }, [state.address, state.mode, disconnect, connectWithExternal]);

  // Connection change listener
  const onConnectionChange = useCallback(
    (listener: (connected: boolean) => void): (() => void) => {
      connectionListeners.add(listener);
      listener(state.isConnected);
      return () => connectionListeners.delete(listener);
    },
    [connectionListeners, state.isConnected]
  );

  // Notify listeners on connection change
  useEffect(() => {
    connectionListeners.forEach((listener) => {
      try {
        listener(state.isConnected);
      } catch (error) {
        console.error("Error in connection listener:", error);
      }
    });
  }, [state.isConnected, connectionListeners]);

  // Listen for external wallet account changes
  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (state.mode !== "external" || !ethereum?.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnect();
      } else if (accountsArray[0] !== state.address) {
        setState((prev) => ({
          ...prev,
          address: accountsArray[0],
          selectedAccount: {
            address: accountsArray[0],
            meta: { name: "Account", source: "Ethereum" },
            type: "ethereum",
          },
        }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [state.mode, state.address, disconnect]);

  const value: UnifiedWalletContextValue = {
    ...state,
    connectWithPrivy,
    connectWithExternal,
    disconnect,
    selectAccount,
    signMessage,
    getProvider,
    getSigner,
    isHealthy,
    checkHealth,
    reconnect,
    onConnectionChange,
  };

  return (
    <UnifiedWalletContext.Provider value={value}>
      {children}
    </UnifiedWalletContext.Provider>
  );
}

export function useUnifiedWallet(): UnifiedWalletContextValue {
  const context = useContext(UnifiedWalletContext);
  if (!context) {
    throw new Error(
      "useUnifiedWallet must be used within UnifiedWalletProvider"
    );
  }
  return context;
}
