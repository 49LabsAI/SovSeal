"use client";

/**
 * useStoracha Hook
 *
 * React hook for managing Storacha authentication state and operations.
 * Provides easy access to Storacha service throughout the application.
 */

import { useState, useEffect, useCallback } from "react";
import { storachaService } from "@/lib/storage";
import type { AuthState } from "@/lib/storage";

export function useStoracha() {
  const [authState, setAuthState] = useState<AuthState>(
    storachaService.getAuthState()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update auth state
  const refreshAuthState = useCallback(() => {
    setAuthState(storachaService.getAuthState());
  }, []);

  // Check auth state on mount and verify connection
  useEffect(() => {
    const checkAndRefresh = async () => {
      refreshAuthState();
      
      // Verify the connection is actually working
      try {
        const status = await storachaService.checkConnection();
        
        if (status.canRestore) {
          console.log("Storacha: Connection restored successfully");
        } else if (status.needsSpace) {
          console.log("Storacha: Authenticated but needs space creation");
        } else if (status.needsAuth) {
          console.log("Storacha: Needs authentication");
        }
      } catch (error) {
        console.warn("Storacha: Connection check failed:", error);
      }
    };
    
    checkAndRefresh();
  }, [refreshAuthState]);

  // Login with email
  const login = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await storachaService.login(email);
        refreshAuthState();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAuthState]
  );

  // Create space
  const createSpace = useCallback(
    async (name?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const spaceDid = await storachaService.createSpace(name);
        refreshAuthState();
        return spaceDid;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create space";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAuthState]
  );

  // Upload file
  const uploadFile = useCallback(
    async (
      blob: Blob,
      filename?: string,
      onProgress?: (progress: number) => void
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await storachaService.uploadEncryptedBlob(
          blob,
          filename,
          { onProgress }
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Download file
  const downloadFile = useCallback(async (cid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await storachaService.downloadEncryptedBlob(cid);
      return blob;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Download failed";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get gateway URL
  const getGatewayUrl = useCallback((cid: string) => {
    return storachaService.getGatewayUrl(cid);
  }, []);

  // Logout
  const logout = useCallback(() => {
    storachaService.logout();
    refreshAuthState();
  }, [refreshAuthState]);

  // Check if ready to upload
  const isReady = storachaService.isReady();

  return {
    // State
    authState,
    isLoading,
    error,
    isReady,

    // Actions
    login,
    createSpace,
    uploadFile,
    downloadFile,
    getGatewayUrl,
    logout,
    refreshAuthState,
  };
}
