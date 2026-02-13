/**
 * VoiceDraft Delight Messages
 * Warm, encouraging, slightly playful copy that aligns with the
 * "Arc Browser-inspired: soft pastels, playful gradients, unique personality" brand
 */

// ============================================
// EMPTY STATE MESSAGES
// ============================================
export const emptyStateMessages = {
  library: {
    titles: [
      'Your story starts here',
      'Ready to create?',
      'Let your ideas flow',
      'Your voice, amplified',
      'Blank page, endless possibilities',
    ],
    subtitles: [
      'Every great blog post begins with a single voice note. Tap record to start yours.',
      'Capture your thoughts, turn them into content. Your first draft is waiting.',
      'The hardest part is starting. We make the rest easy.',
      'Your ideas deserve to be heard. Let\'s get them out of your head.',
      'One recording can become a published post. Begin your journey.',
    ],
    cta: [
      'Start Recording',
      'Create Your First Draft',
      'Capture Your Ideas',
    ],
  },
  search: {
    titles: [
      'No matches found',
      'Hmm, nothing here',
      'Search came up empty',
    ],
    subtitles: [
      'Try different keywords or browse all your drafts',
      'Adjust your search terms to find what you\'re looking for',
      'No results match your search - clear filters to see everything',
    ],
    cta: [
      'Clear Search',
      'Browse All Drafts',
      'Start Over',
    ],
  },
};

// ============================================
// RECORDING TIPS
// ============================================
export const recordingTips = {
  beforeStart: [
    'Speak naturally - we\'ll structure it later',
    'Don\'t worry about perfection, just share your thoughts',
    'Take your time. Great content isn\'t rushed.',
    'Imagine you\'re talking to a friend. Be yourself.',
    'Your authentic voice is your best voice.',
  ],
  heroMessages: [
    'What\'s on your mind?',
    'Your voice matters',
    'Ready to share your thoughts?',
    'Let your ideas flow',
    'What would you like to create today?',
  ],
  recordingHints: [
    'Tap the microphone to start recording',
    'Press the mic button when you\'re ready',
    'Start speaking whenever you\'re ready',
  ],
  whileRecording: [
    'Keep going, you\'re doing great',
    'Let your ideas flow freely',
    'You\'re on a roll',
    'This is gold - keep capturing it',
    'Your voice matters. Keep sharing.',
  ],
  paused: [
    'Take a breath, then continue when ready',
    'Pause is good. Gather your thoughts.',
    'No rush. Continue when inspiration strikes.',
    'Your ideas are worth waiting for.',
  ],
  completed: [
    'Nice work! That sounded great',
    'Excellent! Let\'s turn this into content',
    'Beautiful. Your voice is powerful.',
    'Wonderful! Processing your recording now.',
    'Captured! Ready for the next step.',
    'Beautiful! Let\'s turn this into content.',
  ],
  resume: [
    'Pick up where you left off',
    'Your ideas are waiting for you',
    'Continue your thought',
    'Back to add more brilliance',
    'Ready to keep going?',
  ],
};

// ============================================
// SUCCESS MESSAGES
// ============================================
export const successMessages = {
  draftSaved: [
    'Saved! Your ideas are safe',
    'Got it! Progress preserved.',
    'Safe and sound.',
    'Draft saved. Keep it up!',
  ],
  draftCreated: [
    'First draft created! Welcome to VoiceDraft',
    'Your first draft. The start of something great.',
    'Welcome aboard! First capture complete.',
    'Beginnings are exciting. Great start!',
  ],
  wordCountMilestone: {
    100: [
      '100 words! You\'re building momentum',
      'Triple digits! Keep going.',
      '100 words down, ideas flowing.',
    ],
    500: [
      '500 words! That\'s a solid piece',
      'Half a thousand! Impressive.',
      '500 words of pure you. Nice.',
    ],
    1000: [
      '1000 words! You\'re on fire',
      'A thousand words! Truly epic.',
      '1000 words. That\'s dedication.',
    ],
    5000: [
      '5000 words! You\'re a content machine',
      'Five thousand! Phenomenal effort.',
      '5000 words. You\'re unstoppable!',
    ],
  },
  published: [
    'Published! Your voice is out there',
    'Live! Your ideas are now shared.',
    'Congratulations on publishing!',
    'Your content is now live. Amazing!',
  ],
};

// ============================================
// ENCOURAGING WORDS (timeless)
// ============================================
export const encouragingWords = {
  morning: [
    'Ready to create something great?',
    'Let\'s make amazing content today.',
    'Your voice is ready to be heard.',
  ],
  afternoon: [
    'Ready to create something great?',
    'Keep the ideas flowing.',
    'Time to capture your thoughts.',
  ],
  evening: [
    'Ready to create something great?',
    'Let your creativity flow.',
    'One more great idea waiting?',
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a random item from an array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get an empty state message for the library
 */
export function getLibraryEmptyState() {
  return {
    title: getRandomItem(emptyStateMessages.library.titles),
    subtitle: getRandomItem(emptyStateMessages.library.subtitles),
    cta: getRandomItem(emptyStateMessages.library.cta),
  };
}

/**
 * Get an empty state message for search results
 */
export function getSearchEmptyState() {
  return {
    title: getRandomItem(emptyStateMessages.search.titles),
    subtitle: getRandomItem(emptyStateMessages.search.subtitles),
    cta: getRandomItem(emptyStateMessages.search.cta),
  };
}

/**
 * Get a recording tip based on current state
 */
export function getRecordingTip(state: 'beforeStart' | 'whileRecording' | 'paused' | 'completed' | 'resume'): string {
  return getRandomItem(recordingTips[state]);
}

/**
 * Get a success message for a specific achievement type
 */
export function getSuccessMessage(type: keyof typeof successMessages, milestone?: number): string {
  if (type === 'wordCountMilestone' && milestone) {
    const messages = successMessages.wordCountMilestone[milestone as keyof typeof successMessages.wordCountMilestone];
    if (messages) {
      return getRandomItem(messages);
    }
    // Fallback to a default message if milestone not found
    return getRandomItem(successMessages.draftCreated);
  }
  // For other types, get the messages array (excluding wordCountMilestone which is an object)
  const messages = successMessages[type as keyof Omit<typeof successMessages, 'wordCountMilestone'>];
  return getRandomItem(messages);
}

/**
 * Get time-appropriate greeting
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return getRandomItem(encouragingWords.morning);
  } else if (hour < 17) {
    return getRandomItem(encouragingWords.afternoon);
  } else {
    return getRandomItem(encouragingWords.evening);
  }
}

/**
 * Get word count milestone message
 */
export function getWordCountMilestone(currentCount: number): string | null {
  const milestones: (100 | 500 | 1000 | 5000)[] = [100, 500, 1000, 5000];
  for (const milestone of milestones) {
    if (currentCount === milestone) {
      const messages = successMessages.wordCountMilestone[milestone];
      return getRandomItem(messages);
    }
  }
  return null;
}

// ============================================
// PROCESSING/LOADING MESSAGES
// ============================================
export const processingMessages = {
  transcribing: [
    'Listening to your voice...',
    'Catching every word...',
    'Turning speech into text...',
    'Capturing your ideas...',
    'Processing your voice...',
  ],
  generating: [
    'Weaving your words into magic...',
    'Crafting your story...',
    'Polishing your content...',
    'Adding structure to your ideas...',
    'Making your voice shine...',
    'Creating something beautiful...',
  ],
  optimizing: [
    'Adding final touches...',
    'Optimizing for search...',
    'Perfecting your post...',
    'Almost there...',
  ],
};

/**
 * Get a rotating processing message based on step
 */
export function getProcessingMessage(step: 'transcribing' | 'generating' | 'optimizing', index: number): string {
  const messages = processingMessages[step];
  return messages[index % messages.length];
}

// ============================================
// KEYWORD SCREEN ENCOURAGEMENT
// ============================================
export const keywordEncouragement = {
  tips: [
    'A keyword helps focus your content',
    'Think about what readers might search for',
    'Skip if you\'re not sure - we\'ll handle it',
    'Keep it simple - one or two words work best',
  ],
  toneDescriptions: {
    professional: 'Polished and authoritative',
    casual: 'Friendly and approachable',
    conversational: 'Like chatting with a friend',
  },
  lengthDescriptions: {
    short: 'Quick and impactful',
    medium: 'Balanced and engaging',
    long: 'Comprehensive and detailed',
  },
};

/**
 * Get a random keyword tip
 */
export function getKeywordTip(): string {
  return getRandomItem(keywordEncouragement.tips);
}

// ============================================
// EDITOR ENCOURAGEMENT
// ============================================
export const editorEncouragement = {
  firstEdit: 'Your voice, your story. Make it shine.',
  returnToEdit: 'Great to see you again!',
  progress: {
    starting: 'Beginnings are exciting',
    growing: 'Your ideas are flowing',
    substantial: 'This is coming together beautifully',
    impressive: 'Impressive depth!',
  },
  milestoneReached: 'You\'re on a roll!',
};

/**
 * Get editor encouragement based on word count
 */
export function getEditorEncouragement(wordCount: number): string | null {
  if (wordCount === 0) return editorEncouragement.progress.starting;
  if (wordCount < 100) return editorEncouragement.progress.growing;
  if (wordCount < 500) return editorEncouragement.progress.substantial;
  return null; // Let milestones handle the rest
}

// ============================================
// ONBOARDING MESSAGES
// ============================================
export const onboardingMessages = {
  welcome: {
    title: 'Welcome to VoiceDraft',
    subtitle: 'Your voice, amplified ✨',
  },
  firstRecording: {
    hint: 'Tap the microphone to start your journey',
  },
  firstDraft: {
    celebration: 'Your first draft! The start of something beautiful',
  },
};

// ============================================
// MICRO-INTERACTION MESSAGES
// ============================================
export const microMessages = {
  favorite: 'Added to favorites',
  unfavorite: 'Removed from favorites',
  copy: 'Copied to clipboard',
  save: 'Saved',
  settings: 'Preferences updated',
  delete: 'Draft deleted',
};

/**
 * Get a micro-interaction message
 */
export function getMicroMessage(type: keyof typeof microMessages): string {
  return microMessages[type];
}

/**
 * Format duration in seconds to a readable string (e.g., "2:30" for 2 minutes 30 seconds)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// CONTINUE DRAFT MESSAGES
// ============================================
export const continueDraftMessages = {
  titles: [
    'Your draft is ready!',
    'Continue writing',
    'Pick up where you left off',
    'Your thoughts are ready!',
    'Ready to continue?',
  ],
  subtitles: [
    'Your brilliant ideas are waiting',
    'Keep your creative momentum going',
    'Your draft is looking great',
    'Time to polish your work',
    'Continue your brilliant thoughts',
  ],
  readyMessages: [
    'Your draft is ready to publish!',
    'Pick up where you left off',
    'Continue your brilliant thoughts',
    'Your ideas are ready to share',
    'Let\'s make this even better',
  ],
  discarded: [
    'Draft discarded',
    'Starting fresh',
    'Ready for a new idea',
  ],
  editRecording: [
    'Change options',
    'Adjust settings',
    'Modify your draft',
  ],
};

/**
 * Get a random continue draft message
 */
export function getContinueDraftMessage(type: keyof typeof continueDraftMessages): string {
  return getRandomItem(continueDraftMessages[type]);
}

// ============================================
// RECORDING MILESTONES
// ============================================
export const recordingMilestones = {
  30: [
    'Great start! Keep going...',
    'Nice! You\'re building momentum.',
    '30 seconds! You\'re on a roll.',
  ],
  60: [
    '1 minute! You\'re building momentum',
    'One minute down! Keep flowing.',
    'A minute in! This is great.',
  ],
  120: [
    '2 minutes! This is gold',
    'Two minutes! Your ideas are flowing.',
    '2 minutes! You\'ve got this.',
  ],
  180: [
    '3 minutes! You\'re on fire',
    'Three minutes of pure brilliance!',
    'Amazing! Keep sharing your thoughts.',
  ],
  300: [
    '5 minutes! You\'re unstoppable',
    'Five minutes! That\'s dedication.',
    'Incredible! Your voice is powerful.',
  ],
};

/**
 * Get a recording milestone message if applicable
 */
export function getRecordingMilestone(seconds: number): string | null {
  const milestoneSeconds = [30, 60, 120, 180, 300];
  for (const milestone of milestoneSeconds) {
    if (seconds === milestone) {
      const messages = recordingMilestones[milestone as keyof typeof recordingMilestones];
      if (messages) {
        return getRandomItem(messages);
      }
    }
  }
  return null;
}

// ============================================
// WARM ERROR MESSAGES
// ============================================
export const warmErrorMessages = {
  tooShort: {
    title: 'That was quick!',
    messages: [
      'Share a bit more so we can create something great.',
      'Let\'s capture more of your thoughts. Record a bit longer?',
      'We\'d love to hear more! Add a few more seconds.',
    ],
  },
  noAudio: {
    title: 'We couldn\'t hear you',
    messages: [
      'Check your mic and speak up. Your voice matters!',
      'Make sure your microphone is working. We want to hear you!',
      'Tap to retry and speak clearly. Your ideas are worth sharing.',
    ],
  },
  recordingError: {
    title: 'Oops, something went wrong',
    messages: [
      'Let\'s try that again. Ready when you are!',
      'Technical hiccup. Give it another go!',
      'Let\'s restart. Your ideas are worth capturing!',
    ],
  },
  permissionDenied: {
    title: 'We need to hear you',
    messages: [
      'VoiceDraft needs microphone access to record your voice.',
      'Please enable microphone access in settings.',
      'We can\'t record without your permission. Check settings!',
    ],
  },
};

/**
 * Get a warm error message for a specific error type
 */
export function getWarmErrorMessage(type: keyof typeof warmErrorMessages): { title: string; message: string } {
  const errorData = warmErrorMessages[type];
  return {
    title: errorData.title,
    message: getRandomItem(errorData.messages),
  };
}

// ============================================
// HERO STATE HELPERS
// ============================================
/**
 * Get a hero message for the empty ready state
 */
export function getHeroMessage(): string {
  return getRandomItem(recordingTips.heroMessages);
}

/**
 * Get a recording hint message
 */
export function getRecordingHint(): string {
  return getRandomItem(recordingTips.recordingHints);
}
