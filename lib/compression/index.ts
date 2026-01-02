/**
 * Compression library exports
 */

export { compressionService } from './CompressionService';
export type {
    CompressionOptions,
    CompressionResult,
    CompressionEligibility,
    CompressionPreset,
    CompressionState,
    PresetConfig,
} from '@/types/compression';
export {
    COMPRESSION_PRESETS,
    COMPRESSION_THRESHOLD,
    COMPRESSIBLE_VIDEO_TYPES,
    COMPRESSIBLE_IMAGE_TYPES,
} from '@/types/compression';
