'use client';

import { useFontSize, getProseClass } from './FontSizeControls';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const { fontSize } = useFontSize();
  const proseClass = getProseClass(fontSize);

  return (
    <div className={`${proseClass} prose-neutral dark:prose-invert max-w-none`}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
