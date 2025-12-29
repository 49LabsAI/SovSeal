/**
 * Storacha Network Storage Service
 *
 * Handles encrypted blob uploads to Storacha Network (formerly Web3.Storage)
 * with progress tracking, CID verification, and improved browser support.
 */

import { create, type Client } from "@storacha/client";
import { withTimeout, TIMEOUTS } from "@/utils/timeout";
import { withRetry } from "@/utils/retry";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { AppStorage, STORAGE_KEYS } from "@/utils/storage";
import { RETRY_CONFIG } from "@/utils/constants";
import {
  type SpaceDID,
  type AccountDID,
  type EmailAddress,
  hasWaitForPaymentPlan,
} from "@/types/storacha";

export interface StorachaUploadResult {
  cid: string;
  size: number;
  provider: "storacha";
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  chunked?: boolean;
  chunkSize?: number;
  /** Skip CID accessibility verification after upload (default: true for performance) */
  skipVerification?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  email?: string;
  spaceDid?: string;
}

const LOG_CONTEXT = "StorachaService";

/**
 * StorachaService provides methods for uploading encrypted blobs to IPFS
 * via Storacha Network with email-based authentication.
 */
export class StorachaService {
  private client: Client | null = null;
  private authState: AuthState = { isAuthenticated: false };

  constructor() {
    // Load auth state from localStorage on initialization
    this.loadAuthState();
  }

  private loadAuthState(): void {
    const stored = AppStorage.get<AuthState>(STORAGE_KEYS.STORACHA_AUTH);
    if (stored) {
      this.authState = stored;
    }
  }

  private saveAuthState(): void {
    const success = AppStorage.set(STORAGE_KEYS.STORACHA_AUTH, this.authState);
    if (!success) {
      ErrorLogger.warn(LOG_CONTEXT, "Failed to save auth state");
    }
  }

  private clearAuthState(): void {
    AppStorage.remove(STORAGE_KEYS.STORACHA_AUTH);
  }

  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await create();

      // If we have a saved space DID, try to restore it as current space
      if (this.authState.spaceDid) {
        try {
          ErrorLogger.debug(LOG_CONTEXT, "Attempting to restore space", {
            spaceDid: this.authState.spaceDid,
          });
          await this.client.setCurrentSpace(
            this.authState.spaceDid as SpaceDID
          );
          ErrorLogger.debug(LOG_CONTEXT, "Space restored successfully");
        } catch (error) {
          ErrorLogger.warn(LOG_CONTEXT, "Failed to restore space from saved state", {
            error: error instanceof Error ? error.message : String(error),
          });
          // Clear the invalid space DID so user knows they need to create a new one
          this.authState.spaceDid = undefined;
          this.saveAuthState();
        }
      }

      return this.client;
    } catch (error) {
      throw new Error(
        `Failed to initialize Storacha client: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async login(email: string): Promise<void> {
    const client = await this.getClient();

    try {
      // Type assertion for email format - Storacha expects email format
      const emailAddress = email as EmailAddress;

      ErrorLogger.info(LOG_CONTEXT, "Sending login email", { email: emailAddress });

      // Save email immediately so we don't lose it
      this.authState = {
        isAuthenticated: false,
        email,
      };
      this.saveAuthState();

      await withTimeout(
        client.login(emailAddress),
        TIMEOUTS.IPFS_UPLOAD_SMALL,
        "Email verification"
      );

      ErrorLogger.info(LOG_CONTEXT, "Login successful");

      // Note: waitForPaymentPlan may not be available in all versions
      // Use type guard to check if method exists
      if (hasWaitForPaymentPlan(client)) {
        ErrorLogger.debug(LOG_CONTEXT, "Waiting for payment plan...");
        await client.waitForPaymentPlan();
      }

      // Update authentication status
      this.authState = {
        isAuthenticated: true,
        email,
      };
      this.saveAuthState();
      ErrorLogger.debug(LOG_CONTEXT, "Authentication state saved");
    } catch (error) {
      ErrorLogger.error(error instanceof Error ? error : new Error(String(error)), LOG_CONTEXT, {
        operation: "login",
        email,
      });

      // Clear partial state on error
      this.authState = { isAuthenticated: false };
      this.saveAuthState();

      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async createSpace(name?: string): Promise<string> {
    const client = await this.getClient();

    if (!this.authState.isAuthenticated) {
      throw new Error("Must be authenticated before creating a space");
    }

    try {
      const spaceName = name || "sovseal-space";
      ErrorLogger.info(LOG_CONTEXT, "Creating space", { spaceName });

      // Get the accounts to use for space creation
      const accounts = client.accounts();
      const accountDIDs = Object.keys(accounts);

      if (accountDIDs.length === 0) {
        throw new Error("No accounts found. Please login first.");
      }

      // Use the first account
      const accountDID = accountDIDs[0] as AccountDID;
      const account = accounts[accountDID];
      ErrorLogger.debug(LOG_CONTEXT, "Using account", { accountDID });

      // Create space with name and account for recovery
      const space = await client.createSpace(spaceName, { account });
      ErrorLogger.info(LOG_CONTEXT, "Space created", { spaceDid: space.did() });

      // Set as current space
      await client.setCurrentSpace(space.did());
      ErrorLogger.debug(LOG_CONTEXT, "Space set as current and ready for uploads");

      this.authState.spaceDid = space.did();
      this.saveAuthState();

      return space.did();
    } catch (error) {
      ErrorLogger.error(error instanceof Error ? error : new Error(String(error)), LOG_CONTEXT, {
        operation: "createSpace",
        name,
      });
      throw new Error(
        `Failed to create space: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Logout and clear authentication state
   */
  logout(): void {
    this.authState = { isAuthenticated: false };
    this.client = null;
    this.clearAuthState();
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isReady(): boolean {
    return this.authState.isAuthenticated && !!this.authState.spaceDid;
  }

  /**
   * Check if client can be restored from saved state
   * Useful for detecting partial authentication states
   */
  async checkConnection(): Promise<{
    canRestore: boolean;
    needsSpace: boolean;
    needsAuth: boolean;
  }> {
    try {
      const client = await this.getClient();

      // Check if we have accounts (authenticated)
      const accounts = client.accounts();
      const hasAccounts = Object.keys(accounts).length > 0;

      // Check if we have a current space
      const currentSpace = client.currentSpace();
      const hasSpace = !!currentSpace;

      return {
        canRestore: hasAccounts && hasSpace,
        needsSpace: hasAccounts && !hasSpace,
        needsAuth: !hasAccounts,
      };
    } catch (error) {
      ErrorLogger.warn(LOG_CONTEXT, "Connection check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        canRestore: false,
        needsSpace: false,
        needsAuth: true,
      };
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network-level errors (always retryable)
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("etimedout") ||
      message.includes("connection") ||
      message.includes("fetch failed")
    ) {
      return true;
    }

    // Retryable HTTP status codes
    if (message.includes("429") || message.includes("rate limit")) {
      return true;
    }
    if (message.includes("503") || message.includes("service unavailable")) {
      return true;
    }
    if (message.includes("504") || message.includes("gateway timeout")) {
      return true;
    }

    // Non-retryable client errors
    if (
      message.includes("401") ||
      message.includes("unauthorized") ||
      message.includes("403") ||
      message.includes("forbidden") ||
      message.includes("400") ||
      message.includes("bad request") ||
      message.includes("404") ||
      message.includes("not found") ||
      message.includes("413") ||
      message.includes("payload too large")
    ) {
      return false;
    }

    // Default: retry unknown errors (conservative approach)
    return true;
  }

  async uploadEncryptedBlob(
    blob: Blob,
    filename: string = "encrypted-media",
    options: UploadOptions = {}
  ): Promise<StorachaUploadResult> {
    // Provide more specific error messages
    if (!this.authState.isAuthenticated) {
      throw new Error(
        "Not authenticated. Please go to Settings and connect with Storacha using your email."
      );
    }

    if (!this.authState.spaceDid) {
      throw new Error(
        "No storage space configured. Please go to Settings and create a Storacha space."
      );
    }

    // Try to ensure space is set before upload
    try {
      const client = await this.getClient();
      const currentSpace = client.currentSpace();

      if (!currentSpace) {
        // Try to restore the space from saved state
        ErrorLogger.debug(LOG_CONTEXT, "No current space, attempting to restore from saved state...");
        await client.setCurrentSpace(this.authState.spaceDid as SpaceDID);
        ErrorLogger.debug(LOG_CONTEXT, "Space restored successfully");
      }
    } catch (error) {
      ErrorLogger.error(error instanceof Error ? error : new Error(String(error)), LOG_CONTEXT, {
        operation: "setSpaceBeforeUpload",
      });
      throw new Error(
        "Failed to set storage space. Please go to Settings and reconnect Storacha."
      );
    }

    // Use withRetry utility for consistent retry behavior
    return withRetry(
      () => this.uploadToStoracha(blob, filename, options),
      {
        maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
        initialDelay: RETRY_CONFIG.INITIAL_DELAY,
        shouldRetry: (error) => this.isRetryableError(error),
        context: "StorachaUpload",
        onRetry: (attempt, error, delay) => {
          ErrorLogger.warn(LOG_CONTEXT, `Upload retry ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS}`, {
            error: error.message,
            nextDelayMs: delay,
            filename,
            blobSize: blob.size,
          });
        },
      }
    );
  }

  private async uploadToStoracha(
    blob: Blob,
    filename: string,
    options: UploadOptions
  ): Promise<StorachaUploadResult> {
    const client = await this.getClient();
    const { onProgress } = options;

    // Verify we have a current space set
    const currentSpace = client.currentSpace();
    ErrorLogger.debug(LOG_CONTEXT, "Current space", { spaceDid: currentSpace?.did() });

    if (!currentSpace) {
      throw new Error(
        "No space is currently set. Please create and set a space first."
      );
    }

    const file = new File([blob], filename, { type: blob.type });
    const totalBytes = blob.size;
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);

    ErrorLogger.info(LOG_CONTEXT, `Starting upload`, { filename, sizeMB: `${sizeMB} MB` });

    const timeout =
      blob.size > 10_000_000
        ? TIMEOUTS.IPFS_UPLOAD_LARGE
        : TIMEOUTS.IPFS_UPLOAD_SMALL;

    const onStoredChunk = onProgress
      ? (meta: { size: number }) => {
        const progress = Math.round((meta.size / totalBytes) * 100);
        onProgress(Math.min(progress, 99));
      }
      : undefined;

    const cid = await withTimeout(
      client.uploadFile(file, {
        onShardStored: onStoredChunk,
      }),
      timeout,
      `Storacha upload (${sizeMB} MB)`
    );

    ErrorLogger.info(LOG_CONTEXT, "Upload complete", { cid: cid.toString() });

    if (onProgress) {
      onProgress(100);
    }

    // Skip verification by default for performance (saves 6-20 seconds)
    // Set skipVerification: false if you need to verify CID accessibility
    if (!options.skipVerification && options.skipVerification !== undefined) {
      await this.verifyCIDAccessibility(cid.toString());
    }

    return {
      cid: cid.toString(),
      size: blob.size,
      provider: "storacha",
    };
  }

  private isValidCID(cid: string): boolean {
    return (
      /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) ||
      /^b[a-z2-7]{58,}/.test(cid) ||
      /^bafy[a-z2-7]{55,}/.test(cid)
    );
  }

  private async verifyCIDAccessibility(cid: string): Promise<void> {
    if (!this.isValidCID(cid)) {
      throw new Error(`Invalid CID format: ${cid}`);
    }

    const gatewayUrl = this.getGatewayUrl(cid);

    await withRetry(
      async () => {
        const res = await withTimeout(
          fetch(gatewayUrl, { method: "HEAD" }),
          TIMEOUTS.IPFS_VERIFICATION,
          "IPFS CID verification"
        );

        if (!res.ok) {
          throw new Error(
            `CID ${cid} is not accessible (status: ${res.status})`
          );
        }
      },
      {
        maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
        initialDelay: RETRY_CONFIG.INITIAL_DELAY,
        shouldRetry: (error) => this.isRetryableError(error),
        context: "CIDVerification",
        onRetry: (attempt, error, delay) => {
          ErrorLogger.warn(LOG_CONTEXT, `CID verification retry ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS}`, {
            cid,
            error: error.message,
            nextDelayMs: delay,
          });
        },
      }
    );
  }

  async downloadEncryptedBlob(cid: string): Promise<Blob> {
    if (!this.isValidCID(cid)) {
      throw new Error(`Invalid CID format: ${cid}`);
    }

    const gatewayUrl = this.getGatewayUrl(cid);

    return withRetry(
      async () => {
        const res = await withTimeout(
          fetch(gatewayUrl),
          TIMEOUTS.IPFS_DOWNLOAD,
          `IPFS download ${cid}`
        );

        if (!res.ok) {
          throw new Error(
            `Failed to retrieve CID ${cid} (status: ${res.status})`
          );
        }

        return res.blob();
      },
      {
        maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
        initialDelay: RETRY_CONFIG.INITIAL_DELAY,
        shouldRetry: (error) => this.isRetryableError(error),
        context: "IPFSDownload",
        onRetry: (attempt, error, delay) => {
          ErrorLogger.warn(LOG_CONTEXT, `Download retry ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS}`, {
            cid,
            error: error.message,
            nextDelayMs: delay,
          });
        },
      }
    );
  }

  getGatewayUrl(cid: string): string {
    const gateway = process.env.NEXT_PUBLIC_STORACHA_GATEWAY || "storacha.link";
    return `https://${cid}.ipfs.${gateway}`;
  }
}

export const storachaService = new StorachaService();
