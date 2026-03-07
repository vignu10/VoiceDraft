'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MarkdownRendererProps } from '@/types/blog-post';
import { useTheme } from 'next-themes';

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={{
        // Headings with anchor links
        h1: ({ children, id }) => (
          <h1 id={id} className="scroll-mt-20 text-4xl font-bold text-neutral-900 dark:text-white">
            {children}
          </h1>
        ),
        h2: ({ children, id }) => (
          <h2 id={id} className="scroll-mt-20 mt-12 mb-4 text-3xl font-semibold text-neutral-900 dark:text-white">
            {children}
          </h2>
        ),
        h3: ({ children, id }) => (
          <h3 id={id} className="scroll-mt-20 mt-8 mb-3 text-2xl font-semibold text-neutral-900 dark:text-white">
            {children}
          </h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed text-neutral-700 dark:text-neutral-300">
            {children}
          </p>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-accent hover:underline"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-2 text-neutral-700 dark:text-neutral-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-2 text-neutral-700 dark:text-neutral-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-neutral-700 dark:text-neutral-300">{children}</li>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-accent pl-4 italic text-neutral-600 dark:text-neutral-400">
            {children}
          </blockquote>
        ),
        // Code blocks with syntax highlighting
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          if (language) {
            return (
              <div className="group relative mb-4">
                <SyntaxHighlighter
                  language={language}
                  style={(isDark ? vscDarkPlus : vs) as any}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
                <button
                  onClick={() => navigator.clipboard.writeText(String(children))}
                  className="absolute right-2 top-2 rounded bg-neutral-700 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Copy code"
                >
                  Copy
                </button>
              </div>
            );
          }

          return (
            <code
              className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="my-4 rounded-lg"
            loading="lazy"
          />
        ),
        // Horizontal rule
        hr: () => <hr className="my-8 border-neutral-300 dark:border-neutral-700" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
