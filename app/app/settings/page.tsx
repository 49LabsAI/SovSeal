"use client";

import Link from "next/link";
import { StorachaAuth } from "@/components/storage/StorachaAuth";
import { ConnectionStatus } from "@/components/storage/ConnectionStatus";
import { useStoracha } from "@/hooks/useStoracha";
import { useAuth } from "@/hooks/useAuth";
import { AuthButton } from "@/components/auth";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const { authState, isReady, logout } = useStoracha();
  const { isConnected } = useAuth();

  const handleResetConnection = () => {
    if (
      confirm(
        "Are you sure you want to reset your Storacha connection? You will need to re-authenticate."
      )
    ) {
      logout();
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/app"
          className="mb-4 inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mb-2 font-display text-3xl font-bold">Settings</h1>
        <p className="text-dark-400">
          Manage your account and storage connections
        </p>
      </div>

      {/* Connection Status */}
      <ConnectionStatus className="mb-6" />

      {/* Account Section */}
      {!isConnected && (
        <div className="card-glass mb-6 p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">
            Account
          </h2>
          <p className="mb-4 text-sm text-dark-400">
            Sign in to access your messages and create new ones
          </p>
          <AuthButton />
        </div>
      )}

      {/* Storage Section */}
      <div className="card-glass mb-6 p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">
          Decentralized Storage
        </h2>
        <p className="mb-4 text-sm text-dark-400">
          Connect to Storacha Network for secure, decentralized file storage
        </p>
        <StorachaAuth />
      </div>

      {/* Storage Info */}
      {isReady && (
        <div className="card-glass mb-6 p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">
            Storage Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <span className="text-sm text-dark-200">Connected</span>
            </div>

            <div>
              <p className="mb-1 text-xs text-dark-500">Email</p>
              <p className="text-sm text-dark-200">{authState.email}</p>
            </div>

            <div>
              <p className="mb-1 text-xs text-dark-500">Space DID</p>
              <p className="break-all font-mono text-xs text-dark-300">
                {authState.spaceDid}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-dark-500">Gateway</p>
              <p className="text-sm text-dark-200">
                {process.env.NEXT_PUBLIC_STORACHA_GATEWAY || "storacha.link"}
              </p>
            </div>

            <div className="border-t border-dark-700 pt-4">
              <button
                onClick={handleResetConnection}
                className="flex items-center gap-2 text-sm text-red-400 transition-colors hover:text-red-300"
              >
                <TrashIcon className="h-4 w-4" />
                Reset Connection
              </button>
              <p className="mt-2 text-xs text-dark-500">
                Clear your Storacha authentication and re-connect.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="card-glass border-brand-500/20 bg-brand-500/5 p-6">
        <div className="flex gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-brand-400" />
          <div>
            <h3 className="mb-1 font-medium text-dark-100">Need Help?</h3>
            <p className="text-sm text-dark-400">
              Visit the{" "}
              <a
                href="https://docs.storacha.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Storacha documentation
              </a>{" "}
              or join the{" "}
              <a
                href="https://discord.gg/8uza4ha73R"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Discord community
              </a>{" "}
              for support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
