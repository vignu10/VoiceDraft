/**
 * VoiceDraft Achievements Store
 * Tracks user milestones and achievements for delightful moments
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

interface AchievementsState {
  // Stats
  totalDrafts: number;
  totalWords: number;
  draftsPublished: number;
  firstDraftCreated: boolean;
  longestRecording: number; // in seconds
  totalRecordingTime: number; // in seconds

  // Milestones reached
  milestonesReached: number[];

  // Actions
  recordDraftCreated: () => void;
  recordWordsWritten: (wordCount: number) => void;
  recordDraftPublished: () => void;
  recordRecording: (duration: number) => void;

  // Getters
  getAchievements: () => Achievement[];
  getNextMilestone: () => number | null;
  hasUnlockedMilestone: (milestone: number) => boolean;
}

const MILESTONES = [100, 500, 1000, 5000, 10000];

const getAllAchievements = (state: AchievementsState): Achievement[] => {
  const achievements: Achievement[] = [];

  // First draft achievement
  if (state.firstDraftCreated) {
    achievements.push({
      id: 'first-draft',
      title: 'First Steps',
      description: 'Created your first draft',
      icon: 'footprint',
      unlockedAt: new Date(),
    });
  }

  // Word count milestones
  for (const milestone of MILESTONES) {
    if (state.milestonesReached.includes(milestone)) {
      achievements.push({
        id: `words-${milestone}`,
        title: `${milestone} Words`,
        description: `Wrote ${milestone} total words across all drafts`,
        icon: milestone >= 1000 ? 'trophy' : 'star',
        unlockedAt: new Date(),
      });
    } else if (state.totalWords < milestone) {
      // In progress
      achievements.push({
        id: `words-${milestone}`,
        title: `${milestone} Words`,
        description: `Write ${milestone} total words`,
        icon: milestone >= 1000 ? 'trophy' : 'star',
        progress: state.totalWords,
        target: milestone,
      });
    }
  }

  // Publishing milestones
  if (state.draftsPublished >= 1) {
    achievements.push({
      id: 'first-published',
      title: 'Published Author',
      description: 'Published your first draft',
      icon: 'send',
      unlockedAt: new Date(),
    });
  }

  if (state.draftsPublished >= 5) {
    achievements.push({
      id: 'prolific-publisher',
      title: 'Prolific Publisher',
      description: 'Published 5 drafts',
      icon: 'ribbon',
      unlockedAt: new Date(),
    });
  }

  // Volume achievements
  if (state.totalDrafts >= 10) {
    achievements.push({
      id: 'dedicated-creator',
      title: 'Dedicated Creator',
      description: 'Created 10 drafts',
      icon: 'flame',
      unlockedAt: new Date(),
    });
  }

  if (state.totalRecordingTime >= 3600) {
    // 1 hour
    achievements.push({
      id: 'voice-veteran',
      title: 'Voice Veteran',
      description: 'Recorded for 1 hour total',
      icon: 'mic',
      unlockedAt: new Date(),
    });
  }

  return achievements;
};

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      // Initial state
      totalDrafts: 0,
      totalWords: 0,
      draftsPublished: 0,
      firstDraftCreated: false,
      longestRecording: 0,
      totalRecordingTime: 0,
      milestonesReached: [],

      // Actions
      recordDraftCreated: () => {
        set((state) => ({
          totalDrafts: state.totalDrafts + 1,
          firstDraftCreated: true,
        }));
      },

      recordWordsWritten: (wordCount) => {
        set((state) => {
          const newTotal = state.totalWords + wordCount;
          const newMilestones = [...state.milestonesReached];

          // Check for new milestones
          for (const milestone of MILESTONES) {
            if (newTotal >= milestone && !state.milestonesReached.includes(milestone)) {
              newMilestones.push(milestone);
            }
          }

          return {
            totalWords: newTotal,
            milestonesReached: newMilestones,
          };
        });
      },

      recordDraftPublished: () => {
        set((state) => ({
          draftsPublished: state.draftsPublished + 1,
        }));
      },

      recordRecording: (duration) => {
        set((state) => ({
          longestRecording: Math.max(state.longestRecording, duration),
          totalRecordingTime: state.totalRecordingTime + duration,
        }));
      },

      // Getters
      getAchievements: () => {
        return getAllAchievements(get());
      },

      getNextMilestone: () => {
        const state = get();
        for (const milestone of MILESTONES) {
          if (state.totalWords < milestone) {
            return milestone;
          }
        }
        return null;
      },

      hasUnlockedMilestone: (milestone) => {
        return get().milestonesReached.includes(milestone);
      },
    }),
    {
      name: 'voicedraft-achievements',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to check if a specific word count milestone was just reached
 */
export function useMilestoneChecker(currentWordCount: number): number | null {
  const milestones = useAchievementsStore((state) => state.milestonesReached);

  // Check if currentWordCount is a milestone that wasn't previously reached
  if (MILESTONES.includes(currentWordCount) && !milestones.includes(currentWordCount)) {
    return currentWordCount;
  }

  return null;
}
