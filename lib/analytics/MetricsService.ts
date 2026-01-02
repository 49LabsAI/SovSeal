/**
 * MetricsService - Privacy-preserving analytics for SovSeal
 *
 * Tracks key metrics for YC pitch without compromising user privacy.
 * No content is ever logged - only metadata and aggregate counts.
 *
 * Key Metrics:
 * - Messages created/unlocked
 * - User retention (D1, D7, D30)
 * - Revenue events
 * - Feature usage
 */

"use client";

import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";

const LOG_CONTEXT = "MetricsService";

/**
 * Event types for analytics
 */
export type MetricEvent =
  | "message_created"
  | "message_unlocked"
  | "redeem_package_created"
  | "redeem_package_claimed"
  | "wallet_connected"
  | "wallet_disconnected"
  | "storage_authenticated"
  | "page_view"
  | "feature_used"
  | "error_occurred";

/**
 * Metadata for message events (privacy-safe)
 */
export interface MessageMetadata {
  hasMedia: boolean;
  mediaType?: "audio" | "video" | "image" | "document";
  unlockDelayDays: number;
  isRedeemPackage: boolean;
}

/**
 * Metadata for feature usage
 */
export interface FeatureMetadata {
  feature: string;
  variant?: string;
}

/**
 * Stored metrics for local aggregation
 */
interface StoredMetrics {
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  events: Array<{
    type: MetricEvent;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Privacy-preserving metrics service
 *
 * All data is stored locally and only aggregate metrics are ever sent
 * to any analytics backend (when implemented).
 */
export class MetricsService {
  private static readonly STORAGE_KEY = "sovseal_metrics";
  private static readonly MAX_EVENTS = 1000; // Limit stored events
  private static sessionId: string | null = null;

  /**
   * Generate a random session ID (not tied to user identity)
   */
  private static getSessionId(): string {
    if (this.sessionId) return this.sessionId;

    // Generate new session ID for this browser session
    this.sessionId = crypto.randomUUID();
    return this.sessionId;
  }

  /**
   * Get stored metrics from localStorage
   */
  private static getStoredMetrics(): StoredMetrics | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as StoredMetrics;
    } catch {
      return null;
    }
  }

  /**
   * Save metrics to localStorage
   */
  private static saveMetrics(metrics: StoredMetrics): void {
    if (typeof window === "undefined") return;

    try {
      // Trim events if exceeding max
      if (metrics.events.length > this.MAX_EVENTS) {
        metrics.events = metrics.events.slice(-this.MAX_EVENTS);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metrics));
    } catch (error) {
      ErrorLogger.warn(LOG_CONTEXT, "Failed to save metrics", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Initialize or get existing metrics store
   */
  private static initMetrics(): StoredMetrics {
    const existing = this.getStoredMetrics();
    const now = Date.now();

    if (existing) {
      existing.lastSeen = now;
      existing.sessionId = this.getSessionId();
      return existing;
    }

    return {
      sessionId: this.getSessionId(),
      firstSeen: now,
      lastSeen: now,
      events: [],
    };
  }

  /**
   * Track a metric event
   */
  static track(
    event: MetricEvent,
    metadata?: Record<string, unknown>
  ): void {
    try {
      const metrics = this.initMetrics();

      metrics.events.push({
        type: event,
        timestamp: Date.now(),
        metadata,
      });

      this.saveMetrics(metrics);

      // Log for debugging (will be replaced with actual analytics)
      ErrorLogger.debug(LOG_CONTEXT, `Event tracked: ${event}`, metadata);
    } catch (error) {
      // Silently fail - analytics should never break the app
      ErrorLogger.debug(LOG_CONTEXT, "Failed to track event", {
        event,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Track message creation
   */
  static trackMessageCreated(metadata: MessageMetadata): void {
    this.track("message_created", {
      hasMedia: metadata.hasMedia,
      mediaType: metadata.mediaType,
      unlockDelayDays: metadata.unlockDelayDays,
      isRedeemPackage: metadata.isRedeemPackage,
    });
  }

  /**
   * Track message unlock
   */
  static trackMessageUnlocked(messageId: string): void {
    // Only track that an unlock happened, not the message ID
    this.track("message_unlocked", {
      // Hash the message ID for privacy
      messageIdHash: this.hashString(messageId).slice(0, 8),
    });
  }

  /**
   * Track redeem package creation
   */
  static trackRedeemPackageCreated(): void {
    this.track("redeem_package_created");
  }

  /**
   * Track redeem package claim
   */
  static trackRedeemPackageClaimed(): void {
    this.track("redeem_package_claimed");
  }

  /**
   * Track wallet connection
   */
  static trackWalletConnected(walletType: string): void {
    this.track("wallet_connected", { walletType });
  }

  /**
   * Track wallet disconnection
   */
  static trackWalletDisconnected(): void {
    this.track("wallet_disconnected");
  }

  /**
   * Track storage authentication
   */
  static trackStorageAuthenticated(): void {
    this.track("storage_authenticated");
  }

  /**
   * Track page view
   */
  static trackPageView(page: string): void {
    this.track("page_view", { page });
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsed(metadata: FeatureMetadata): void {
    this.track("feature_used", { ...metadata });
  }

  /**
   * Track error occurrence (without sensitive details)
   */
  static trackError(errorType: string, context: string): void {
    this.track("error_occurred", { errorType, context });
  }

  /**
   * Get aggregate metrics for display/export
   */
  static getAggregateMetrics(): {
    totalMessages: number;
    totalUnlocks: number;
    totalRedeemPackages: number;
    daysSinceFirstUse: number;
    eventsByType: Record<string, number>;
  } {
    const metrics = this.getStoredMetrics();
    if (!metrics) {
      return {
        totalMessages: 0,
        totalUnlocks: 0,
        totalRedeemPackages: 0,
        daysSinceFirstUse: 0,
        eventsByType: {},
      };
    }

    const eventsByType: Record<string, number> = {};
    metrics.events.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      totalMessages: eventsByType["message_created"] || 0,
      totalUnlocks: eventsByType["message_unlocked"] || 0,
      totalRedeemPackages: eventsByType["redeem_package_created"] || 0,
      daysSinceFirstUse: Math.floor(
        (Date.now() - metrics.firstSeen) / (1000 * 60 * 60 * 24)
      ),
      eventsByType,
    };
  }

  /**
   * Clear all stored metrics (for privacy/GDPR)
   */
  static clearMetrics(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
    this.sessionId = null;
    ErrorLogger.info(LOG_CONTEXT, "Metrics cleared");
  }

  /**
   * Simple hash function for privacy (not cryptographic)
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
