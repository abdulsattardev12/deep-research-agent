"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/types";

const STAGES = [
  { id: "researching", label: "Searching" },
  { id: "synthesizing", label: "Synthesizing" },
  { id: "elaborating", label: "Elaborating" },
] as const;

function resolveActiveIndex(stage: string): number {
  if (stage === "elaborating") return 2;
  if (stage === "researching") return 0;
  if (stage === "done") return 3;
  // Mid research: show synthesizing as second beat while still researching
  return 1;
}

interface ResearchProgressProps {
  stage: string;
  activities: ActivityEvent[];
}

export function ResearchProgress({ stage, activities }: ResearchProgressProps) {
  const activeIndex =
    stage === "researching" && activities.length > 2
      ? 1
      : resolveActiveIndex(stage);
  const recent = activities.slice(-8).reverse();

  return (
    <div className="w-full max-w-2xl animate-fade-up">
      <div className="flex items-center gap-2 sm:gap-3">
        {STAGES.map((s, i) => {
          const done = activeIndex > i || stage === "done";
          const current = activeIndex === i && stage !== "done";
          return (
            <div key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                  done && "border-blue-800 bg-blue-800 text-white",
                  current && "border-blue-800 bg-accent-soft text-blue-900 animate-pulse-soft",
                  !done && !current && "border-slate-300 bg-white text-slate-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  current || done ? "text-slate-800" : "text-slate-400",
                )}
              >
                {s.label}
              </span>
              {i < STAGES.length - 1 ? (
                <div
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    done ? "bg-blue-800/50" : "bg-slate-300",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin text-blue-800" />
        <span>
          {stage === "elaborating"
            ? "Enhancing the report with deeper context…"
            : "Scanning the web and synthesizing findings…"}
        </span>
      </div>

      {recent.length > 0 ? (
        <ul className="mt-5 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/60 p-4 backdrop-blur-sm">
          {recent.map((item, idx) => (
            <li
              key={`${item.message}-${idx}`}
              className="flex gap-2 text-xs leading-relaxed text-slate-600"
            >
              <span className="shrink-0 font-semibold uppercase tracking-wide text-blue-800/80">
                {item.type}
              </span>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
