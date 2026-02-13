// ============================================================================
// Audio Recording Service
// ============================================================================

import * as AV from "expo-av";
import * as FileSystem from "expo-file-system";
import {
  AndroidOutputFormat,
  AndroidAudioEncoder,
  IOSOutputFormat,
  IOSAudioQuality,
} from "expo-av/src/Audio/RecordingConstants";

type AudioRecordingOptions = Parameters<
  AV.Audio.Recording["prepareToRecordAsync"]
>[0];
type RecordingStatus = AV.Audio.RecordingStatus;

// ============================================================================
// Recording Configuration
// ============================================================================

const RECORDING_OPTIONS: AudioRecordingOptions = {
  android: {
    extension: ".m4a",
    outputFormat: AndroidOutputFormat.MPEG_4,
    audioEncoder: AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

// ============================================================================
// Recording Service Class
// ============================================================================

class RecordingService {
  private recording: AV.Audio.Recording | null = null;
  private recordingUri: string | null = null;

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording !== null;
  }

  /**
   * Start a new recording
   */
  async startRecording(
    _p0: (level: number) => void,
    _p1: (seconds: number) => void,
    onRecordingStatusUpdate?: (status: RecordingStatus) => void,
  ): Promise<string> {
    // Clean up any existing recording first
    if (this.recording) {
      try {
        await this.cancelRecording();
      } catch (e) {
        console.error("Error cleaning up previous recording:", e);
      }
    }

    // Check permissions
    const permissionStatus = await AV.Audio.requestPermissionsAsync();
    if (!permissionStatus.granted) {
      throw new Error("Audio recording permission not granted");
    }

    // Configure audio mode
    await AV.Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Create new recording
    this.recording = new AV.Audio.Recording();

    // Start recording
    await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);

    if (onRecordingStatusUpdate) {
      this.recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
    }

    await this.recording.startAsync();

    // Get URI
    this.recordingUri = this.recording.getURI();

    if (!this.recordingUri) {
      throw new Error("Failed to get recording URI");
    }

    return this.recordingUri;
  }

  /**
   * Stop the current recording
   */
  async stopRecording(): Promise<{
    uri: string;
    durationMillis: number;
    fileSizeBytes?: number;
  }> {
    if (!this.recording) {
      throw new Error("No recording in progress");
    }

    const status = await this.recording.getStatusAsync();

    // Stop recording
    await this.recording.stopAndUnloadAsync();

    const uri = this.recordingUri || "";
    const durationMillis = status.durationMillis || 0;

    // Get file size
    let fileSizeBytes: number | undefined;
    if (uri) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        fileSizeBytes = fileInfo.exists ? fileInfo.size : undefined;
      } catch (e) {
        console.error("Error getting file info:", e);
      }
    }

    // Clear recording
    this.recording = null;
    this.recordingUri = null;

    return {
      uri,
      durationMillis,
      fileSizeBytes,
    };
  }

  /**
   * Pause the current recording
   */
  async pauseRecording(): Promise<void> {
    if (!this.recording) {
      throw new Error("No recording in progress");
    }

    const status = await this.recording.getStatusAsync();
    if (!status.canRecord) {
      throw new Error("Recording is not in progress");
    }

    await this.recording.pauseAsync();
  }

  /**
   * Resume the paused recording
   */
  async resumeRecording(): Promise<void> {
    if (!this.recording) {
      throw new Error("No recording in progress");
    }

    const status = await this.recording.getStatusAsync();
    if (status.canRecord) {
      throw new Error("Recording is not paused");
    }

    await this.recording.startAsync();
  }

  /**
   * Cancel the current recording
   */
  async cancelRecording(): Promise<void> {
    if (!this.recording) {
      return;
    }

    try {
      // Get the status to check if recording is prepared
      const status = await this.recording.getStatusAsync().catch(() => null);

      // Only stop/unload if the recording was actually prepared
      if (status) {
        await this.recording.stopAndUnloadAsync().catch((e) => {
          console.error("Error stopping recording:", e);
        });
      }

      // Delete the file if it exists
      if (this.recordingUri) {
        try {
          await FileSystem.deleteAsync(this.recordingUri);
        } catch (e) {
          console.error("Error deleting recording file:", e);
        }
      }
    } catch (e) {
      console.error("Error canceling recording:", e);
    } finally {
      this.recording = null;
      this.recordingUri = null;
    }
  }

  /**
   * Get the current recording status
   */
  async getStatus(): Promise<RecordingStatus | null> {
    if (!this.recording) {
      return null;
    }

    return await this.recording.getStatusAsync();
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const recordingService = new RecordingService();
