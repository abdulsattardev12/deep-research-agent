"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownReport({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown-report", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-0 mb-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-tight text-slate-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-3 border-b border-slate-200 pb-2 font-[family-name:var(--font-fraunces)] text-lg font-semibold text-slate-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-base font-semibold text-slate-800">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 text-[15px] leading-relaxed text-slate-700">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[15px] text-slate-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[15px] text-slate-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-800 underline decoration-blue-800/30 underline-offset-2 hover:decoration-blue-800"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-100 text-slate-800">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-100 px-3 py-2.5 align-top text-slate-700">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-blue-800/35 bg-blue-50/60 px-4 py-3 text-sm text-slate-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-slate-200" />,
          code: ({ children, className: codeClass }) => {
            const isBlock = Boolean(codeClass);
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] text-slate-800">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
