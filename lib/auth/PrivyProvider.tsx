"use client";

/**
 * PrivyProvider - Privy SDK integration for passkey/email authentication
 *
 * Provides frictionless onboarding with:
 * - Passkey authentication (FaceID/TouchID)
 * - Email/social login
 * - Embedded wallets (no extension required)
 *
 * @see https://docs.privy.io/
 */

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { getCurrentNetwork, NETWORKS } from "@/lib/config/networks";
import { ReactNode } from "react";

interface PrivyProviderProps {
  children: ReactNode;
}

// Define chain configs for Privy
const PRIVY_CHAINS = Object.values(NETWORKS).map((network) => ({
  id: network.chainId,
  name: network.displayName,
  network: network.name,
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: network.rpcEndpoints },
    public: { http: network.rpcEndpoints },
  },
}));

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If no Privy app ID configured, render children without Privy
  if (!appId) {
    return <>{children}</>;
  }

  const network = getCurrentNetwork();
  const defaultChain = PRIVY_CHAINS.find((c) => c.id === network.chainId) || PRIVY_CHAINS[0];

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "passkey", "google", "twitter", "discord", "apple"],
        appearance: {
          theme: "dark",
          accentColor: "#d4af37", // SovSeal gold
          logo: "/logo.png",
          landingHeader: "Welcome to SovSeal",
          loginMessage: "Sign in to access your digital legacy vault",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: PRIVY_CHAINS,
        defaultChain,
        // Legal compliance
        legal: {
          termsAndConditionsUrl: "/terms",
          privacyPolicyUrl: "/privacy",
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
