import { Audio } from 'expo-av';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  moveAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import { AUDIO_CONFIG } from '@/constants/config';

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
        throw new Error('Microphone permission is required to record audio');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      throw error;
    }
  }

  async startRecording(
    onMetering: MeteringCallback,
    onDuration: DurationCallback
  ): Promise<void> {
    if (this.isPreparing) {
      console.log('Recording is already being prepared, please wait...');
      return;
    }

    if (this.isRecordingActive && !this.isPausedState) {
      console.log('Recording is already active');
      return;
    }

    this.isPreparing = true;

    try {
      await this.initialize();

      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          console.error('Error stopping previous recording:', e);
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
          mimeType: 'audio/webm',
          bitsPerSecond: AUDIO_CONFIG.bitRate,
        },
      });

      this.recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && !this.isPausedState) {
          this.isRecordingActive = true;
          const seconds = Math.floor(status.durationMillis / 1000);
          this.recordedDuration = seconds;
          this.onDurationUpdate?.(seconds);

          if (status.metering !== undefined) {
            const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            this.onMeteringUpdate?.(normalized);
          }
        }
      });

      this.recording.setProgressUpdateInterval(100);
      await this.recording.startAsync();

      this.isRecordingActive = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      await this.cleanup();
      throw error;
    } finally {
      this.isPreparing = false;
    }
  }

  async pauseRecording(): Promise<void> {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    if (!this.isRecordingActive) {
      throw new Error('Recording is not active');
    }

    if (this.isPausedState) {
      return;
    }

    try {
      await this.recording.pauseAsync();
      this.isPausedState = true;
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    if (!this.isRecordingActive) {
      throw new Error('Recording is not active');
    }

    if (!this.isPausedState) {
      return;
    }

    try {
      await this.recording.startAsync();
      this.isPausedState = false;
    } catch (error) {
      console.error('Error resuming recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    if (!this.recording) {
      throw new Error('No recording to stop');
    }

    const recordingToStop = this.recording;
    let uri: string | null = null;

    try {
      uri = recordingToStop.getURI();

      if (this.isPausedState) {
        try {
          await recordingToStop.startAsync();
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          console.warn('Could not resume before stop:', e);
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
          console.error('Error saving recording file:', error);
          throw new Error('Failed to save recording file');
        }
      }

      throw new Error('No recording URI found');
    } catch (error) {
      console.error('Error stopping recording:', error);
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
      console.error('Error canceling recording:', error);
    } finally {
      if (uri) {
        try {
          await deleteAsync(uri);
        } catch (e) {
          console.error('Error deleting temp file:', e);
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
      } catch (e) {
        console.error('Error during cleanup:', e);
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
      console.error('Error deleting recording:', error);
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
