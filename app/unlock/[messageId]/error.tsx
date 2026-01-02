"use client";

import { useEffect } from "react";

/**
 * Error boundary for the Unlock Message page
 * Catches errors from message loading, decryption, IPFS downloads,
 * and media playback operations
 */
export default function UnlockMessageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error("Unlock message page error:", error);
  }, [error]);

  // Determine error type and provide specific guidance
  const getErrorMessage = () => {
    const message = error.message.toLowerCase();

    if (message.includes("wallet") || message.includes("extension") || message.includes("privy") || message.includes("auth")) {
      return {
        title: "Authentication Error",
        description:
          "There was a problem accessing your account to decrypt the message.",
        suggestions: [
          "Make sure you are signed in with the correct account",
          "Ensure you are connected with the recipient address",
          "Try signing out and signing back in",
        ],
      };
    }

    if (
      message.includes("timestamp") ||
      message.includes("locked") ||
      message.includes("unlock time")
    ) {
      return {
        title: "Message Still Locked",
        description: "This message cannot be unlocked yet.",
        suggestions: [
          "Check the unlock timestamp on the message",
          "Wait until the unlock time has passed",
          "The countdown timer shows when the message will be available",
        ],
      };
    }

    if (
      message.includes("decrypt") ||
      message.includes("key") ||
      message.includes("crypto")
    ) {
      return {
        title: "Decryption Error",
        description: "Unable to decrypt the message content.",
        suggestions: [
          "Ensure you are using the correct recipient account",
          "The message may have been encrypted for a different address",
          "Check that your wallet has access to the private key",
        ],
      };
    }

    if (
      message.includes("ipfs") ||
      message.includes("download") ||
      message.includes("cid")
    ) {
      return {
        title: "Download Error",
        description: "Failed to download the encrypted message from IPFS.",
        suggestions: [
          "Check your internet connection",
          "IPFS gateways may be temporarily unavailable",
          "Try again in a few moments",
        ],
      };
    }

    if (
      message.includes("hash") ||
      message.includes("integrity") ||
      message.includes("corrupted")
    ) {
      return {
        title: "Data Integrity Error",
        description:
          "The message data appears to be corrupted or tampered with.",
        suggestions: [
          "The encrypted data may have been modified",
          "Try downloading the message again",
          "Contact the sender to verify the message",
        ],
      };
    }

    if (message.includes("not found") || message.includes("recipient")) {
      return {
        title: "Message Not Found",
        description:
          "This message does not exist or you are not the recipient.",
        suggestions: [
          "Verify the message ID is correct",
          "Ensure you are connected with the recipient account",
          "The message may have been deleted or expired",
        ],
      };
    }

    if (
      message.includes("playback") ||
      message.includes("media") ||
      message.includes("video") ||
      message.includes("audio")
    ) {
      return {
        title: "Playback Error",
        description: "Unable to play the decrypted media.",
        suggestions: [
          "Your browser may not support this media format",
          "Try using a different browser (Chrome, Firefox, or Edge)",
          "Check that your browser supports HTML5 media playback",
        ],
      };
    }

    // Generic error
    return {
      title: "Unable to Unlock Message",
      description: "An unexpected error occurred while unlocking this message.",
      suggestions: [
        "Try refreshing the page",
        "Check your internet connection",
        "Ensure your wallet is connected and unlocked",
      ],
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 p-4">
      <div className="card-glass w-full max-w-2xl p-8">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <svg
              className="h-12 w-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="mb-2 text-center font-display text-2xl font-bold text-dark-100">
          {errorInfo.title}
        </h1>

        {/* Error Description */}
        <p className="mb-6 text-center text-dark-400">
          {errorInfo.description}
        </p>

        {/* Error Details (collapsible) */}
        <details className="mb-6 rounded-lg border border-dark-800 bg-dark-900/50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-dark-300 hover:text-dark-200">
            Technical Details
          </summary>
          <div className="mt-3 max-h-40 overflow-auto rounded bg-dark-950 p-3 font-mono text-sm text-dark-500">
            {error.message}
          </div>
        </details>

        {/* Suggestions */}
        <div className="mb-6 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-brand-400">
            What you can try:
          </h3>
          <ul className="space-y-1 text-sm text-dark-300">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-brand-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="btn-primary flex-1 py-3"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="flex-1 rounded-lg border border-dark-700 bg-dark-800/50 px-6 py-3 text-center font-medium text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Help Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-dark-500">
            Need help?{" "}
            <a
              href="https://github.com/your-repo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              Report this issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
