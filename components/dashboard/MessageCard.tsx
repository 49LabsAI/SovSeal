/**
 * MessageCard - Display individual message with status badge
 *
 * Requirements: 7.2, 8.2, 11.4
 */

"use client";

import { Message, MessageStatus } from "@/types/contract";
import { formatDistanceToNow } from "@/utils/dateUtils";

interface MessageCardProps {
  message: Message;
  type: "sent" | "received";
  onUnlock?: (message: Message) => void;
}

export function MessageCard({ message, type, onUnlock }: MessageCardProps) {
  const isUnlockable = message.status === "Unlockable";
  const isLocked = message.status === "Locked";

  const getStatusColor = (status: MessageStatus): string => {
    switch (status) {
      case "Locked":
        return "bg-gray-700 text-gray-200";
      case "Unlockable":
        return "bg-green-900 text-green-200";
      case "Unlocked":
        return "bg-blue-900 text-blue-200";
    }
  };

  const formatAddress = (address: string): string => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeUntilUnlock = (timestamp: number): string => {
    const now = Date.now();
    if (timestamp <= now) {
      return "Unlockable now";
    }
    return `Unlocks ${formatDistanceToNow(timestamp)}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-400">
              {type === "sent" ? "To:" : "From:"}
            </span>
            <span className="font-mono text-sm text-gray-200">
              {formatAddress(
                type === "sent" ? message.recipient : message.sender
              )}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Created: {formatTimestamp(message.createdAt)}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            message.status
          )}`}
        >
          {message.status}
        </span>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="text-sm text-gray-300 mb-3">
          {isLocked && (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400"
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
              <span>{getTimeUntilUnlock(message.unlockTimestamp)}</span>
            </div>
          )}
          {isUnlockable && type === "received" && (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              <span className="text-green-600 font-medium">
                Ready to unlock
              </span>
            </div>
          )}
          {message.status === "Unlocked" && (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-blue-600">Viewed</span>
            </div>
          )}
        </div>

        {message.metadata && (
          <div className="text-xs text-gray-400 mb-3">
            <div>Type: {message.metadata.mimeType}</div>
            {message.metadata.fileSize && (
              <div>
                Size: {(message.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            {message.metadata.duration && (
              <div>Duration: {Math.round(message.metadata.duration)}s</div>
            )}
          </div>
        )}

        {isUnlockable && type === "received" && onUnlock && (
          <button
            onClick={() => onUnlock(message)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Unlock Message
          </button>
        )}

        {isLocked && type === "received" && (
          <div className="text-center text-sm text-gray-400 py-2">
            Message will be unlockable on{" "}
            {formatTimestamp(message.unlockTimestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
