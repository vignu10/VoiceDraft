'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  maxTags?: number;
  className?: string;
}

export function TagsInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
  maxLength = 50,
  maxTags = 10,
  className,
}: TagsInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(tags.slice(0, -1));
    }
  };

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (
      trimmed &&
      !tags.includes(trimmed) &&
      tags.length < maxTags &&
      trimmed.length <= maxLength
    ) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 p-2',
        'border border-neutral-200 dark:border-neutral-800 rounded-lg',
        'bg-white dark:bg-neutral-900',
        'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent',
        'transition-colors duration-200',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Existing Tags */}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium group"
        >
          <Tag className="w-3 h-3" />
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="ml-0.5 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors"
            aria-label={`Remove tag: ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        maxLength={maxLength}
        disabled={tags.length >= maxTags}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 disabled:opacity-50"
      />

      {/* Tag Count */}
      {tags.length > 0 && (
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {tags.length}/{maxTags}
        </span>
      )}
    </div>
  );
}
