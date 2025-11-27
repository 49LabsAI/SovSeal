"use client";

import Link from "next/link";
import { AccountSelector } from "@/components/wallet/AccountSelector";
import { KeyBackupWarning } from "@/components/wallet/KeyBackupWarning";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { useStoracha } from "@/hooks/useStoracha";
import { Logo } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";

export default function Home() {
  const { isConnected } = useWallet();
  const { isReady: isStorachaReady, isLoading: isStorachaLoading } = useStoracha();

  return (
    <div className="flex flex-col items-center justify-center p-4 py-8 md:p-8 md:py-16">
      <div className="w-full max-w-2xl space-y-6 md:space-y-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="mb-8 text-xl text-gray-300">
            Guaranteed by math, not corporations
          </p>
          <p className="mx-auto max-w-lg text-sm text-gray-400">
            Create time-locked messages with client-side encryption,
            decentralized storage, and blockchain-enforced unlock conditions.
          </p>
        </div>

        {/* Privacy Features */}
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-xl text-green-400">🔒</span>
            <div>
              <h3 className="mb-1 font-semibold text-gray-100">
                Client-Side Encryption
              </h3>
              <p className="text-gray-300">
                All encryption happens in your browser. No plaintext data ever
                leaves your device.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-xl text-blue-400">⏰</span>
            <div>
              <h3 className="mb-1 font-semibold text-gray-100">Time-Locked</h3>
              <p className="text-gray-300">
                Blockchain enforces unlock conditions. Messages can only be
                decrypted after the specified time.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-xl text-purple-400">🌐</span>
            <div>
              <h3 className="mb-1 font-semibold text-gray-100">
                Decentralized Storage
              </h3>
              <p className="text-gray-300">
                Lockdrop stores encrypted messages on IPFS. No central authority
                controls your data.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-xl text-orange-400">🔗</span>
            <div>
              <h3 className="mb-1 font-semibold text-gray-100">
                Blockchain Verified
              </h3>
              <p className="text-gray-300">
                Message metadata anchored on Polkadot testnet for transparency
                and immutability.
              </p>
            </div>
          </div>
        </div>

        {isConnected ? (
          <>
            <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
              <AccountSelector />

              <div className="flex w-full gap-4">
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/create"
                  className="flex-1 rounded-lg bg-purple-600 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-purple-700"
                >
                  Create Message
                </Link>
              </div>
            </div>

            {isStorachaLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
                <LoadingSpinner size="sm" />
                <p className="text-gray-600 dark:text-gray-400">
                  Checking storage connection...
                </p>
              </div>
            ) : isStorachaReady ? (
              <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900">
                <p className="text-green-800 dark:text-green-200">
                  ✓ Wallet and storage connected! You&apos;re ready to create
                  time-locked messages.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:bg-yellow-900">
                <p className="mb-3 text-yellow-800 dark:text-yellow-200">
                  ⚠️ One more step: Connect to Storacha Network for
                  decentralized storage
                </p>
                <Link
                  href="/settings"
                  className="inline-block rounded-lg bg-yellow-600 px-6 py-2 font-medium text-white transition-colors hover:bg-yellow-700"
                >
                  Set Up Storage
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-gray-800 p-8 text-center shadow-lg border border-gray-700">
            <p className="mb-4 text-gray-300">
              Connect your wallet to get started
            </p>
            <p className="text-sm text-gray-400 mb-2">
              Use the &quot;Connect Wallet&quot; button in the navigation above
            </p>
            <p className="text-xs text-gray-500">
              ⚠️ Requires Talisman (recommended) or MetaMask with an Ethereum account (0x...)
            </p>
          </div>
        )}
      </div>

      {isConnected && <KeyBackupWarning />}
    </div>
  );
}
