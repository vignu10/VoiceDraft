// Recording Configuration
export const MAX_RECORDING_DURATION = 600; // 10 minutes in seconds
export const RECORDING_WARNING_THRESHOLD = 540; // 9 minutes - show warning
export const MIN_RECORDING_DURATION = 15; // Minimum 15 seconds required

// Transcription Validation
export const MIN_TRANSCRIPT_LENGTH = 20; // Minimum characters for valid transcript
export const MIN_TRANSCRIPT_WORDS = 5; // Minimum words for valid transcript

// Recording Milestones (in seconds)
export const RECORDING_MILESTONES = [30, 60, 120, 180, 300];

// Milestone celebration messages
export const MILESTONE_MESSAGES: Record<number, string[]> = {
  30: ["Looking good!", "Keep going!", "Great start!"],
  60: ["1 minute! Nice work!", "You're on a roll!"],
  120: ["2 minutes! Amazing!", "Fantastic content!"],
  180: ["3 minutes! You're on fire!", "Incredible flow!"],
  300: ["5 minutes! Wow!", "That's dedication!"],
};

// Blog Length word count ranges
export const LENGTH_WORD_COUNTS = {
  short: { min: 150, max: 300 },
  medium: { min: 400, max: 600 },
  long: { min: 800, max: 1200 },
};

// Audio activity threshold (0-1 range)
export const AUDIO_ACTIVITY_THRESHOLD = 0.05;
