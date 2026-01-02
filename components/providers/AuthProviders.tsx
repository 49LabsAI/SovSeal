"use client";

/**
 * AuthProviders - Privy authentication provider
 *
 * Wraps the app with Privy for passkey/email/social authentication.
 * Error boundary coverage provided by app/app/error.tsx for auth failures.
 */

import { ReactNode } from "react";
import { PrivyProvider } from "@/lib/auth/PrivyProvider";

interface AuthProvidersProps {
  children: ReactNode;
}

export function AuthProviders({ children }: AuthProvidersProps) {
  return <PrivyProvider>{children}</PrivyProvider>;
}
