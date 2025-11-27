/**
 * Storacha Network Storage Service
 *
 * Handles encrypted blob uploads to Storacha Network (formerly Web3.Storage)
 * with progress tracking, CID verification, and improved browser support.
 *
 * Requirements: 3.6, 5.1, 5.2, 5.3, 5.4, 5.6
 */

import { create, type Client } from "@storacha/client";
import { withTimeout, TIMEOUTS } from "@/utils/timeout";

export interface StorachaUploadResult {
  cid: string;
  size: number;
  provider: "storacha";
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  chunked?: boolean;
  chunkSize?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  email?: string;
  spaceDid?: string;
}

const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;
const STORAGE_KEY = "lockdrop_storacha_auth";

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
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.authState = parsed;
      }
    } catch (error) {
      console.warn("Failed to load Storacha auth state:", error);
    }
  }

  private saveAuthState(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.authState));
    } catch (error) {
      console.warn("Failed to save Storacha auth state:", error);
    }
  }

  private clearAuthState(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear Storacha auth state:", error);
    }
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
          console.log("Storacha: Attempting to restore space:", this.authState.spaceDid);
          await this.client.setCurrentSpace(
            this.authState.spaceDid as `did:${string}:${string}`
          );
          console.log("Storacha: Space restored successfully");
        } catch (error) {
          console.warn("Failed to restore space from saved state:", error);
          // Don't clear the space DID immediately - user might need to re-authenticate
          console.log("Storacha: Space restoration failed, may need re-authentication");
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
      const emailAddress = email as `${string}@${string}`;

      console.log("Storacha: Sending login email to", emailAddress);
      
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

      console.log("Storacha: Login successful");

      // Note: waitForPaymentPlan may not be available in all versions
      // Check if method exists before calling
      if (
        "waitForPaymentPlan" in client &&
        typeof client.waitForPaymentPlan === "function"
      ) {
        console.log("Storacha: Waiting for payment plan...");
        await (client as any).waitForPaymentPlan();
      }

      // Update authentication status
      this.authState = {
        isAuthenticated: true,
        email,
      };
      this.saveAuthState();
      console.log("Storacha: Authentication state saved");
    } catch (error) {
      console.error("Storacha login error:", error);
      
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
      const spaceName = name || "lockdrop-space";
      console.log("Storacha: Creating space:", spaceName);

      // Get the accounts to use for space creation
      const accounts = client.accounts();
      const accountDIDs = Object.keys(accounts);

      if (accountDIDs.length === 0) {
        throw new Error("No accounts found. Please login first.");
      }

      // Use the first account
      const accountDID = accountDIDs[0] as `did:mailto:${string}:${string}`;
      const account = accounts[accountDID];
      console.log("Storacha: Using account:", accountDID);

      // Create space with name and account for recovery
      const space = await client.createSpace(spaceName, { account });
      console.log("Storacha: Space created with DID:", space.did());

      // Set as current space
      await client.setCurrentSpace(space.did());
      console.log("Storacha: Space set as current and ready for uploads");

      this.authState.spaceDid = space.did();
      this.saveAuthState();

      return space.did();
    } catch (error) {
      console.error("Storacha createSpace error:", error);
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
      console.error("Storacha: Connection check failed:", error);
      return {
        canRestore: false,
        needsSpace: false,
        needsAuth: true,
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

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

    if (message.includes("429") || message.includes("rate limit")) {
      return true;
    }

    if (message.includes("503") || message.includes("service unavailable")) {
      return true;
    }

    if (message.includes("504") || message.includes("gateway timeout")) {
      return true;
    }

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

    return true;
  }

  async uploadEncryptedBlob(
    blob: Blob,
    filename: string = "encrypted-media",
    options: UploadOptions = {}
  ): Promise<StorachaUploadResult> {
    if (!this.isReady()) {
      throw new Error(
        "Client not ready. Please authenticate and create a space first."
      );
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.3 * baseDelay;
          const delay = baseDelay + jitter;
          await this.sleep(delay);
        }

        const result = await this.uploadToStoracha(blob, filename, options);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (!this.isRetryableError(lastError)) {
          console.error(
            "Non-retryable error, failing fast:",
            lastError.message
          );
          throw lastError;
        }

        console.warn(
          `Storacha upload attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} failed:`,
          lastError.message
        );
      }
    }

    throw new Error(
      `Upload failed after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`
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
    console.log("Storacha: Current space:", currentSpace?.did());

    if (!currentSpace) {
      throw new Error(
        "No space is currently set. Please create and set a space first."
      );
    }

    const file = new File([blob], filename, { type: blob.type });
    const totalBytes = blob.size;

    console.log(
      `Storacha: Starting upload of ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`
    );

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
      `Storacha upload (${(blob.size / 1024 / 1024).toFixed(2)} MB)`
    );

    console.log("Storacha: Upload complete, CID:", cid.toString());

    if (onProgress) {
      onProgress(100);
    }

    await this.verifyCIDAccessibility(cid.toString());

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

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.3 * baseDelay;
          const delay = baseDelay + jitter;
          await this.sleep(delay);
        }

        const gatewayUrl = this.getGatewayUrl(cid);

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

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (!this.isRetryableError(lastError)) {
          console.error(
            "Non-retryable verification error, failing fast:",
            lastError.message
          );
          throw new Error(`CID verification failed: ${lastError.message}`);
        }

        console.warn(
          `CID verification attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} failed:`,
          lastError.message
        );
      }
    }

    throw new Error(
      `CID verification failed after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`
    );
  }

  async downloadEncryptedBlob(cid: string): Promise<Blob> {
    if (!this.isValidCID(cid)) {
      throw new Error(`Invalid CID format: ${cid}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.3 * baseDelay;
          const delay = baseDelay + jitter;
          await this.sleep(delay);
        }

        const gatewayUrl = this.getGatewayUrl(cid);

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

        const blob = await res.blob();
        return blob;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (!this.isRetryableError(lastError)) {
          console.error(
            "Non-retryable download error, failing fast:",
            lastError.message
          );
          throw lastError;
        }

        console.warn(
          `IPFS download attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} failed:`,
          lastError.message
        );
      }
    }

    throw new Error(
      `IPFS download failed after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`
    );
  }

  getGatewayUrl(cid: string): string {
    const gateway = process.env.NEXT_PUBLIC_STORACHA_GATEWAY || "storacha.link";
    return `https://${cid}.ipfs.${gateway}`;
  }
}

export const storachaService = new StorachaService();
