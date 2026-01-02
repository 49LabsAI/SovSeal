/**
 * CompressionService - In-browser media compression using ffmpeg.wasm
 *
 * Provides client-side video and image compression to reduce file sizes
 * before IPFS upload. Uses lazy loading to avoid impacting initial page load.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
    type CompressionOptions,
    type CompressionResult,
    type CompressionEligibility,
    COMPRESSION_PRESETS,
    COMPRESSION_THRESHOLD,
    COMPRESSIBLE_VIDEO_TYPES,
    COMPRESSIBLE_IMAGE_TYPES,
} from '@/types/compression';

const LOG_CONTEXT = 'CompressionService';

/**
 * CompressionService handles in-browser media compression using ffmpeg.wasm
 */
class CompressionService {
    private ffmpeg: FFmpeg | null = null;
    private isLoading: boolean = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Check if ffmpeg is loaded and ready
     */
    isReady(): boolean {
        return this.ffmpeg?.loaded ?? false;
    }

    /**
     * Lazily load ffmpeg.wasm
     * Only loads once, subsequent calls return immediately
     */
    async load(): Promise<void> {
        // Already loaded
        if (this.ffmpeg?.loaded) {
            return;
        }

        // Loading in progress, wait for it
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this.doLoad();

        try {
            await this.loadPromise;
        } finally {
            this.isLoading = false;
        }
    }

    private async doLoad(): Promise<void> {
        console.log(`[${LOG_CONTEXT}] Loading ffmpeg.wasm...`);

        this.ffmpeg = new FFmpeg();

        // Use CDN for WASM files (more reliable than bundling)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        try {
            await this.ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            console.log(`[${LOG_CONTEXT}] ffmpeg.wasm loaded successfully`);
        } catch (error) {
            console.error(`[${LOG_CONTEXT}] Failed to load ffmpeg.wasm:`, error);
            this.ffmpeg = null;
            this.loadPromise = null;
            throw new Error('Failed to load compression library. Please try again.');
        }
    }

    /**
     * Check if a file is eligible for compression
     */
    checkEligibility(file: File): CompressionEligibility {
        const mimeType = file.type.toLowerCase();

        // Check if file type is compressible
        const isVideo = COMPRESSIBLE_VIDEO_TYPES.includes(mimeType);
        const isImage = COMPRESSIBLE_IMAGE_TYPES.includes(mimeType);

        if (!isVideo && !isImage) {
            return {
                isEligible: false,
                reason: 'File type is not compressible',
            };
        }

        // Check if file is large enough to benefit from compression
        if (file.size < COMPRESSION_THRESHOLD) {
            return {
                isEligible: true,
                reason: 'File is small, compression optional',
                estimatedSize: Math.round(file.size * 0.7),
                estimatedSavings: 30,
            };
        }

        // Estimate compression based on preset
        const preset = COMPRESSION_PRESETS.balanced;
        const estimatedSize = Math.round(file.size * preset.targetRatio);
        const estimatedSavings = Math.round((1 - preset.targetRatio) * 100);

        return {
            isEligible: true,
            estimatedSize,
            estimatedSavings,
        };
    }

    /**
     * Compress a video file
     */
    async compressVideo(
        file: File,
        options: CompressionOptions = {}
    ): Promise<CompressionResult> {
        const startTime = Date.now();
        const preset = options.preset || 'balanced';
        const config = COMPRESSION_PRESETS[preset];
        const crf = options.videoCrf ?? config.videoCrf;

        await this.load();

        if (!this.ffmpeg) {
            throw new Error('Compression library not loaded');
        }

        const inputName = 'input' + this.getExtension(file.type);
        const outputName = 'output.mp4'; // Always output as MP4 for compatibility

        try {
            // Set up progress handler
            if (options.onProgress) {
                this.ffmpeg.on('progress', ({ progress }) => {
                    options.onProgress!(Math.round(progress * 100));
                });
            }

            console.log(`[${LOG_CONTEXT}] Compressing video with CRF ${crf}...`);

            // Write input file to virtual filesystem
            await this.ffmpeg.writeFile(inputName, await fetchFile(file));

            // Run compression
            // -crf: Quality (lower = better quality, larger file)
            // -preset: Speed/compression trade-off (slower = better compression)
            // -c:v libx264: Use H.264 codec
            // -c:a copy: Copy audio without re-encoding
            await this.ffmpeg.exec([
                '-i', inputName,
                '-c:v', 'libx264',
                '-crf', crf.toString(),
                '-preset', 'medium',
                '-c:a', 'copy',
                '-movflags', '+faststart', // Optimize for web streaming
                outputName,
            ]);

            // Read output file
            const data = await this.ffmpeg.readFile(outputName);
            // Convert FileData to Uint8Array for Blob compatibility
            const uint8Array = data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(data);
            const blob = new Blob([uint8Array], { type: 'video/mp4' });

            // Cleanup virtual filesystem
            await this.cleanupFiles([inputName, outputName]);

            const result: CompressionResult = {
                blob,
                originalSize: file.size,
                compressedSize: blob.size,
                savingsPercent: Math.round((1 - blob.size / file.size) * 100),
                mimeType: 'video/mp4',
                durationMs: Date.now() - startTime,
            };

            console.log(
                `[${LOG_CONTEXT}] Video compressed: ${this.formatSize(file.size)} → ${this.formatSize(blob.size)} (${result.savingsPercent}% savings)`
            );

            return result;
        } catch (error) {
            console.error(`[${LOG_CONTEXT}] Video compression failed:`, error);
            await this.cleanupFiles([inputName, outputName]).catch(() => { });
            throw error;
        }
    }

    /**
     * Compress an image file
     */
    async compressImage(
        file: File,
        options: CompressionOptions = {}
    ): Promise<CompressionResult> {
        const startTime = Date.now();
        const preset = options.preset || 'balanced';
        const config = COMPRESSION_PRESETS[preset];
        const quality = options.imageQuality ?? config.imageQuality;

        await this.load();

        if (!this.ffmpeg) {
            throw new Error('Compression library not loaded');
        }

        const inputName = 'input' + this.getExtension(file.type);
        const outputName = 'output.jpg'; // Always output as JPEG

        try {
            // Set up progress handler
            if (options.onProgress) {
                this.ffmpeg.on('progress', ({ progress }) => {
                    options.onProgress!(Math.round(progress * 100));
                });
            }

            console.log(`[${LOG_CONTEXT}] Compressing image with quality ${quality}...`);

            // Write input file to virtual filesystem
            await this.ffmpeg.writeFile(inputName, await fetchFile(file));

            // Run compression
            await this.ffmpeg.exec([
                '-i', inputName,
                '-q:v', Math.round((100 - quality) / 3).toString(), // Convert quality to ffmpeg scale (2-31, lower is better)
                outputName,
            ]);

            // Read output file
            const data = await this.ffmpeg.readFile(outputName);
            // Convert FileData to Uint8Array for Blob compatibility
            const uint8Array = data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(data);
            const blob = new Blob([uint8Array], { type: 'image/jpeg' });

            // Cleanup virtual filesystem
            await this.cleanupFiles([inputName, outputName]);

            const result: CompressionResult = {
                blob,
                originalSize: file.size,
                compressedSize: blob.size,
                savingsPercent: Math.round((1 - blob.size / file.size) * 100),
                mimeType: 'image/jpeg',
                durationMs: Date.now() - startTime,
            };

            console.log(
                `[${LOG_CONTEXT}] Image compressed: ${this.formatSize(file.size)} → ${this.formatSize(blob.size)} (${result.savingsPercent}% savings)`
            );

            return result;
        } catch (error) {
            console.error(`[${LOG_CONTEXT}] Image compression failed:`, error);
            await this.cleanupFiles([inputName, outputName]).catch(() => { });
            throw error;
        }
    }

    /**
     * Compress any supported media file
     */
    async compress(
        file: File,
        options: CompressionOptions = {}
    ): Promise<CompressionResult> {
        const mimeType = file.type.toLowerCase();

        if (COMPRESSIBLE_VIDEO_TYPES.includes(mimeType)) {
            return this.compressVideo(file, options);
        }

        if (COMPRESSIBLE_IMAGE_TYPES.includes(mimeType)) {
            return this.compressImage(file, options);
        }

        throw new Error(`Unsupported file type for compression: ${mimeType}`);
    }

    /**
     * Get file extension from MIME type
     */
    private getExtension(mimeType: string): string {
        const extensions: Record<string, string> = {
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/quicktime': '.mov',
            'video/x-msvideo': '.avi',
            'video/x-matroska': '.mkv',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif',
        };
        return extensions[mimeType.toLowerCase()] || '.bin';
    }

    /**
     * Cleanup files from virtual filesystem
     */
    private async cleanupFiles(files: string[]): Promise<void> {
        if (!this.ffmpeg) return;

        for (const file of files) {
            try {
                await this.ffmpeg.deleteFile(file);
            } catch {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Format file size for display
     */
    private formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
}

// Export singleton instance
export const compressionService = new CompressionService();
