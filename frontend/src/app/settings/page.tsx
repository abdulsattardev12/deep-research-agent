"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearApiKeys, loadApiKeys, saveApiKeys } from "@/lib/keys";
import type { ApiKeys } from "@/types";

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>({ openaiApiKey: "", firecrawlApiKey: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeys(loadApiKeys());
  }, []);

  return (
    <div className="atmosphere min-h-screen">
      <div className="mx-auto max-w-xl px-5 py-10 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </Link>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-slate-900">
                API key settings
              </h1>
              <p className="text-sm text-slate-500">
                Stored in your browser for local demos. Server env vars are preferred.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="openai" className="text-sm font-medium text-slate-800">
                OpenAI API Key
              </label>
              <Input
                id="openai"
                type="password"
                className="mt-1.5"
                value={keys.openaiApiKey}
                onChange={(e) => setKeys((k) => ({ ...k, openaiApiKey: e.target.value }))}
                placeholder="sk-..."
              />
            </div>
            <div>
              <label htmlFor="firecrawl" className="text-sm font-medium text-slate-800">
                Firecrawl API Key
              </label>
              <Input
                id="firecrawl"
                type="password"
                className="mt-1.5"
                value={keys.firecrawlApiKey}
                onChange={(e) => setKeys((k) => ({ ...k, firecrawlApiKey: e.target.value }))}
                placeholder="fc-..."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                saveApiKeys(keys);
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              Save keys
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clearApiKeys();
                setKeys({ openaiApiKey: "", firecrawlApiKey: "" });
                setSaved(false);
              }}
            >
              Clear
            </Button>
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Saved locally
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            Keys stay in browser localStorage and are sent with research requests when present. For
            production, set{" "}
            <code className="rounded bg-slate-100 px-1">OPENAI_API_KEY</code> and{" "}
            <code className="rounded bg-slate-100 px-1">FIRECRAWL_API_KEY</code> on the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
