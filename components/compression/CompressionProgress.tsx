"use client";

/**
 * CompressionProgress Component
 *
 * Displays compression progress with animated UI.
 * Shows current stage, progress bar, and size estimates.
 */

import { useEffect, useState } from "react";

interface CompressionProgressProps {
    /** Current progress (0-100) */
    progress: number;
    /** Current stage description */
    stage: string;
    /** Original file size in bytes */
    originalSize: number;
    /** Estimated compressed size (optional) */
    estimatedSize?: number;
    /** Callback for cancel action */
    onCancel?: () => void;
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CompressionProgress({
    progress,
    stage,
    originalSize,
    estimatedSize,
    onCancel,
}: CompressionProgressProps) {
    const [displayProgress, setDisplayProgress] = useState(0);

    // Smooth progress animation
    useEffect(() => {
        if (progress > displayProgress) {
            const timer = setTimeout(() => {
                setDisplayProgress(Math.min(displayProgress + 1, progress));
            }, 20);
            return () => clearTimeout(timer);
        } else {
            setDisplayProgress(progress);
        }
    }, [progress, displayProgress]);

    const estimatedSavings = estimatedSize
        ? Math.round((1 - estimatedSize / originalSize) * 100)
        : null;

    return (
        <div className="rounded-lg border border-purple-700/50 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-5">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Animated compression icon */}
                    <div className="relative">
                        <svg
                            className="h-6 w-6 animate-pulse text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="font-medium text-white">Compressing Media</p>
                        <p className="text-sm text-purple-300">{stage}</p>
                    </div>
                </div>

                <span className="text-2xl font-bold text-purple-300">
                    {displayProgress}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${displayProgress}%` }}
                >
                    {/* Animated shimmer effect */}
                    <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
            </div>

            {/* Size Information */}
            <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                    <span>Original: </span>
                    <span className="font-medium text-gray-300">
                        {formatSize(originalSize)}
                    </span>
                </div>

                {estimatedSize && (
                    <div className="flex items-center gap-2">
                        <svg
                            className="h-4 w-4 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                        </svg>
                        <span className="text-green-400">
                            ~{estimatedSavings}% smaller
                        </span>
                    </div>
                )}
            </div>

            {/* Cancel Button */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="mt-4 w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
                >
                    Cancel Compression
                </button>
            )}
        </div>
    );
}
