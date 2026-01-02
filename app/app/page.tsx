"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useStoracha } from "@/hooks/useStoracha";
import {
  InboxIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Dynamic imports for code splitting - dashboard components loaded on demand
const SentMessages = dynamic(
  () => import("@/components/dashboard/SentMessages").then((mod) => ({ default: mod.SentMessages })),
  {
    loading: () => (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-dark-800/50" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

const ReceivedMessages = dynamic(
  () => import("@/components/dashboard/ReceivedMessages").then((mod) => ({ default: mod.ReceivedMessages })),
  {
    loading: () => (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-dark-800/50" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

const KeyBackupWarning = dynamic(
  () => import("@/components/wallet/KeyBackupWarning").then((mod) => ({ default: mod.KeyBackupWarning })),
  { ssr: false }
);

type TabType = "sent" | "received";

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<TabType>("received");
  const { isConnected, address, login, isReady } = useAuth();
  const { isReady: isStorachaReady } = useStoracha();
  const loginAttempted = useRef(false);

  // Auto-trigger Privy login when user lands on /app and isn't authenticated
  useEffect(() => {
    if (isReady && !isConnected && !loginAttempted.current) {
      loginAttempted.current = true;
      login();
    }
  }, [isReady, isConnected, login]);

  // Show loading state while Privy initializes or auth is in progress
  if (!isReady || !isConnected) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 font-display text-3xl font-bold">Messages</h1>
            <p className="text-dark-400">Your time-locked messages</p>
          </div>
          <Link
            href="/app/create"
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Message
          </Link>
        </div>

        {/* Storage Warning */}
        {!isStorachaReady && (
          <div className="card-glass mb-6 border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <p className="text-sm text-dark-300">
                  Connect to Storacha Network to create messages
                </p>
              </div>
              <Link
                href="/app/settings"
                className="text-sm text-brand-400 hover:underline"
              >
                Set up storage →
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              activeTab === "received"
                ? "border border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "text-dark-400 hover:bg-dark-800/50 hover:text-dark-200"
            }`}
          >
            <InboxIcon className="h-5 w-5" />
            Received
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              activeTab === "sent"
                ? "border border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "text-dark-400 hover:bg-dark-800/50 hover:text-dark-200"
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            Sent
          </button>
        </div>

        {/* Messages Content */}
        <div className="card-glass p-6">
          {activeTab === "received" && <ReceivedMessages address={address!} />}
          {activeTab === "sent" && <SentMessages address={address!} />}
        </div>

        {/* Key Backup Warning */}
        <KeyBackupWarning />
      </div>
    </div>
  );
}
