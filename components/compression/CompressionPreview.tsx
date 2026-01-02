"use client";

/**
 * CompressionPreview Component
 *
 * Shows before/after comparison of compressed media.
 * Displays savings and allows user to accept or skip compression.
 */

import { type CompressionResult } from "@/types/compression";

interface CompressionPreviewProps {
    /** Original file */
    originalFile: File;
    /** Compression result */
    result: CompressionResult;
    /** Callback when user accepts compressed version */
    onAccept: (compressedBlob: Blob) => void;
    /** Callback when user wants to use original */
    onSkip: () => void;
    /** Callback to re-compress with different settings */
    onRecompress?: () => void;
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CompressionPreview({
    originalFile,
    result,
    onAccept,
    onSkip,
    onRecompress,
}: CompressionPreviewProps) {
    const isSignificantSavings = result.savingsPercent >= 20;

    return (
        <div className="rounded-lg border border-green-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-5">
            {/* Header with savings badge */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <svg
                        className="h-5 w-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Compression Complete
                </h3>

                <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-bold text-green-400">
                    {result.savingsPercent}% saved
                </span>
            </div>

            {/* Before/After Comparison */}
            <div className="mb-4 grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="rounded-lg bg-gray-800/50 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Original
                    </p>
                    <p className="text-xl font-bold text-gray-300">
                        {formatSize(result.originalSize)}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-500">
                        {originalFile.name}
                    </p>
                </div>

                {/* Compressed */}
                <div className="rounded-lg bg-green-900/30 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-green-500">
                        Compressed
                    </p>
                    <p className="text-xl font-bold text-green-400">
                        {formatSize(result.compressedSize)}
                    </p>
                    <p className="mt-1 text-sm text-green-500/70">
                        Processed in {(result.durationMs / 1000).toFixed(1)}s
                    </p>
                </div>
            </div>

            {/* Savings visualization */}
            <div className="mb-4 overflow-hidden rounded-lg bg-gray-800">
                <div className="flex h-8">
                    <div
                        className="flex items-center justify-center bg-gradient-to-r from-green-600 to-green-500 text-xs font-medium text-white"
                        style={{ width: `${100 - result.savingsPercent}%` }}
                    >
                        {result.savingsPercent < 90 && "Compressed"}
                    </div>
                    <div
                        className="flex items-center justify-center bg-red-900/50 text-xs text-red-300"
                        style={{ width: `${result.savingsPercent}%` }}
                    >
                        {result.savingsPercent >= 20 && "Saved"}
                    </div>
                </div>
            </div>

            {/* Storage cost estimation */}
            {isSignificantSavings && (
                <div className="mb-4 rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-3">
                    <p className="flex items-center gap-2 text-sm text-yellow-300">
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        You&apos;ll save ~{formatSize(result.originalSize - result.compressedSize)} on storage fees!
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => onAccept(result.blob)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-500 hover:to-emerald-500"
                >
                    Use Compressed Version
                </button>

                <button
                    onClick={onSkip}
                    className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-300 transition-colors hover:bg-gray-700"
                >
                    Use Original
                </button>

                {onRecompress && (
                    <button
                        onClick={onRecompress}
                        className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5 text-gray-400 transition-colors hover:bg-gray-700"
                        title="Re-compress with different settings"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
