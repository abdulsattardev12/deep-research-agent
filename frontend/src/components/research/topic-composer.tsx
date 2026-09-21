"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXAMPLE_TOPICS = [
  "Latest developments in quantum computing",
  "Impact of climate change on marine ecosystems",
  "Advancements in renewable energy storage",
  "Ethical considerations in artificial intelligence",
];

interface TopicComposerProps {
  topic: string;
  onTopicChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  keysReady: boolean;
}

export function TopicComposer({
  topic,
  onTopicChange,
  onSubmit,
  disabled,
  keysReady,
}: TopicComposerProps) {
  return (
    <div className="w-full max-w-2xl">
      <label htmlFor="topic" className="sr-only">
        Research topic
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="topic"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !disabled) onSubmit();
            }}
            placeholder="What should we research?"
            className="pl-11"
            disabled={disabled}
          />
        </div>
        <Button size="lg" onClick={onSubmit} disabled={disabled || !topic.trim() || !keysReady}>
          Start Research
        </Button>
      </div>

      {!keysReady ? (
        <p className="mt-3 text-sm text-amber-800/90">
          Add your API keys in Settings before starting research.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLE_TOPICS.map((example) => (
          <button
            key={example}
            type="button"
            disabled={disabled}
            onClick={() => onTopicChange(example)}
            className="rounded-full border border-slate-300/80 bg-white/70 px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition hover:border-blue-800/40 hover:bg-white hover:text-blue-900 disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
