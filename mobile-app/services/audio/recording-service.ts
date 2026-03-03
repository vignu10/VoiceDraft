/**
 * Refactored Recording Service
 * Improved audio recording with proper metering and no artificial minimums
 * Uses expo-av with optimized callback-based metering
 */

import { AUDIO_CONFIG } from "@/constants/config";
import { Audio } from "expo-av";
import {
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  moveAsync,
} from "expo-file-system/legacy";

export interface RecordingResult {
  uri: string;
  duration: number;
}

type MeteringCallback = (level: number) => void;
type DurationCallback = (seconds: number) => void;

class RecordingService {
  private recording: Audio.Recording | null = null;
  private onMeteringUpdate: MeteringCallback | null = null;
  private onDurationUpdate: DurationCallback | null = null;
  private isInitialized = false;
  private isRecordingActive = false;
  private isPausedState = false;
  private recordedDuration = 0;
  private isPreparing = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error("Microphone permission is required to record audio");
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("[RecordingService] Error initializing audio:", error);
      throw error;
    }
  }

  async startRecording(
    onMetering: MeteringCallback,
    onDuration: DurationCallback,
  ): Promise<void> {
    if (this.isPreparing) {
      return;
    }

    if (this.isRecordingActive && !this.isPausedState) {
      return;
    }

    this.isPreparing = true;

    try {
      await this.initialize();

      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          console.error(
            "[RecordingService] Error stopping previous recording:",
            e,
          );
        }
        this.recording = null;
      }

      this.onMeteringUpdate = onMetering;
      this.onDurationUpdate = onDuration;
      this.isRecordingActive = false;
      this.isPausedState = false;
      this.recordedDuration = 0;

      this.recording = new Audio.Recording();

      await this.recording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: AUDIO_CONFIG.extension,
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: AUDIO_CONFIG.sampleRate,
          numberOfChannels: AUDIO_CONFIG.numberOfChannels,
          bitRate: AUDIO_CONFIG.bitRate,
        },
        ios: {
          extension: AUDIO_CONFIG.extension,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: AUDIO_CONFIG.sampleRate,
          numberOfChannels: AUDIO_CONFIG.numberOfChannels,
          bitRate: AUDIO_CONFIG.bitRate,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: AUDIO_CONFIG.bitRate,
        },
      });

      // Set up status callback BEFORE starting recording
      this.recording.setOnRecordingStatusUpdate(
        (status: Audio.RecordingStatus) => {
          // Process metering whenever recording is active
          if (this.isRecordingActive) {
            // Update duration
            const seconds = Math.floor(status.durationMillis / 1000);
            if (seconds !== this.recordedDuration) {
              this.recordedDuration = seconds;
              this.onDurationUpdate?.(seconds);
            }

            // Process metering - NO MINIMUM FLOOR (allows true silence)
            if (status.metering !== undefined && this.onMeteringUpdate) {
              const normalizedLevel = this.normalizeMetering(status.metering);
              this.onMeteringUpdate(normalizedLevel);
            }
          }
        },
      );

      // Fast update interval for smooth waveform (20fps)
      this.recording.setProgressUpdateInterval(50);

      await this.recording.startAsync();

      // Set the recording as active AFTER starting
      this.isRecordingActive = true;
    } catch (error) {
      console.error("[RecordingService] Error starting recording:", error);
      await this.cleanup();
      throw error;
    } finally {
      this.isPreparing = false;
    }
  }

  /**
   * Normalize metering value to 0-1 range WITHOUT artificial minimum
   * This allows true silence (0) to be represented
   */
  private normalizeMetering(metering: number): number {
    // Clamp metering to valid range first (-60 to 0, or anything above -100)
    // Values below -60 are treated as -60 (silence)
    const clampedMetering = Math.max(-60, Math.min(0, metering));

    // Convert to 0-1 range
    let normalized = (clampedMetering + 60) / 60;

    // Apply logarithmic scaling for better voice sensitivity
    normalized = Math.pow(normalized, 0.5);

    // Clamp to valid range
    normalized = Math.max(0, Math.min(1, normalized));

    return normalized;
  }

  async pauseRecording(): Promise<void> {
    if (!this.recording) {
      throw new Error("No recording in progress");
    }

    if (!this.isRecordingActive) {
      throw new Error("Recording is not active");
    }

    if (this.isPausedState) {
      return;
    }

    try {
      await this.recording.pauseAsync();
      this.isPausedState = true;
    } catch (error) {
      console.error("[RecordingService] Error pausing recording:", error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    if (!this.recording) {
      throw new Error("No recording in progress");
    }

    if (!this.isRecordingActive) {
      throw new Error("Recording is not active");
    }

    if (!this.isPausedState) {
      return;
    }

    try {
      await this.recording.startAsync();
      this.isPausedState = false;
    } catch (error) {
      console.error("[RecordingService] Error resuming recording:", error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    if (!this.recording) {
      throw new Error("No recording to stop");
    }

    const recordingToStop = this.recording;
    let uri: string | null = null;

    try {
      uri = recordingToStop.getURI();

      if (this.isPausedState) {
        try {
          await recordingToStop.startAsync();
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
          // Silently handle resume error
        }
      }

      await recordingToStop.stopAndUnloadAsync();

      const duration = this.recordedDuration;

      await this.cleanup();

      if (uri) {
        const recordingsDir = `${documentDirectory}recordings/`;

        try {
          const dirInfo = await getInfoAsync(recordingsDir);
          if (!dirInfo.exists) {
            await makeDirectoryAsync(recordingsDir, {
              intermediates: true,
            });
          }

          const fileName = `recording_${Date.now()}${AUDIO_CONFIG.extension}`;
          const destUri = `${recordingsDir}${fileName}`;
          await moveAsync({ from: uri, to: destUri });

          return {
            uri: destUri,
            duration,
          };
        } catch (error) {
          console.error(
            "[RecordingService] Error saving recording file:",
            error,
          );
          throw new Error("Failed to save recording file");
        }
      }

      throw new Error("No recording URI found");
    } catch (error) {
      console.error("[RecordingService] Error stopping recording:", error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording locally and return the local file URI WITHOUT uploading to S3.
   * Used for the guest flow where no auth token is available.
   */
  async stopRecordingLocally(): Promise<{ uri: string }> {
    if (!this.recording) {
      throw new Error('No recording to stop');
    }

    const recordingToStop = this.recording;
    let uri: string | null = null;

    try {
      // Get URI before stopping (recording must be loaded)
      uri = recordingToStop.getURI();

      if (this.isPausedState) {
        try {
          await recordingToStop.startAsync();
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
          // Silently handle resume error
        }
      }

      // Stop the recording (handle already unloaded case gracefully)
      try {
        await recordingToStop.stopAndUnloadAsync();
      } catch (e: any) {
        // If recording was already unloaded, that's okay
        if (!e?.message?.includes('already been unloaded')) {
          throw e;
        }
      }

      await this.cleanup();

      if (uri) {
        const recordingsDir = `${documentDirectory}recordings/`;

        try {
          const dirInfo = await getInfoAsync(recordingsDir);
          if (!dirInfo.exists) {
            await makeDirectoryAsync(recordingsDir, {
              intermediates: true,
            });
          }

          const fileName = `recording_${Date.now()}${AUDIO_CONFIG.extension}`;
          const destUri = `${recordingsDir}${fileName}`;
          await moveAsync({ from: uri, to: destUri });

          return { uri: destUri };
        } catch (error) {
          console.error(
            '[RecordingService] Error saving recording file locally:',
            error,
          );
          // Fall back to original URI if move fails
          return { uri };
        }
      }

      throw new Error('No recording URI found');
    } catch (error) {
      console.error(
        '[RecordingService] Error in stopRecordingLocally:',
        error,
      );
      await this.cleanup();
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    const recordingToCancel = this.recording;
    let uri: string | null = null;

    try {
      if (recordingToCancel) {
        uri = recordingToCancel.getURI();
        await recordingToCancel.stopAndUnloadAsync();
      }
    } catch (error) {
      console.error("[RecordingService] Error canceling recording:", error);
    } finally {
      if (uri) {
        try {
          await deleteAsync(uri);
        } catch {
          // Silently handle cleanup error
        }
      }

      await this.cleanup();
    }
  }

  private async cleanup(): Promise<void> {
    if (this.recording) {
      try {
        // The recording is already unloaded after stopAndUnloadAsync
        // Just clear the reference
      } catch {
        // Silently handle cleanup error
      }
      this.recording = null;
    }

    this.onMeteringUpdate = null;
    this.onDurationUpdate = null;
    this.isRecordingActive = false;
    this.isPausedState = false;
    this.recordedDuration = 0;
    this.isPreparing = false;
    this.isInitialized = false;
  }

  async deleteRecording(uri: string): Promise<void> {
    try {
      const info = await getInfoAsync(uri);
      if (info.exists) {
        await deleteAsync(uri);
      }
    } catch (error) {
      console.error("[RecordingService] Error deleting recording:", error);
    }
  }

  isRecording(): boolean {
    return this.isRecordingActive;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  getStatus(): { isRecording: boolean; isPaused: boolean } {
    return {
      isRecording: this.isRecordingActive,
      isPaused: this.isPausedState,
    };
  }

  getDuration(): number {
    return this.recordedDuration;
  }
}

export const recordingService = new RecordingService();
