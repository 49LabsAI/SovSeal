/**
 * MessageList - Display a grid of message cards
 *
 * Requirements: 7.2, 8.2, 11.4
 */

"use client";

import { Message } from "@/types/contract";
import { MessageCard } from "./MessageCard";

interface MessageListProps {
  messages: Message[];
  type: "sent" | "received";
  onUnlock?: (message: Message) => void;
}

export function MessageList({ messages, type, onUnlock }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-100">
          No messages yet
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          {type === "sent"
            ? "Messages you send will appear here"
            : "Messages sent to you will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          type={type}
          onUnlock={onUnlock}
        />
      ))}
    </div>
  );
}
