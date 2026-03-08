'use client';

import { TableOfContents, useActiveHeading } from '@/components/blog-post/TableOfContents';
import type { Heading } from '@/types/blog-post';

interface TableOfContentsWrapperProps {
  headings: Heading[];
  urlPrefix: string;
}

export function TableOfContentsWrapper({ headings, urlPrefix }: TableOfContentsWrapperProps) {
  const activeId = useActiveHeading(headings);
  return <TableOfContents headings={headings} activeId={activeId} urlPrefix={urlPrefix} />;
}
