/**
 * CompressionService Unit Tests
 *
 * Tests for the compression service functionality.
 * Note: Full e2e tests require browser environment with ffmpeg.wasm.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    COMPRESSION_PRESETS,
    COMPRESSION_THRESHOLD,
    COMPRESSIBLE_VIDEO_TYPES,
    COMPRESSIBLE_IMAGE_TYPES,
} from "@/types/compression";

describe("Compression Types and Constants", () => {
    describe("COMPRESSION_PRESETS", () => {
        it("should have three presets: high, balanced, maximum", () => {
            expect(Object.keys(COMPRESSION_PRESETS)).toEqual([
                "high",
                "balanced",
                "maximum",
            ]);
        });

        it("high preset should have lowest CRF (best quality)", () => {
            expect(COMPRESSION_PRESETS.high.videoCrf).toBe(18);
            expect(COMPRESSION_PRESETS.high.imageQuality).toBe(90);
            expect(COMPRESSION_PRESETS.high.targetRatio).toBe(0.6);
        });

        it("balanced preset should have moderate CRF", () => {
            expect(COMPRESSION_PRESETS.balanced.videoCrf).toBe(23);
            expect(COMPRESSION_PRESETS.balanced.imageQuality).toBe(80);
            expect(COMPRESSION_PRESETS.balanced.targetRatio).toBe(0.3);
        });

        it("maximum preset should have highest CRF (smallest size)", () => {
            expect(COMPRESSION_PRESETS.maximum.videoCrf).toBe(28);
            expect(COMPRESSION_PRESETS.maximum.imageQuality).toBe(60);
            expect(COMPRESSION_PRESETS.maximum.targetRatio).toBe(0.15);
        });
    });

    describe("COMPRESSION_THRESHOLD", () => {
        it("should be 10MB", () => {
            expect(COMPRESSION_THRESHOLD).toBe(10 * 1024 * 1024);
        });
    });

    describe("COMPRESSIBLE_VIDEO_TYPES", () => {
        it("should include common video formats", () => {
            expect(COMPRESSIBLE_VIDEO_TYPES).toContain("video/mp4");
            expect(COMPRESSIBLE_VIDEO_TYPES).toContain("video/webm");
            expect(COMPRESSIBLE_VIDEO_TYPES).toContain("video/quicktime");
        });
    });

    describe("COMPRESSIBLE_IMAGE_TYPES", () => {
        it("should include common image formats", () => {
            expect(COMPRESSIBLE_IMAGE_TYPES).toContain("image/jpeg");
            expect(COMPRESSIBLE_IMAGE_TYPES).toContain("image/png");
            expect(COMPRESSIBLE_IMAGE_TYPES).toContain("image/webp");
        });
    });
});

describe("CompressionService", () => {
    // Mock the FFmpeg class
    const mockLoad = vi.fn();
    const mockWriteFile = vi.fn();
    const mockReadFile = vi.fn();
    const mockDeleteFile = vi.fn();
    const mockExec = vi.fn();
    const mockOn = vi.fn();

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe("checkEligibility", () => {
        it("should work with the service singleton", async () => {
            // Dynamic import to avoid module resolution issues in test
            const { compressionService } = await import("@/lib/compression");

            // Test with a mock file
            const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
            const result = compressionService.checkEligibility(mockFile);

            expect(result.isEligible).toBe(false);
            expect(result.reason).toBe("File type is not compressible");
        });

        it("should mark video files as eligible", async () => {
            const { compressionService } = await import("@/lib/compression");

            const mockFile = new File(["video content"], "test.mp4", {
                type: "video/mp4",
            });
            Object.defineProperty(mockFile, "size", { value: 5 * 1024 * 1024 }); // 5MB

            const result = compressionService.checkEligibility(mockFile);

            expect(result.isEligible).toBe(true);
        });

        it("should suggest compression for large files", async () => {
            const { compressionService } = await import("@/lib/compression");

            const mockFile = new File(["video content"], "test.mp4", {
                type: "video/mp4",
            });
            Object.defineProperty(mockFile, "size", { value: 50 * 1024 * 1024 }); // 50MB

            const result = compressionService.checkEligibility(mockFile);

            expect(result.isEligible).toBe(true);
            expect(result.estimatedSavings).toBeDefined();
            expect(result.estimatedSavings).toBeGreaterThan(50);
        });

        it("should mark image files as eligible", async () => {
            const { compressionService } = await import("@/lib/compression");

            const mockFile = new File(["image content"], "test.jpg", {
                type: "image/jpeg",
            });
            Object.defineProperty(mockFile, "size", { value: 2 * 1024 * 1024 }); // 2MB

            const result = compressionService.checkEligibility(mockFile);

            expect(result.isEligible).toBe(true);
        });
    });
});

describe("Compression Utility Functions", () => {
    it("CRF range should be valid for H.264", () => {
        // CRF 0 = lossless, CRF 51 = worst quality
        // Our presets should be in the reasonable range (17-28)
        Object.values(COMPRESSION_PRESETS).forEach((preset) => {
            expect(preset.videoCrf).toBeGreaterThanOrEqual(17);
            expect(preset.videoCrf).toBeLessThanOrEqual(28);
        });
    });

    it("Image quality should be valid percentage", () => {
        Object.values(COMPRESSION_PRESETS).forEach((preset) => {
            expect(preset.imageQuality).toBeGreaterThanOrEqual(0);
            expect(preset.imageQuality).toBeLessThanOrEqual(100);
        });
    });

    it("Target ratios should decrease as compression increases", () => {
        expect(COMPRESSION_PRESETS.high.targetRatio).toBeGreaterThan(
            COMPRESSION_PRESETS.balanced.targetRatio
        );
        expect(COMPRESSION_PRESETS.balanced.targetRatio).toBeGreaterThan(
            COMPRESSION_PRESETS.maximum.targetRatio
        );
    });
});
