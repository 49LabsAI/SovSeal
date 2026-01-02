"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useStoracha } from "@/hooks/useStoracha";
import { useNetworkCheck } from "@/hooks/useNetworkCheck";
import { NetworkCheckModal } from "@/components/ui/NetworkCheckModal";
import type { MediaFile } from "@/types/media";
import type { MessageCreationProgress } from "@/lib/message";
import {
  MicrophoneIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Dynamic imports for code splitting - heavy components loaded on demand
const MediaRecorder = dynamic(
  () => import("@/components/media/MediaRecorder").then((mod) => ({ default: mod.MediaRecorder })),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

const MediaUploader = dynamic(
  () => import("@/components/media/MediaUploader").then((mod) => ({ default: mod.MediaUploader })),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

const MediaPreview = dynamic(
  () => import("@/components/media/MediaPreview").then((mod) => ({ default: mod.MediaPreview })),
  {
    loading: () => (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

const StorachaAuth = dynamic(
  () => import("@/components/storage/StorachaAuth").then((mod) => ({ default: mod.StorachaAuth })),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

// Lazy load the message creation service
const loadMessageCreationService = () => import("@/lib/message").then((mod) => mod.MessageCreationService);

type MediaSource = "record" | "upload" | null;

/**
 * Shareable link section shown after successful message creation
 */
function ShareableLinkSection({ messageId }: { messageId: string }) {
  const [copied, setCopied] = useState(false);
  const unlockUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/unlock/${messageId}`
    : `/unlock/${messageId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(unlockUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-dark-400">
          Share this link with the recipient
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={unlockUrl}
            readOnly
            className="input-field flex-1 bg-dark-800/50 font-mono text-xs"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              copied
                ? "bg-green-500/20 text-green-400"
                : "bg-brand-500/20 text-brand-400 hover:bg-brand-500/30"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <p className="text-xs text-dark-500">
        The recipient will need to connect their wallet (address: {" "}
        <span className="font-mono">{messageId.slice(0, 10)}...</span>) to unlock the message.
      </p>
    </div>
  );
}

export default function CreateMessagePage() {
  const { address, isConnected } = useAuth();
  const { isReady: isStorachaReady } = useStoracha();
  const { isCorrectNetwork, isChecking: isCheckingNetwork } = useNetworkCheck();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [unlockTime, setUnlockTime] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [timestampError, setTimestampError] = useState("");
  const [mediaSource, setMediaSource] = useState<MediaSource>(null);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [progress, setProgress] = useState<MessageCreationProgress | null>(
    null
  );
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    error?: string;
  } | null>(null);

  const validateRecipientAddress = (addr: string): boolean => {
    if (!addr || addr.trim().length === 0) {
      setRecipientError("Recipient address is required");
      return false;
    }
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(addr.trim())) {
      setRecipientError(
        "Invalid Ethereum address format (0x + 40 hex characters)"
      );
      return false;
    }
    if (addr.trim().toLowerCase() === address?.toLowerCase()) {
      setRecipientError("Cannot send message to yourself");
      return false;
    }
    setRecipientError("");
    return true;
  };

  const validateUnlockTimestamp = (): boolean => {
    if (!unlockDate || !unlockTime) {
      setTimestampError("Please select both date and time");
      return false;
    }
    const unlockTimestamp = new Date(`${unlockDate}T${unlockTime}`).getTime();
    if (unlockTimestamp <= Date.now()) {
      setTimestampError("Unlock time must be in the future");
      return false;
    }
    setTimestampError("");
    return true;
  };

  const handleRecordingComplete = (blob: Blob, type: "audio" | "video") => {
    setMediaFile({
      blob,
      type,
      size: blob.size,
      mimeType: blob.type,
      name: `recorded-${type}-${Date.now()}`,
    });
  };

  const handleFileUpload = (file: MediaFile) => setMediaFile(file);
  const handleClearMedia = () => {
    setMediaFile(null);
    setMediaSource(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isRecipientValid = validateRecipientAddress(recipientAddress);
    const isTimestampValid = validateUnlockTimestamp();
    if (!isRecipientValid || !isTimestampValid) return;
    if (!mediaFile) {
      alert("Please record or upload a message");
      return;
    }
    if (!isConnected || !address) {
      alert("Please sign in first");
      return;
    }

    // Check network before proceeding
    if (!isCorrectNetwork && !isCheckingNetwork) {
      setPendingSubmit(true);
      setShowNetworkModal(true);
      return;
    }

    await executeSubmit();
  };

  const executeSubmit = async () => {
    setResult(null);
    setIsSubmitting(true);

    try {
      const unlockTimestamp = new Date(`${unlockDate}T${unlockTime}`).getTime();
      // Lazy load the message creation service for better code splitting
      const MessageCreationService = await loadMessageCreationService();
      
      // Create a WalletAccount-compatible object from Privy auth
      const senderAccount = {
        address: address!,
        meta: {
          name: "Privy Wallet",
          source: "privy",
        },
        type: "ethereum" as const,
      };
      
      const creationResult = await MessageCreationService.createMessage(
        {
          mediaFile: mediaFile!,
          recipientAddress: recipientAddress.trim(),
          unlockTimestamp,
          senderAccount,
        },
        (progressUpdate) => setProgress(progressUpdate)
      );
      setResult(creationResult);
      if (creationResult.success) {
        setTimeout(() => {
          setRecipientAddress("");
          setUnlockDate("");
          setUnlockTime("");
          setMediaFile(null);
          setMediaSource(null);
          setProgress(null);
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNetworkReady = () => {
    setShowNetworkModal(false);
    if (pendingSubmit) {
      setPendingSubmit(false);
      executeSubmit();
    }
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="card-glass max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
            <ExclamationTriangleIcon className="h-8 w-8 text-brand-400" />
          </div>
          <h2 className="mb-4 font-display text-2xl font-bold">
            Sign In Required
          </h2>
          <p className="mb-6 text-dark-400">
            Sign in to create time-locked messages.
          </p>
          <Link href="/app" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isStorachaReady) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold">
            Storage Setup Required
          </h1>
          <p className="text-dark-400">
            Connect to Storacha Network for decentralized storage before
            creating messages.
          </p>
        </div>
        <StorachaAuth onAuthComplete={() => window.location.reload()} />
        <div className="mt-6 text-center">
          <Link
            href="/app"
            className="text-sm text-dark-400 hover:text-dark-200"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/app"
          className="mb-4 inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mb-2 font-display text-3xl font-bold">
          Create Time-Locked Message
        </h1>
        <p className="text-dark-400">
          Record or upload a message that unlocks at a specific time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient */}
        <div className="card-glass p-6">
          <label
            htmlFor="recipient"
            className="mb-2 block text-sm font-medium text-dark-200"
          >
            Recipient Address
          </label>
          <input
            type="text"
            id="recipient"
            value={recipientAddress}
            onChange={(e) => {
              setRecipientAddress(e.target.value);
              if (recipientError) validateRecipientAddress(e.target.value);
            }}
            onBlur={() => validateRecipientAddress(recipientAddress)}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"
            className={`input-field ${recipientError ? "border-red-500 focus:ring-red-500/50" : ""}`}
          />
          {recipientError && (
            <p className="mt-2 text-sm text-red-400">{recipientError}</p>
          )}
          <p className="mt-2 text-xs text-dark-500">
            Ethereum address (0x...) of the recipient
          </p>
        </div>

        {/* Unlock Time */}
        <div className="card-glass p-6">
          <label className="mb-2 block text-sm font-medium text-dark-200">
            Unlock Date & Time
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="unlock-date"
                className="mb-1 block text-xs text-dark-500"
              >
                Date
              </label>
              <input
                type="date"
                id="unlock-date"
                value={unlockDate}
                onChange={(e) => {
                  setUnlockDate(e.target.value);
                  if (timestampError && unlockTime) validateUnlockTimestamp();
                }}
                min={new Date().toISOString().split("T")[0]}
                className={`input-field ${timestampError ? "border-red-500" : ""}`}
              />
            </div>
            <div>
              <label
                htmlFor="unlock-time"
                className="mb-1 block text-xs text-dark-500"
              >
                Time
              </label>
              <input
                type="time"
                id="unlock-time"
                value={unlockTime}
                onChange={(e) => {
                  setUnlockTime(e.target.value);
                  if (timestampError && unlockDate) validateUnlockTimestamp();
                }}
                className={`input-field ${timestampError ? "border-red-500" : ""}`}
              />
            </div>
          </div>
          {timestampError && (
            <p className="mt-2 text-sm text-red-400">{timestampError}</p>
          )}
          <p className="mt-2 text-xs text-dark-500">
            Message unlocks after this date and time
          </p>
        </div>

        {/* Media Selection */}
        <div className="card-glass p-6">
          <label className="mb-4 block text-sm font-medium text-dark-200">
            Message Content
          </label>

          {!mediaSource && !mediaFile && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setMediaSource("record")}
                className="group rounded-xl border-2 border-dashed border-dark-700 p-6 transition-all hover:border-brand-500/50 hover:bg-dark-800/50"
              >
                <MicrophoneIcon className="mx-auto h-10 w-10 text-dark-500 transition-colors group-hover:text-brand-400" />
                <p className="mt-3 font-medium">Record Message</p>
                <p className="mt-1 text-xs text-dark-500">Audio or video</p>
              </button>
              <button
                type="button"
                onClick={() => setMediaSource("upload")}
                className="group rounded-xl border-2 border-dashed border-dark-700 p-6 transition-all hover:border-brand-500/50 hover:bg-dark-800/50"
              >
                <CloudArrowUpIcon className="mx-auto h-10 w-10 text-dark-500 transition-colors group-hover:text-brand-400" />
                <p className="mt-3 font-medium">Upload File</p>
                <p className="mt-1 text-xs text-dark-500">
                  MP3, WAV, MP4, etc.
                </p>
              </button>
            </div>
          )}

          {mediaSource === "record" && !mediaFile && (
            <div>
              <MediaRecorder onRecordingComplete={handleRecordingComplete} />
              <button
                type="button"
                onClick={() => setMediaSource(null)}
                className="mt-4 text-sm text-dark-400 hover:text-dark-200"
              >
                ← Back to selection
              </button>
            </div>
          )}

          {mediaSource === "upload" && !mediaFile && (
            <div>
              <MediaUploader onFileSelect={handleFileUpload} />
              <button
                type="button"
                onClick={() => setMediaSource(null)}
                className="mt-4 text-sm text-dark-400 hover:text-dark-200"
              >
                ← Back to selection
              </button>
            </div>
          )}

          {mediaFile && (
            <div>
              <MediaPreview mediaFile={mediaFile} />
              <button
                type="button"
                onClick={handleClearMedia}
                className="mt-4 text-sm text-red-400 hover:text-red-300"
              >
                Remove and choose different media
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        {isSubmitting && progress && (
          <div className="card-glass p-6">
            <h3 className="mb-4 font-display font-semibold">
              Creating Message...
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">{progress.message}</span>
                <span className="font-medium text-brand-400">
                  {Math.round(progress.progress)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="flex items-center gap-2 text-xs text-dark-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                Please wait and do not close this page...
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`card-glass p-6 ${result.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
          >
            <div className="flex gap-4">
              {result.success ? (
                <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-green-400" />
              ) : (
                <XCircleIcon className="h-6 w-6 flex-shrink-0 text-red-400" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-display font-semibold ${result.success ? "text-green-400" : "text-red-400"}`}
                >
                  {result.success
                    ? "Message Created Successfully!"
                    : "Message Creation Failed"}
                </h3>
                {result.success ? (
                  <div className="mt-2 text-sm text-dark-300">
                    <p>
                      Your time-locked message has been created and stored on
                      the blockchain.
                    </p>
                    {result.messageId && (
                      <ShareableLinkSection messageId={result.messageId} />
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-dark-300">{result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/app" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!mediaFile || isSubmitting}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Message"}
          </button>
        </div>
      </form>

      {/* Network check modal */}
      <NetworkCheckModal
        isOpen={showNetworkModal}
        onClose={() => {
          setShowNetworkModal(false);
          setPendingSubmit(false);
        }}
        onNetworkReady={handleNetworkReady}
      />
    </div>
  );
}
