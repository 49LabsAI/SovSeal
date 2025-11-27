"use client";

import { useState } from "react";
import { MediaRecorder } from "@/components/media/MediaRecorder";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaPreview } from "@/components/media/MediaPreview";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { MessageCreationService } from "@/lib/message";
import { useStoracha } from "@/hooks/useStoracha";
import { StorachaAuth } from "@/components/storage/StorachaAuth";
import type { MediaFile } from "@/types/media";
import type { MessageCreationProgress } from "@/lib/message";

type MediaSource = "record" | "upload" | null;

/**
 * CreateMessage Page Component
 *
 * Provides UI for composing time-locked messages with:
 * - Recipient address input with validation
 * - Unlock timestamp picker (date/time)
 * - Media recording/upload integration
 * - Message preview section
 *
 * Requirements: 2.1, 3.1, 6.2
 */
export default function CreateMessagePage() {
  const { address, isConnected, selectedAccount } = useWallet();
  const { isReady: isStorachaReady } = useStoracha();

  // Form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [unlockTime, setUnlockTime] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [timestampError, setTimestampError] = useState("");

  // Media state
  const [mediaSource, setMediaSource] = useState<MediaSource>(null);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<MessageCreationProgress | null>(
    null
  );
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    error?: string;
  } | null>(null);

  /**
   * Validates Ethereum address format
   * Checks for valid Ethereum address (0x... format)
   */
  const validateRecipientAddress = (addr: string): boolean => {
    if (!addr || addr.trim().length === 0) {
      setRecipientError("Recipient address is required");
      return false;
    }

    // Ethereum address validation (0x followed by 40 hex characters)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!ethereumAddressRegex.test(addr.trim())) {
      setRecipientError("Invalid Ethereum address format. Must start with 0x followed by 40 hex characters");
      return false;
    }

    if (addr.trim().toLowerCase() === address?.toLowerCase()) {
      setRecipientError("Cannot send message to yourself");
      return false;
    }

    setRecipientError("");
    return true;
  };

  /**
   * Validates unlock timestamp is in the future
   */
  const validateUnlockTimestamp = (): boolean => {
    if (!unlockDate || !unlockTime) {
      setTimestampError("Please select both date and time");
      return false;
    }

    const unlockTimestamp = new Date(`${unlockDate}T${unlockTime}`).getTime();
    const now = Date.now();

    if (unlockTimestamp <= now) {
      setTimestampError("Unlock time must be in the future");
      return false;
    }

    setTimestampError("");
    return true;
  };

  /**
   * Handles media recording completion
   */
  const handleRecordingComplete = (blob: Blob, type: "audio" | "video") => {
    const mediaFile: MediaFile = {
      blob,
      type,
      size: blob.size,
      mimeType: blob.type,
      name: `recorded-${type}-${Date.now()}`,
    };
    setMediaFile(mediaFile);
  };

  /**
   * Handles file upload
   */
  const handleFileUpload = (file: MediaFile) => {
    setMediaFile(file);
  };

  /**
   * Clears current media selection
   */
  const handleClearMedia = () => {
    setMediaFile(null);
    setMediaSource(null);
  };

  /**
   * Validates form and proceeds to encryption/upload
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isRecipientValid = validateRecipientAddress(recipientAddress);
    const isTimestampValid = validateUnlockTimestamp();

    if (!isRecipientValid || !isTimestampValid) {
      return;
    }

    if (!mediaFile) {
      alert("Please record or upload a message");
      return;
    }

    if (!selectedAccount) {
      alert("Please connect your wallet");
      return;
    }

    // Clear previous result
    setResult(null);
    setIsSubmitting(true);

    try {
      // Convert date and time to Unix timestamp
      const unlockTimestamp = new Date(`${unlockDate}T${unlockTime}`).getTime();

      // Create the message using MessageCreationService
      const creationResult = await MessageCreationService.createMessage(
        {
          mediaFile,
          recipientAddress: recipientAddress.trim(),
          unlockTimestamp,
          senderAccount: selectedAccount,
        },
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setResult(creationResult);

      // If successful, clear the form after a delay
      if (creationResult.success) {
        setTimeout(() => {
          // Reset form
          setRecipientAddress("");
          setUnlockDate("");
          setUnlockTime("");
          setMediaFile(null);
          setMediaSource(null);
          setProgress(null);
        }, 3000);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Require wallet connection
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Wallet Connection Required
          </h2>
          <p className="mb-6 text-gray-600">
            Please connect your wallet (Talisman recommended, MetaMask supported) with an Ethereum account to create time-locked messages.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Require Storacha authentication
  if (!isStorachaReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Storage Setup Required
            </h1>
            <p className="text-gray-600">
              Before creating messages, you need to connect to Storacha Network for decentralized storage.
            </p>
          </div>

          <StorachaAuth 
            onAuthComplete={() => {
              // Force re-render by updating state
              window.location.reload();
            }}
          />

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Why Storacha?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="mt-0.5 h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span><strong>Decentralized:</strong> Lockdrop stores your encrypted messages on IPFS, not centralized servers</span>
              </li>
              <li className="flex items-start">
                <svg className="mt-0.5 h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span><strong>Secure:</strong> All encryption happens in your browser before upload</span>
              </li>
              <li className="flex items-start">
                <svg className="mt-0.5 h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span><strong>Reliable:</strong> 99.9% availability with Filecoin backup storage</span>
              </li>
              <li className="flex items-start">
                <svg className="mt-0.5 h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span><strong>No API Keys:</strong> Simple email-based authentication</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-100">
            Create Time-Locked Message
          </h1>
          <p className="text-gray-400">
            Record or upload a message that will be unlocked at a specific time
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Address */}
          <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
            <label
              htmlFor="recipient"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Recipient Address *
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
              placeholder="Enter Ethereum address (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2)"
              className={`w-full rounded-lg border px-4 py-2 bg-gray-900 text-gray-100 focus:border-transparent focus:ring-2 focus:ring-purple-500 ${
                recipientError ? "border-red-500" : "border-gray-600"
              }`}
            />
            {recipientError && (
              <p className="mt-2 text-sm text-red-400">{recipientError}</p>
            )}
            <p className="mt-2 text-sm text-gray-400">
              The Ethereum address (0x...) of the person who will receive this message
            </p>
          </div>

          {/* Unlock Timestamp */}
          <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Unlock Date & Time *
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="unlock-date"
                  className="mb-1 block text-xs text-gray-400"
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
                  className={`w-full rounded-lg border px-4 py-2 bg-gray-900 text-gray-100 focus:border-transparent focus:ring-2 focus:ring-purple-500 ${
                    timestampError ? "border-red-500" : "border-gray-600"
                  }`}
                />
              </div>
              <div>
                <label
                  htmlFor="unlock-time"
                  className="mb-1 block text-xs text-gray-400"
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
                  className={`w-full rounded-lg border px-4 py-2 bg-gray-900 text-gray-100 focus:border-transparent focus:ring-2 focus:ring-purple-500 ${
                    timestampError ? "border-red-500" : "border-gray-600"
                  }`}
                />
              </div>
            </div>
            {timestampError && (
              <p className="mt-2 text-sm text-red-400">{timestampError}</p>
            )}
            <p className="mt-2 text-sm text-gray-400">
              The message will be unlockable after this date and time
            </p>
          </div>

          {/* Media Selection */}
          <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
            {!mediaSource && !mediaFile && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMediaSource("record")}
                  className="rounded-lg border-2 border-dashed border-gray-600 p-6 transition-colors hover:border-purple-500 hover:bg-gray-700"
                >
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-100">
                      Record Message
                    </p>
                    <p className="mt-1 text-xs text-gray-400">Audio or video</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaSource("upload")}
                  className="rounded-lg border-2 border-dashed border-gray-600 p-6 transition-colors hover:border-purple-500 hover:bg-gray-700"
                >
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-100">
                      Upload File
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      MP3, WAV, MP4, etc.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {mediaSource === "record" && !mediaFile && (
              <div>
                <MediaRecorder onRecordingComplete={handleRecordingComplete} />
                <button
                  type="button"
                  onClick={() => setMediaSource(null)}
                  className="mt-4 text-sm text-gray-600 hover:text-gray-900"
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
                  className="mt-4 text-sm text-gray-400 hover:text-gray-200"
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

          {/* Progress Display */}
          {isSubmitting && progress && (
            <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-100">
                Creating Message...
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{progress.message}</span>
                  <span className="font-medium text-purple-400">
                    {Math.round(progress.progress)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                  <span>Please wait and do not close this page...</span>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div
              className={`rounded-lg p-6 shadow-md ${
                result.success
                  ? "border border-green-200 bg-green-50"
                  : "border border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h3
                    className={`text-lg font-semibold ${
                      result.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {result.success
                      ? "Message Created Successfully!"
                      : "Message Creation Failed"}
                  </h3>
                  {result.success ? (
                    <div className="mt-2 text-sm text-green-800">
                      <p>
                        Your time-locked message has been created and stored on
                        the blockchain.
                      </p>
                      {result.messageId && (
                        <p className="mt-2 break-all font-mono text-xs">
                          Message ID: {result.messageId}
                        </p>
                      )}
                      <p className="mt-3">
                        The recipient will be able to unlock and view the
                        message after the specified time.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-red-800">
                      <p className="font-medium">Error:</p>
                      <p className="mt-1 whitespace-pre-wrap">{result.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <a
              href="/"
              className="rounded-lg border border-gray-600 px-6 py-3 text-gray-300 transition-colors hover:bg-gray-700"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={!mediaFile || isSubmitting}
              className="rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {isSubmitting ? "Creating..." : "Create Time-Locked Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
