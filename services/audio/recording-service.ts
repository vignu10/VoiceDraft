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

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

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
  }

  async startRecording(
    onMetering: MeteringCallback,
    onDuration: DurationCallback
  ): Promise<void> {
    await this.initialize();

    this.onMeteringUpdate = onMetering;
    this.onDurationUpdate = onDuration;

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
      if (status.isRecording) {
        const seconds = Math.floor(status.durationMillis / 1000);
        this.onDurationUpdate?.(seconds);

        if (status.metering !== undefined) {
          // Normalize metering value from dB to 0-1 range
          // Typical metering values range from -160 to 0 dB
          const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          this.onMeteringUpdate?.(normalized);
        }
      }
    });

    this.recording.setProgressUpdateInterval(100);
    await this.recording.startAsync();
  }

  async pauseRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.pauseAsync();
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.startAsync();
    }
  }

  async stopRecording(): Promise<RecordingResult | null> {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.recording = null;
      this.onMeteringUpdate = null;
      this.onDurationUpdate = null;

      if (uri) {
        // Ensure recordings directory exists
        const recordingsDir = `${documentDirectory}recordings/`;
        const dirInfo = await getInfoAsync(recordingsDir);
        if (!dirInfo.exists) {
          await makeDirectoryAsync(recordingsDir, {
            intermediates: true,
          });
        }

        // Move to permanent storage
        const fileName = `recording_${Date.now()}${AUDIO_CONFIG.extension}`;
        const destUri = `${recordingsDir}${fileName}`;
        await moveAsync({ from: uri, to: destUri });

        return {
          uri: destUri,
          duration: Math.floor(status.durationMillis / 1000),
        };
      }

      return null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.recording = null;
      throw error;
    }
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
    return this.recording !== null;
  }
}

export const recordingService = new RecordingService();
