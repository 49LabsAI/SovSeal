"use client";

/**
 * Error boundary for the Create Message page
 * Handles failures in wallet operations, encryption, storage uploads,
 * and blockchain transactions during message creation
 */

import { useEffect } from "react";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function CreateMessageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Create message page error:", error);
  }, [error]);

  const getErrorInfo = () => {
    const message = error.message.toLowerCase();

    if (message.includes("privy") || message.includes("auth") || message.includes("login")) {
      return {
        title: "Authentication Error",
        description: "There was a problem with your sign-in session.",
        suggestions: [
          "Try signing out and signing back in",
          "Check that pop-ups are not blocked",
          "Clear browser cache and try again",
        ],
      };
    }

    if (message.includes("wallet") || message.includes("signer") || message.includes("provider")) {
      return {
        title: "Wallet Error",
        description: "Unable to access your wallet for signing the transaction.",
        suggestions: [
          "Ensure your wallet is unlocked",
          "Try reconnecting your wallet",
          "Check that you approved the connection request",
        ],
      };
    }

    if (message.includes("storacha") || message.includes("upload") || message.includes("ipfs")) {
      return {
        title: "Storage Upload Failed",
        description: "Could not upload your encrypted message to decentralized storage.",
        suggestions: [
          "Check your internet connection",
          "Verify Storacha is connected in Settings",
          "Try again in a few moments",
        ],
      };
    }

    if (message.includes("encrypt") || message.includes("crypto") || message.includes("key")) {
      return {
        title: "Encryption Error",
        description: "Failed to encrypt your message content.",
        suggestions: [
          "Ensure your browser supports Web Crypto API",
          "Try using Chrome, Firefox, or Edge",
          "Refresh the page and try again",
        ],
      };
    }

    if (message.includes("transaction") || message.includes("contract") || message.includes("gas")) {
      return {
        title: "Blockchain Transaction Failed",
        description: "Could not submit the message to the blockchain.",
        suggestions: [
          "Ensure you have enough PAS tokens for gas",
          "Check that you're on the correct network",
          "The network may be congested - try again shortly",
        ],
      };
    }

    if (message.includes("network") || message.includes("rpc") || message.includes("chain")) {
      return {
        title: "Network Error",
        description: "Unable to connect to the blockchain network.",
        suggestions: [
          "Check your internet connection",
          "The RPC endpoint may be temporarily unavailable",
          "Try switching networks in your wallet",
        ],
      };
    }

    if (message.includes("media") || message.includes("record") || message.includes("microphone")) {
      return {
        title: "Media Error",
        description: "There was a problem with media recording or upload.",
        suggestions: [
          "Grant microphone/camera permissions if prompted",
          "Check that no other app is using your microphone",
          "Try uploading a file instead of recording",
        ],
      };
    }

    return {
      title: "Message Creation Failed",
      description: "An unexpected error occurred while creating your message.",
      suggestions: [
        "Refresh the page and try again",
        "Check your wallet and storage connections",
        "Your media file may be too large - try a smaller file",
      ],
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="card-glass w-full max-w-lg p-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
        </div>

        <h1 className="mb-3 text-center font-display text-2xl font-bold text-dark-100">
          {errorInfo.title}
        </h1>

        <p className="mb-6 text-center text-dark-400">{errorInfo.description}</p>

        <details className="mb-6 rounded-lg border border-dark-800 bg-dark-900/50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-dark-300 hover:text-dark-200">
            Technical Details
          </summary>
          <pre className="mt-3 max-h-32 overflow-auto rounded bg-dark-950 p-2 font-mono text-xs text-dark-500">
            {error.message}
          </pre>
        </details>

        <div className="mb-6 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
          <p className="mb-2 text-sm font-medium text-brand-400">What you can try:</p>
          <ul className="space-y-1 text-sm text-dark-400">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-brand-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/app"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2 text-sm font-medium text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-dark-500">
          Your media file is safe locally until you navigate away.
        </p>
      </div>
    </div>
  );
}
