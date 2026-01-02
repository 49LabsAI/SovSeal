/**
 * Unlock Page - Handle message unlocking and playback
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { Message } from "@/types/contract";
import { calculateMessageStatus } from "@/utils/dateUtils";
import type { UnlockResult } from "@/lib/unlock";

// Dynamic imports for code splitting - heavy components loaded on demand
const UnlockFlow = dynamic(
  () => import("@/components/unlock").then((mod) => ({ default: mod.UnlockFlow })),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
          <p className="mt-4 text-dark-400">Loading unlock interface...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

const MediaPlayer = dynamic(
  () => import("@/components/unlock").then((mod) => ({ default: mod.MediaPlayer })),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
          <p className="mt-4 text-dark-400">Loading media player...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Lazy load heavy services
const loadContractService = () => import("@/lib/contract/ContractService").then((mod) => mod.ContractService);
const loadUnlockService = () => import("@/lib/unlock").then((mod) => mod.UnlockService);

export default function UnlockPage() {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected, login, isReady } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [unlockResult, setUnlockResult] = useState<UnlockResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messageId = params.messageId as string;

  // Load message details
  useEffect(() => {
    const loadMessage = async () => {
      if (!address || !isConnected) {
        setError("Please sign in to unlock messages");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Lazy load services for better code splitting
        const [ContractService, UnlockService] = await Promise.all([
          loadContractService(),
          loadUnlockService(),
        ]);

        // Get all received messages and find the one we want
        const messages = await ContractService.getReceivedMessages(address);
        const messageMetadata = messages.find((m) => m.id === messageId);

        if (!messageMetadata) {
          setError("Message not found or you are not the recipient");
          setLoading(false);
          return;
        }

        // Check if message is unlockable based on timestamp
        const isUnlockable = UnlockService.isMessageUnlockable(
          messageMetadata.unlockTimestamp
        );
        const status = calculateMessageStatus(
          messageMetadata.unlockTimestamp,
          isUnlockable
        );

        const msg: Message = {
          id: messageMetadata.id,
          encryptedKeyCID: messageMetadata.encryptedKeyCID,
          encryptedMessageCID: messageMetadata.encryptedMessageCID,
          messageHash: messageMetadata.messageHash,
          unlockTimestamp: messageMetadata.unlockTimestamp,
          sender: messageMetadata.sender,
          recipient: messageMetadata.recipient,
          status,
          createdAt: messageMetadata.createdAt,
        };

        setMessage(msg);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load message");
      } finally {
        setLoading(false);
      }
    };

    loadMessage();
  }, [address, isConnected, messageId]);

  const handleUnlock = async (msg: Message) => {
    try {
      // Lazy load unlock service
      const UnlockService = await loadUnlockService();
      const result = await UnlockService.unlockMessage(msg, {
        onProgress: (stage, progress) => {
          console.log(`${stage}: ${progress}%`);
        },
      });

      // Mark message as viewed in localStorage
      const viewedKey = `message_viewed_${msg.id}`;
      localStorage.setItem(viewedKey, "true");

      // Update message status to Unlocked
      setMessage((prev) => (prev ? { ...prev, status: "Unlocked" } : null));

      // Set unlock result to show player
      setUnlockResult(result);
    } catch (err) {
      throw err; // Let UnlockFlow handle the error display
    }
  };

  const handleClose = () => {
    // Navigate back to dashboard
    router.push("/dashboard");
  };

  const handlePlayerClose = () => {
    // Clear unlock result and navigate back
    setUnlockResult(null);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading message...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
            Unable to Load Message
          </h2>
          <p className="mb-6 text-center text-gray-600">{error}</p>
          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <>
      {!unlockResult && (
        <UnlockFlow
          message={message}
          onUnlock={handleUnlock}
          onClose={handleClose}
        />
      )}

      {unlockResult && (
        <MediaPlayer
          unlockResult={unlockResult}
          onClose={handlePlayerClose}
          messageId={message.id}
          sender={message.sender}
        />
      )}
    </>
  );
}
