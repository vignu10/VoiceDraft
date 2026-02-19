import { apiClient } from './client';
import type { Journal, Style, CreateJournalData, UpdateJournalData } from '@/types/journal';

export async function getJournal(): Promise<Journal | null> {
  const response = await apiClient.get<Journal>('/api/journal');

  if (!response.success) {
    // Return null if journal doesn't exist
    if (response.error?.includes('not found') || response.error?.includes('No journal found')) {
      return null;
    }
    throw new Error(response.error || 'Failed to fetch journal');
  }

  return response.data || null;
}

export async function createJournal(data?: CreateJournalData): Promise<Journal> {
  const response = await apiClient.put<Journal>('/api/journal', data || {});

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create journal');
  }

  return response.data;
}

export async function updateJournal(data: UpdateJournalData): Promise<Journal> {
  const response = await apiClient.put<Journal>('/api/journal', data);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update journal');
  }

  return response.data;
}

export async function updateStyles(styles: Style[]): Promise<Journal> {
  const response = await apiClient.put<Journal>('/api/journal/styles', { styles });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update styles');
  }

  return response.data;
}

/**
 * Ensures a journal exists for the current user.
 * Creates one if it doesn't exist.
 */
export async function ensureJournalExists(): Promise<Journal> {
  let journal = await getJournal();

  if (!journal) {
    journal = await createJournal();
  }

  return journal;
}
