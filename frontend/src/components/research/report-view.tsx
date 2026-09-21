"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy, Download, RotateCcw } from "lucide-react";
import { MarkdownReport } from "@/components/research/markdown-report";
import { Button } from "@/components/ui/button";
import { copyToClipboard, downloadMarkdown, slugifyTopic } from "@/lib/utils";

interface ReportViewProps {
  topic: string;
  enhancedReport: string;
  initialReport: string | null;
  onReset: () => void;
}

export function ReportView({ topic, enhancedReport, initialReport, onReset }: ReportViewProps) {
  const [copied, setCopied] = useState(false);
  const [showInitial, setShowInitial] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(enhancedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = () => {
    downloadMarkdown(`${slugifyTopic(topic) || "research"}_report.md`, enhancedReport);
  };

  return (
    <div className="w-full max-w-3xl animate-fade-up">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800/80">
            Enhanced report
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-slate-900">
            {topic}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            New research
          </Button>
        </div>
      </div>

      <article className="rounded-3xl border border-slate-200/90 bg-white px-6 py-8 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] sm:px-10 sm:py-10">
        <MarkdownReport content={enhancedReport} />
      </article>

      {initialReport ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowInitial((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            <span>View initial research report</span>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${showInitial ? "rotate-180" : ""}`}
            />
          </button>
          {showInitial ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-5 py-6">
              <MarkdownReport content={initialReport} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
