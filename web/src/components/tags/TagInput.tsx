'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import { useTagStore, DEFAULT_COLORS } from '@/stores/tag-store';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  selectedTags,
  onTagsChange,
  placeholder = 'Add tags...',
  maxTags = 10,
}: TagInputProps) {
  const { tags, createTag } = useTagStore();
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[6]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTagObjects = tags.filter((t) => selectedTags.includes(t.id));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = tags.filter(
    (tag) =>
      !selectedTags.includes(tag.id) &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleAddTag = async (tagId: string) => {
    if (selectedTags.length >= maxTags) return;
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim() || selectedTags.length >= maxTags) return;

    try {
      const newTag = await createTag(inputValue.trim(), selectedColor);
      onTagsChange([...selectedTags, newTag.id]);
      setInputValue('');
      setShowDropdown(false);
      setShowColorPicker(false);
      setSelectedColor(DEFAULT_COLORS[6]);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected tags display */}
      <div className="flex flex-wrap items-center gap-2 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 min-h-[50px]">
        {selectedTagObjects.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          disabled={selectedTags.length >= maxTags}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (filteredTags.length > 0 || inputValue) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-60 overflow-auto">
          {/* Existing tags */}
          {filteredTags.length > 0 && (
            <div className="p-2">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag.id)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {tag.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Create new tag option */}
          {inputValue && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-2">
              <button
                type="button"
                onClick={handleCreateTag}
                className="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    Create "{inputValue.trim()}"
                  </span>
                </div>

                {/* Color picker */}
                <div className="flex gap-1.5 mt-2 ml-6">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-5 h-5 rounded-full transition-transform hover:scale-110',
                        selectedColor === color && 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </button>
            </div>
          )}

          {filteredTags.length === 0 && !inputValue && (
            <div className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No tags found. Type to create one.
            </div>
          )}
        </div>
      )}

      {/* Max tags warning */}
      {selectedTags.length >= maxTags && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}

// Simple tag display component (read-only)
export function TagList({ tagIds }: { tagIds: string[] }) {
  const { tags } = useTagStore();
  const tagObjects = tags.filter((t) => tagIds.includes(t.id));

  if (tagObjects.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tagObjects.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
