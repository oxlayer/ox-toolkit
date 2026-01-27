"use client";

import { Kbd } from "./kbd";
import { CodeBlock, CodeBlockCopyButton, CodeBlockDownloadButton } from "./code-block";
import { cn } from "../../lib/utils";
import { type ComponentProps, memo } from "react";
import type { Components } from "react-markdown";
import { Streamdown } from "streamdown";

type MarkdownProps = ComponentProps<typeof Streamdown>;

/**
 * Custom components for Streamdown to match workbench typography styles
 * Uses Tailwind design tokens from main.css:
 * - Base: text-xs/relaxed (12px)
 * - Large: text-sm/relaxed (14px)
 * - XL: text-base/relaxed (16px)
 */
const workbenchComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="text-xs leading-relaxed my-4 first:mt-0 last:mb-0" {...props}>
      {children}
    </p>
  ),
  // Headings with VS Code/Cursor markdown styling
  h1: ({ children, ...props }) => (
    <h1
      className="text-2xl font-semibold leading-tight mt-8 mb-2 pb-2 border-b border-border first:mt-0"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-xl font-semibold leading-tight mt-6 mb-2 pb-2 border-b border-border first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-semibold leading-tight mt-5 mb-2 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-semibold leading-tight mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-sm font-semibold leading-tight mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-xs font-semibold leading-tight mt-4 mb-2 text-muted-foreground first:mt-0"
      {...props}
    >
      {children}
    </h6>
  ),
  // Lists: Improved spacing and indentation
  ul: ({ children, ...props }) => (
    <ul className="text-xs leading-relaxed my-4 ml-8 list-disc first:mt-0 last:mb-0" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="text-xs leading-relaxed my-4 ml-8 list-decimal first:mt-0 last:mb-0" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-xs leading-relaxed my-1" {...props}>
      {children}
    </li>
  ),
  // Blockquotes: VS Code style with background and border
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="text-xs leading-relaxed my-4 border-l-4 border-foreground/20 pl-4 pr-4 py-2 bg-muted/50 italic first:mt-0 last:mb-0"
      {...props}
    >
      {children}
    </blockquote>
  ),
  // Links: Improved styling
  a: ({ children, href, ...props }) => (
    <a
      className="text-xs leading-relaxed text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
      href={href}
      {...props}
    >
      {children}
    </a>
  ),
  // Code: Handle both inline code and code blocks
  // Following Streamdown's pattern: check node position to distinguish
  // Inline code: start.line === end.line, Code blocks: start.line !== end.line
  code: ({ node, className, children, ...props }) => {
    const position = (node as any)?.position as
      | {
          start?: { line?: number; column?: number };
          end?: { line?: number; column?: number };
        }
      | undefined;
    const inline = position?.start?.line === position?.end?.line;
    if (inline) {
      return <Kbd {...props}>{children}</Kbd>;
    }
    const match = /language-(\w+)/.exec(className || "");
    const language = (match?.[1] || "plaintext") as import("shiki").BundledLanguage;
    const code = String(children).replace(/\n$/, "");
    return (
      <CodeBlock code={code} language={language}>
        <CodeBlockCopyButton />
        <CodeBlockDownloadButton language={language} />
      </CodeBlock>
    );
  },
  // Pre blocks: block-level wrapper for code blocks to ensure proper layout
  pre: ({ children }) => <div className="my-4 first:mt-0 last:mb-0">{children}</div>,
  // Strong: Improved styling
  strong: ({ children, ...props }) => (
    <strong className="text-xs leading-relaxed font-semibold" {...props}>
      {children}
    </strong>
  ),
  // Emphasis: Improved styling
  em: ({ children, ...props }) => (
    <em className="text-xs leading-relaxed italic" {...props}>
      {children}
    </em>
  ),
  // Tables: VS Code markdown table styling
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto first:mt-0 last:mb-0">
      <table className="text-xs leading-relaxed border-collapse w-full" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="text-xs leading-relaxed" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="text-xs leading-relaxed" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="text-xs leading-relaxed border-b border-border even:bg-muted/30" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="text-xs leading-relaxed font-semibold p-3 text-left bg-muted/50" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="text-xs leading-relaxed p-3" {...props}>
      {children}
    </td>
  ),
  // Horizontal rule: VS Code style
  hr: ({ ...props }) => (
    <hr className="my-6 border-0 border-t border-border first:mt-0 last:mb-0" {...props} />
  ),
  // Images: Responsive styling
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto my-4 rounded-md first:mt-0 last:mb-0"
      {...props}
    />
  ),
};

export const Markdown = memo(
  ({ className, components, ...props }: MarkdownProps) => (
    <Streamdown
      className={cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      components={{ ...workbenchComponents, ...components }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Markdown.displayName = "Markdown";
