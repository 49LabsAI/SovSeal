"use client";

/**
 * AuthButton - Privy authentication button
 *
 * Provides frictionless onboarding with:
 * - Passkey authentication (FaceID/TouchID)
 * - Email/social login
 * - Embedded wallets
 */

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Tooltip } from "@/components/ui";
import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FingerprintIcon } from "lucide-react";

export function AuthButton() {
  const { login, logout, authenticated, ready, user } = usePrivy();

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Get display name (email or wallet address)
  const getDisplayName = () => {
    if (user?.email?.address) {
      return user.email.address;
    }
    if (user?.wallet?.address) {
      return formatAddress(user.wallet.address);
    }
    return "Connected";
  };

  // Connected state
  if (authenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <Tooltip content={`Signed in: ${getDisplayName()}`} position="bottom">
          <div className="flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2">
            <UserCircleIcon className="h-4 w-4 text-brand-400" />
            <span className="max-w-[120px] truncate font-mono text-xs text-brand-400 sm:max-w-[150px] sm:text-sm">
              {getDisplayName()}
            </span>
          </div>
        </Tooltip>
        <button
          onClick={logout}
          className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          aria-label="Sign out"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Not connected - show sign in button
  return (
    <Tooltip content="Sign in with passkey, email, or social" position="bottom">
      <button
        onClick={login}
        disabled={!ready}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        aria-label="Sign in"
      >
        <FingerprintIcon className="h-4 w-4" />
        <span className="hidden sm:inline">
          {!ready ? "Loading..." : "Sign In"}
        </span>
      </button>
    </Tooltip>
  );
}
