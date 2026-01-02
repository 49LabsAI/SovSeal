"use client";

/**
 * Component for recipients to claim messages using a passphrase
 */

import { useState } from "react";
import Link from "next/link";
import { RedeemPackageService } from "@/lib/redeem";
import { IPFSService } from "@/lib/storage";
import type { DecryptedRedeemPackage } from "@/types/redeem";
import { useAuth } from "@/hooks/useAuth";

interface ClaimInterfaceProps {
  packageCID: string;
  onClaimed: (redeemPackage: DecryptedRedeemPackage) => void;
}

export function ClaimInterface({ packageCID, onClaimed }: ClaimInterfaceProps) {
  const { isConnected } = useAuth();
  const [passphrase, setPassphrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [decryptedPackage, setDecryptedPackage] =
    useState<DecryptedRedeemPackage | null>(null);

  const handleClaim = async () => {
    setError(null);

    if (!passphrase) {
      setError("Please enter the passphrase");
      return;
    }

    setIsLoading(true);

    try {
      // Download encrypted package from IPFS
      const packageBlob = await IPFSService.downloadFile(packageCID);

      // Deserialize the encrypted package
      const encryptedPackage =
        await RedeemPackageService.deserializeEncryptedPackage(packageBlob);

      // Decrypt with passphrase
      const decrypted = await RedeemPackageService.decryptRedeemPackage(
        encryptedPackage,
        passphrase
      );

      setDecryptedPackage(decrypted);
      onClaimed(decrypted);
    } catch (err) {
      console.error("Failed to claim package:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to decrypt package. Please check your passphrase."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (decryptedPackage) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-green-600">
          ✓ Package Claimed Successfully
        </h2>

        <div className="mb-6 rounded border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            You have successfully claimed this message package. The message will
            be available to unlock after the specified timestamp.
          </p>
        </div>

        {/* Package Details */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              From
            </label>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm">
              {decryptedPackage.sender}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Unlock Time
            </label>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              {new Date(decryptedPackage.unlockTimestamp).toLocaleString()}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <div className="whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {decryptedPackage.instructions}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-6 rounded border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-900">Next Steps:</h3>
          <ol className="list-inside list-decimal space-y-2 text-sm text-blue-800">
            <li>The message metadata has been saved to your browser</li>
            <li>
              Visit your dashboard to see this message in your received messages
            </li>
            <li>
              Wait until{" "}
              {new Date(decryptedPackage.unlockTimestamp).toLocaleString()} to
              unlock
            </li>
            <li>
              Sign in to decrypt and view the message
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-gray-300 px-4 py-2 text-center transition-colors hover:bg-gray-50"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">
        Claim Your Time-Locked Message
      </h2>

      <div className="mb-6 rounded border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          You&apos;ve received a time-locked message. Enter the passphrase that
          was shared with you to claim it.
        </p>
      </div>

      {/* Auth Status */}
      {!isConnected && (
        <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 p-4">
          <p className="mb-2 text-sm font-medium text-yellow-900">
            Sign In Required
          </p>
          <p className="mb-3 text-sm text-yellow-800">
            You need to sign in to claim this message. Click the sign in button
            to continue with your email, passkey, or wallet.
          </p>
        </div>
      )}

      {/* Package CID */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Package ID (IPFS CID)
        </label>
        <div className="break-all rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs">
          {packageCID}
        </div>
      </div>

      {/* Passphrase Input */}
      <div className="mb-4">
        <label
          htmlFor="passphrase"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Passphrase
        </label>
        <div className="relative">
          <input
            id="passphrase"
            type={showPassphrase ? "text" : "password"}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleClaim();
              }
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the passphrase shared with you"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassphrase(!showPassphrase)}
            className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {showPassphrase ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={isLoading || !passphrase || !isConnected}
        className="mb-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isLoading ? "Claiming..." : "Claim Message"}
      </button>

      {/* Help Text */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Need Help?</p>
        <ul className="list-inside list-disc space-y-1 text-xs text-gray-600">
          <li>Make sure you have the correct passphrase from the sender</li>
          <li>The passphrase is case-sensitive</li>
          <li>You must be signed in to claim</li>
          <li>Check if the claim link has expired</li>
        </ul>
      </div>
    </div>
  );
}
