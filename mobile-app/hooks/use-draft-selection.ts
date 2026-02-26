/**
 * useDraftSelection Hook
 *
 * Manages selection state, select all/deselect logic for the library screen.
 * Extracted from library.tsx (lines 42-143, 279-288).
 */

import { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';

export interface UseDraftSelectionReturn {
  selectedIds: Set<string>;
  isSelectMode: boolean;
  selectedCount: number;
  isAllSelected: boolean;
  selectAllText: string;
  startSelectMode: () => void;
  exitSelectMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deleteSelected: (callback: () => Promise<void>) => Promise<void>;
}

/**
 * Hook for managing draft selection state
 *
 * @param allDraftIds - Array of all draft IDs for select all functionality
 * @param filteredDraftIds - Array of filtered draft IDs
 * @returns Selection state and operations
 */
export function useDraftSelection(
  allDraftIds: string[],
  filteredDraftIds: string[]
): UseDraftSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const selectedCount = selectedIds.size;
  const isAllSelected = filteredDraftIds.length > 0 && selectedCount === filteredDraftIds.length;
  const selectAllText = isAllSelected ? 'Deselect All' : 'Select All';

  /**
   * Toggle selection mode on
   */
  const startSelectMode = useCallback(() => {
    setIsSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  /**
   * Exit selection mode and clear selection
   */
  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  /**
   * Toggle selection for a single draft
   */
  const toggleSelection = useCallback(
    (id: string) => {
      if (!isSelectMode) return;

      setSelectedIds((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return newSelection;
      });
    },
    [isSelectMode]
  );

  /**
   * Select or deselect all filtered drafts
   */
  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = filteredDraftIds.length > 0 && filteredDraftIds.every((id) => prev.has(id));
      return allSelected ? new Set<string>() : new Set(filteredDraftIds);
    });
  }, [filteredDraftIds]);

  /**
   * Delete selected drafts after confirmation
   */
  const deleteSelected = useCallback(
    async (callback: () => Promise<void>) => {
      if (selectedIds.size === 0) return;
      await callback();
      exitSelectMode();
    },
    [selectedIds.size, exitSelectMode]
  );

  return {
    selectedIds,
    isSelectMode,
    selectedCount,
    isAllSelected,
    selectAllText,
    startSelectMode,
    exitSelectMode,
    toggleSelection,
    selectAll,
    deleteSelected,
  };
}
