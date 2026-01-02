"use client";

/**
 * Error boundary for the authenticated app section
 * Catches auth/wallet failures and provides recovery options
 */

import { useEffect } from "react";
import Link from "next/link";
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service
    console.error("App section error:", error);
  }, [error]);

  // Detect auth-related errors
  const isAuthError =
    error.message.includes("wallet") ||
    error.message.includes("Privy") ||
    error.message.includes("auth") ||
    error.message.includes("connect");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="card-glass w-full max-w-md p-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
        </div>

        {/* Error Title */}
        <h1 className="mb-3 font-display text-2xl font-bold text-dark-100">
          {isAuthError ? "Authentication Error" : "Something Went Wrong"}
        </h1>

        {/* Error Description */}
        <p className="mb-6 text-dark-400">
          {isAuthError
            ? "There was a problem with your wallet or authentication. This can happen if your wallet extension is unavailable or the connection was interrupted."
            : "An unexpected error occurred. Your data is safe — this is likely a temporary issue."}
        </p>

        {/* Error Details (collapsible) */}
        <details className="mb-6 rounded-lg border border-dark-800 bg-dark-900/50 p-3 text-left">
          <summary className="cursor-pointer text-sm font-medium text-dark-300 hover:text-dark-200">
            Technical Details
          </summary>
          <pre className="mt-3 max-h-32 overflow-auto rounded bg-dark-950 p-2 font-mono text-xs text-dark-500">
            {error.message}
          </pre>
        </details>

        {/* Recovery Suggestions */}
        {isAuthError && (
          <div className="mb-6 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4 text-left">
            <p className="mb-2 text-sm font-medium text-brand-400">Try these steps:</p>
            <ul className="space-y-1 text-sm text-dark-400">
              <li>• Refresh the page and sign in again</li>
              <li>• Try signing out and signing back in</li>
              <li>• Clear browser cache if the issue persists</li>
              <li>• Check your internet connection</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2 text-sm font-medium text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100"
          >
            <HomeIcon className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
