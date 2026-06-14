import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div
      className="markdown-renderer"
      style={{
        color: 'var(--color-text-primary)',
        lineHeight: 1.7,
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <style>{`
        .markdown-renderer h1,
        .markdown-renderer h2,
        .markdown-renderer h3,
        .markdown-renderer h4 {
          color: var(--color-text-primary);
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.3;
        }
        .markdown-renderer h1 { font-size: var(--font-size-xl); border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
        .markdown-renderer h2 { font-size: var(--font-size-lg); }
        .markdown-renderer h3 { font-size: var(--font-size-md); }
        .markdown-renderer p { margin-bottom: 0.8em; }
        .markdown-renderer a { color: var(--color-accent); }
        .markdown-renderer a:hover { color: var(--color-accent-hover); }
        .markdown-renderer blockquote {
          border-left: 3px solid var(--color-accent);
          padding-left: var(--spacing-md);
          color: var(--color-text-secondary);
          margin: var(--spacing-md) 0;
        }
        .markdown-renderer ul,
        .markdown-renderer ol {
          padding-left: 1.5em;
          margin-bottom: 0.8em;
        }
        .markdown-renderer li { margin-bottom: 0.25em; }
        .markdown-renderer table {
          width: 100%;
          border-collapse: collapse;
          margin: var(--spacing-md) 0;
        }
        .markdown-renderer th,
        .markdown-renderer td {
          border: 1px solid var(--color-border);
          padding: var(--spacing-sm) var(--spacing-md);
          text-align: left;
        }
        .markdown-renderer th {
          background: var(--color-bg-secondary);
          font-weight: 600;
        }
        .markdown-renderer img {
          max-width: 100%;
          border-radius: var(--radius-md);
        }
        .markdown-renderer hr {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: var(--spacing-lg) 0;
        }
        .markdown-renderer code {
          background: var(--color-bg-tertiary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.9em;
        }
        .markdown-renderer pre {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          overflow-x: auto;
          margin: var(--spacing-md) 0;
        }
        .markdown-renderer pre code {
          background: none;
          padding: 0;
          border-radius: 0;
        }
        /* KaTeX dark theme adaptation */
        [data-theme='dark'] .markdown-renderer .katex {
          color: var(--color-text-primary);
        }
        [data-theme='dark'] .markdown-renderer .katex-html {
          color: var(--color-text-primary);
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}