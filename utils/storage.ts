/**
 * Centralized localStorage utility
 *
 * Provides type-safe access to localStorage with:
 * - Centralized key management
 * - Error handling
 * - SSR safety
 * - Type inference
 */

export const STORAGE_KEYS = {
  // Wallet
  WALLET_CONNECTION: "sovseal_wallet_connection",

  // Storage
  STORACHA_AUTH: "sovseal_storacha_auth",

  // UI State
  KEY_BACKUP_DISMISSED: "sovseal_key_backup_dismissed",

  // Messages
  CLAIMED_MESSAGES: "sovseal_claimed_messages",
  MESSAGE_VIEWED_PREFIX: "sovseal_message_viewed_",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Type-safe localStorage wrapper
 */
export const AppStorage = {
  /**
   * Get a value from localStorage
   */
  get<T>(key: StorageKey): T | null {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set a value in localStorage
   * @returns true if successful, false otherwise
   */
  set<T>(key: StorageKey, value: T): boolean {
    if (typeof window === "undefined") return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a value from localStorage
   * @returns true if successful, false otherwise
   */
  remove(key: StorageKey): boolean {
    if (typeof window === "undefined") return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a message has been viewed
   */
  getMessageViewed(messageId: string): boolean {
    if (typeof window === "undefined") return false;

    const key = `${STORAGE_KEYS.MESSAGE_VIEWED_PREFIX}${messageId}`;
    return localStorage.getItem(key) === "true";
  },

  /**
   * Mark a message as viewed
   */
  setMessageViewed(messageId: string): void {
    if (typeof window === "undefined") return;

    const key = `${STORAGE_KEYS.MESSAGE_VIEWED_PREFIX}${messageId}`;
    localStorage.setItem(key, "true");
  },

  /**
   * Get all claimed messages
   */
  getClaimedMessages(): string[] {
    const messages = this.get<string[]>(STORAGE_KEYS.CLAIMED_MESSAGES);
    return messages || [];
  },

  /**
   * Add a claimed message
   */
  addClaimedMessage(messageId: string): void {
    const messages = this.getClaimedMessages();
    if (!messages.includes(messageId)) {
      messages.push(messageId);
      this.set(STORAGE_KEYS.CLAIMED_MESSAGES, messages);
    }
  },
};
