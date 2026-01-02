"use client";

import { useState, useRef, DragEvent } from "react";
import type { MediaFile } from "@/types/media";
import {
  validateFileType,
  validateFileSize,
  getMediaDuration,
} from "@/utils/mediaValidation";
import { useCompression } from "@/hooks/useCompression";
import { CompressionProgress, CompressionPreview } from "@/components/compression";
import {
  COMPRESSION_THRESHOLD,
  COMPRESSIBLE_VIDEO_TYPES,
  COMPRESSIBLE_IMAGE_TYPES,
  type CompressionResult,
} from "@/types/compression";

interface MediaUploaderProps {
  onFileSelect: (mediaFile: MediaFile) => void;
  onError?: (error: Error) => void;
}

type UploadStage = 'idle' | 'validating' | 'compress-prompt' | 'compressing' | 'compress-preview' | 'ready';

/**
 * MediaUploader component with drag-and-drop support and optional compression
 */
export function MediaUploader({ onFileSelect, onError }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compression = useCompression();

  /**
   * Check if file is compressible
   */
  const isCompressible = (file: File): boolean => {
    const mimeType = file.type.toLowerCase();
    return (
      COMPRESSIBLE_VIDEO_TYPES.includes(mimeType) ||
      COMPRESSIBLE_IMAGE_TYPES.includes(mimeType)
    );
  };

  /**
   * Check if compression should be suggested
   */
  const shouldSuggestCompression = (file: File): boolean => {
    return isCompressible(file) && file.size >= COMPRESSION_THRESHOLD;
  };

  /**
   * Process and validate uploaded file
   */
  const processFile = async (file: File) => {
    setStage('validating');
    setError(null);
    setWarning(null);
    setPendingFile(file);
    setCompressionResult(null);

    try {
      // Validate file type - Requirement 3.1
      const typeValidation = validateFileType(file);
      if (!typeValidation.isValid || !typeValidation.mediaType) {
        throw new Error(typeValidation.error || "Invalid file type");
      }

      // Validate file size - Requirement 3.2
      const sizeValidation = validateFileSize(file);
      if (sizeValidation.isWarning && sizeValidation.warning) {
        setWarning(sizeValidation.warning);
      }

      // Check if we should offer compression
      if (shouldSuggestCompression(file)) {
        setStage('compress-prompt');
        return;
      }

      // Proceed directly to parent
      await finalizeFile(file);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process file";
      setError(errorMessage);
      setStage('idle');
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  };

  /**
   * Finalize and send file to parent
   */
  const finalizeFile = async (file: File | Blob, originalName?: string) => {
    setStage('ready');

    const blob = file instanceof File ? file : file;
    const name = file instanceof File ? file.name : (originalName || 'compressed-media');
    const mimeType = blob.type;

    // Determine media type
    const isVideo = mimeType.startsWith('video');
    const mediaType = isVideo ? 'video' : 'audio';

    // Get media duration
    const duration = await getMediaDuration(new File([blob], name, { type: mimeType }));

    // Create MediaFile object
    const mediaFile: MediaFile = {
      blob,
      type: mediaType,
      size: blob.size,
      mimeType: mimeType as MediaFile['mimeType'],
      duration,
      name,
    };

    // Pass to parent
    onFileSelect(mediaFile);

    // Reset state
    setStage('idle');
    setPendingFile(null);
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Start compression
   */
  const handleStartCompression = async () => {
    if (!pendingFile) return;

    setStage('compressing');

    try {
      const result = await compression.compress(pendingFile);
      setCompressionResult(result);
      setStage('compress-preview');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Compression failed";
      setError(errorMessage);
      setStage('compress-prompt'); // Allow retry
    }
  };

  /**
   * Skip compression and use original
   */
  const handleSkipCompression = async () => {
    if (pendingFile) {
      await finalizeFile(pendingFile);
    }
  };

  /**
   * Accept compressed version
   */
  const handleAcceptCompressed = async (blob: Blob) => {
    await finalizeFile(blob, pendingFile?.name);
  };

  /**
   * Handle file selection from input
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  /**
   * Handle drag and drop - Requirement 3.1
   */
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  /**
   * Open file picker
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Cancel and reset
   */
  const handleCancel = () => {
    compression.cancel();
    setStage('idle');
    setPendingFile(null);
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };



  return (
    <div className="space-y-4">
      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.ogg,.mp4,.webm,.mov,.jpg,.jpeg,.png,.gif,audio/*,video/*,image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Warning Display - Requirement 3.2 */}
      {warning && (
        <div className="rounded-lg border border-yellow-700 bg-yellow-900 p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 flex-shrink-0 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm text-yellow-300">{warning}</p>
          </div>
        </div>
      )}

      {/* Compression Prompt */}
      {stage === 'compress-prompt' && pendingFile && (
        <div className="rounded-lg border border-purple-700/50 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-purple-500/20 p-2">
              <svg
                className="h-6 w-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Large File Detected</h3>
              <p className="text-sm text-purple-300">
                {(pendingFile.size / 1024 / 1024).toFixed(1)} MB - Compress to save on storage fees?
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm text-gray-400">
            Compression can reduce file size by up to 80% without noticeable quality loss.
            This saves you money on IPFS storage.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleStartCompression}
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-purple-900/30 transition-all hover:from-purple-500 hover:to-indigo-500"
            >
              Compress File
            </button>
            <button
              onClick={handleSkipCompression}
              className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-300 transition-colors hover:bg-gray-700"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Compression Progress */}
      {stage === 'compressing' && pendingFile && (
        <CompressionProgress
          progress={compression.progress}
          stage={compression.stage}
          originalSize={pendingFile.size}
          estimatedSize={compression.checkEligibility(pendingFile).estimatedSize}
          onCancel={handleCancel}
        />
      )}

      {/* Compression Preview */}
      {stage === 'compress-preview' && pendingFile && compressionResult && (
        <CompressionPreview
          originalFile={pendingFile}
          result={compressionResult}
          onAccept={handleAcceptCompressed}
          onSkip={handleSkipCompression}
          onRecompress={handleStartCompression}
        />
      )}

      {/* Drag and Drop Area - Show when idle or validating */}
      {(stage === 'idle' || stage === 'validating') && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging
            ? "border-blue-500 bg-blue-900/20"
            : "border-gray-600 bg-gray-900 hover:border-gray-500"
            } ${stage === 'validating' ? "pointer-events-none opacity-50" : ""}`}
        >
          <div className="flex flex-col items-center space-y-4">
            <svg
              className="h-12 w-12 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <div>
              <p className="text-lg font-medium text-gray-200">
                {stage === 'validating' ? "Processing file..." : "Drop your file here"}
              </p>
              <p className="mt-1 text-sm text-gray-400">or</p>
            </div>

            <button
              onClick={handleBrowseClick}
              disabled={stage === 'validating'}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Browse Files
            </button>

            <div className="text-xs text-gray-500">
              <p>Supported formats:</p>
              <p className="mt-1">Audio: MP3, WAV, OGG</p>
              <p>Video: MP4, WEBM, MOV</p>
              <p>Images: JPEG, PNG, GIF</p>
              <p className="mt-2">Maximum size: 100 MB</p>
              <p className="text-purple-400">
                💡 Large files can be compressed to save storage fees
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
