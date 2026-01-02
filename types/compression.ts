/**
 * Type definitions for media compression functionality
 */

/**
 * Compression quality presets
 */
export type CompressionPreset = 'high' | 'balanced' | 'maximum';

/**
 * Compression options for video/image processing
 */
export interface CompressionOptions {
    /** Quality preset (default: 'balanced') */
    preset?: CompressionPreset;
    /** Progress callback (0-100) */
    onProgress?: (progress: number) => void;
    /** Custom CRF value for video (overrides preset) */
    videoCrf?: number;
    /** Custom quality for images 0-100 (overrides preset) */
    imageQuality?: number;
}

/**
 * Result of compression operation
 */
export interface CompressionResult {
    /** Compressed file blob */
    blob: Blob;
    /** Original file size in bytes */
    originalSize: number;
    /** Compressed file size in bytes */
    compressedSize: number;
    /** Savings percentage (0-100) */
    savingsPercent: number;
    /** Output MIME type */
    mimeType: string;
    /** Compression duration in milliseconds */
    durationMs: number;
}

/**
 * Compression preset configuration
 */
export interface PresetConfig {
    /** CRF value for video (lower = better quality, larger file) */
    videoCrf: number;
    /** JPEG quality for images (0-100) */
    imageQuality: number;
    /** Human-readable description */
    description: string;
    /** Target compression ratio (e.g., 0.3 = 30% of original size) */
    targetRatio: number;
}

/**
 * Compression state for React hooks
 */
export interface CompressionState {
    /** Whether compression is in progress */
    isCompressing: boolean;
    /** Current progress (0-100) */
    progress: number;
    /** Current stage description */
    stage: string;
    /** Error if compression failed */
    error: Error | null;
    /** Result when compression completes */
    result: CompressionResult | null;
}

/**
 * File eligibility for compression
 */
export interface CompressionEligibility {
    /** Whether file can be compressed */
    isEligible: boolean;
    /** Reason if not eligible */
    reason?: string;
    /** Estimated compressed size */
    estimatedSize?: number;
    /** Estimated savings percentage */
    estimatedSavings?: number;
}

/**
 * Preset configurations
 */
export const COMPRESSION_PRESETS: Record<CompressionPreset, PresetConfig> = {
    high: {
        videoCrf: 18,
        imageQuality: 90,
        description: 'High quality - ~40% size reduction',
        targetRatio: 0.6,
    },
    balanced: {
        videoCrf: 23,
        imageQuality: 80,
        description: 'Balanced - ~70% size reduction',
        targetRatio: 0.3,
    },
    maximum: {
        videoCrf: 28,
        imageQuality: 60,
        description: 'Maximum compression - ~85% size reduction',
        targetRatio: 0.15,
    },
};

/**
 * Minimum file size to suggest compression (10MB)
 */
export const COMPRESSION_THRESHOLD = 10 * 1024 * 1024;

/**
 * Check if file type is compressible
 */
export const COMPRESSIBLE_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
];

export const COMPRESSIBLE_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];
