"use client";

/**
 * useCompression Hook
 *
 * React hook for in-browser media compression using ffmpeg.wasm.
 * Provides compression state management and progress tracking.
 */

import { useState, useCallback, useRef } from "react";
import {
    compressionService,
    type CompressionOptions,
    type CompressionResult,
    type CompressionState,
} from "@/lib/compression";

interface UseCompressionOptions {
    /** Auto-load ffmpeg on mount */
    preload?: boolean;
}

interface UseCompressionReturn extends CompressionState {
    /** Compress a file */
    compress: (file: File, options?: CompressionOptions) => Promise<CompressionResult>;
    /** Cancel current compression (if possible) */
    cancel: () => void;
    /** Reset state */
    reset: () => void;
    /** Check if file is compressible */
    checkEligibility: typeof compressionService.checkEligibility;
    /** Whether ffmpeg is loaded */
    isLoaded: boolean;
    /** Pre-load ffmpeg */
    preload: () => Promise<void>;
}

const initialState: CompressionState = {
    isCompressing: false,
    progress: 0,
    stage: "",
    error: null,
    result: null,
};

/**
 * Hook for media compression with state management
 */
export function useCompression(
    options: UseCompressionOptions = {}
): UseCompressionReturn {
    const [state, setState] = useState<CompressionState>(initialState);
    const [isLoaded, setIsLoaded] = useState(false);
    const abortRef = useRef(false);

    /**
     * Pre-load ffmpeg.wasm
     */
    const preloadFfmpeg = useCallback(async () => {
        if (isLoaded) return;

        try {
            setState((prev) => ({ ...prev, stage: "Loading compression library..." }));
            await compressionService.load();
            setIsLoaded(true);
        } catch (error) {
            console.error("Failed to preload ffmpeg:", error);
        }
    }, [isLoaded]);

    /**
     * Compress a file with progress tracking
     */
    const compress = useCallback(
        async (
            file: File,
            compressOptions: CompressionOptions = {}
        ): Promise<CompressionResult> => {
            abortRef.current = false;

            setState({
                isCompressing: true,
                progress: 0,
                stage: "Preparing compression...",
                error: null,
                result: null,
            });

            try {
                // Load ffmpeg if needed
                if (!compressionService.isReady()) {
                    setState((prev) => ({ ...prev, stage: "Loading compression library..." }));
                    await compressionService.load();
                    setIsLoaded(true);
                }

                if (abortRef.current) {
                    throw new Error("Compression cancelled");
                }

                setState((prev) => ({ ...prev, stage: "Compressing..." }));

                const result = await compressionService.compress(file, {
                    ...compressOptions,
                    onProgress: (progress) => {
                        if (abortRef.current) return;
                        setState((prev) => ({
                            ...prev,
                            progress,
                            stage: progress < 100 ? "Compressing..." : "Finalizing...",
                        }));
                        compressOptions.onProgress?.(progress);
                    },
                });

                if (abortRef.current) {
                    throw new Error("Compression cancelled");
                }

                setState({
                    isCompressing: false,
                    progress: 100,
                    stage: "Complete",
                    error: null,
                    result,
                });

                return result;
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Compression failed");
                setState({
                    isCompressing: false,
                    progress: 0,
                    stage: "",
                    error: err,
                    result: null,
                });
                throw err;
            }
        },
        []
    );

    /**
     * Cancel current compression
     */
    const cancel = useCallback(() => {
        abortRef.current = true;
        setState((prev) => ({
            ...prev,
            isCompressing: false,
            stage: "Cancelled",
        }));
    }, []);

    /**
     * Reset compression state
     */
    const reset = useCallback(() => {
        abortRef.current = false;
        setState(initialState);
    }, []);

    return {
        ...state,
        compress,
        cancel,
        reset,
        checkEligibility: compressionService.checkEligibility.bind(compressionService),
        isLoaded,
        preload: preloadFfmpeg,
    };
}
