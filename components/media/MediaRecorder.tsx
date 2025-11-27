'use client';

import { useState, useEffect } from 'react';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import type { MediaType } from '@/types/media';

interface MediaRecorderProps {
  onRecordingComplete: (blob: Blob, type: MediaType) => void;
  onError?: (error: Error) => void;
}

/**
 * MediaRecorder component for recording audio/video
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function MediaRecorder({ onRecordingComplete, onError }: MediaRecorderProps) {
  const [mediaType, setMediaType] = useState<MediaType>('audio');
  const [error, setError] = useState<string | null>(null);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  const { recordingState, startRecording, stopRecording, clearRecording } =
    useMediaRecorder(mediaType);

  /**
   * Detect iOS Safari
   * Requirement 2.5: Detect iOS Safari and show upload-only fallback
   */
  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    setIsIOSSafari(isIOS && isSafari);
  }, []);

  const handleStartRecording = async () => {
    try {
      setError(null);
      await startRecording();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  // Auto-save recording when blob is available (no confirmation step)
  useEffect(() => {
    if (recordingState.blob) {
      onRecordingComplete(recordingState.blob, mediaType);
      // Clear after a short delay to avoid state conflicts
      const timer = setTimeout(() => {
        clearRecording();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recordingState.blob]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show upload-only fallback for iOS Safari
  if (isIOSSafari) {
    return (
      <div className="rounded-lg border border-yellow-700 bg-yellow-900 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-200">
              Recording not supported on iOS Safari
            </h3>
            <p className="mt-2 text-sm text-yellow-300">
              Media recording is not fully supported on iOS Safari. Please use the file
              upload option instead, or try using a different browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Media Type Selection */}
      {!recordingState.isRecording && !recordingState.blob && (
        <div className="flex gap-2">
          <button
            onClick={() => setMediaType('audio')}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
              mediaType === 'audio'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Audio Only
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
              mediaType === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Video + Audio
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Recording Controls */}
      {!recordingState.blob && (
        <div className="flex flex-col items-center space-y-4">
          {recordingState.isRecording && (
            <div className="flex items-center space-x-3">
              {/* Recording Indicator */}
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-600"></div>
                <span className="text-sm font-medium text-gray-300">Recording</span>
              </div>
              
              {/* Duration Display - Requirement 2.2 */}
              <div className="rounded-lg bg-gray-800 px-3 py-1">
                <span className="font-mono text-lg font-semibold text-gray-100">
                  {formatDuration(recordingState.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Active Device Indicators - Requirement 2.2 */}
          {recordingState.isRecording && (
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
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
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <span>Microphone</span>
              </div>
              {mediaType === 'video' && (
                <div className="flex items-center space-x-1">
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
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Camera</span>
                </div>
              )}
            </div>
          )}

          {/* Record/Stop Button */}
          <button
            onClick={recordingState.isRecording ? handleStopRecording : handleStartRecording}
            className={`rounded-full p-6 transition-all ${
              recordingState.isRecording
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {recordingState.isRecording ? (
              <svg
                className="h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg
                className="h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="8" />
              </svg>
            )}
          </button>

          <p className="text-sm text-gray-400">
            {recordingState.isRecording
              ? 'Click to stop recording'
              : `Click to start ${mediaType} recording`}
          </p>
        </div>
      )}

    </div>
  );
}
