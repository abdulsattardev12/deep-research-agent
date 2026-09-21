"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Settings } from "lucide-react";
import { ReportView } from "@/components/research/report-view";
import { ResearchProgress } from "@/components/research/research-progress";
import { TopicComposer } from "@/components/research/topic-composer";
import { checkHealth, streamResearch } from "@/lib/api";
import { loadApiKeys } from "@/lib/keys";
import type { ActivityEvent, ApiKeys, AppStatus, ResearchResponse } from "@/types";

export function ResearchApp() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [stage, setStage] = useState("idle");
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [initialReport, setInitialReport] = useState<string | null>(null);
  const [enhancedReport, setEnhancedReport] = useState<string | null>(null);
  const [completedTopic, setCompletedTopic] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeys>({ openaiApiKey: "", firecrawlApiKey: "" });
  const [envReady, setEnvReady] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setKeys(loadApiKeys());
    checkHealth()
      .then((h) => setEnvReady(h.openai_configured && h.firecrawl_configured))
      .catch(() => setEnvReady(false));

    const onFocus = () => setKeys(loadApiKeys());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const keysReady =
    Boolean(keys.openaiApiKey && keys.firecrawlApiKey) || Boolean(envReady);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setStage("idle");
    setActivities([]);
    setInitialReport(null);
    setEnhancedReport(null);
    setCompletedTopic("");
    setErrorMessage(null);
  }, []);

  const startResearch = useCallback(async () => {
    const trimmed = topic.trim();
    if (!trimmed || status === "running") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("running");
    setStage("researching");
    setActivities([]);
    setInitialReport(null);
    setEnhancedReport(null);
    setCompletedTopic("");
    setErrorMessage(null);

    let completed = false;
    try {
      await streamResearch(
        {
          topic: trimmed,
          openai_api_key: keys.openaiApiKey || undefined,
          firecrawl_api_key: keys.firecrawlApiKey || undefined,
        },
        {
          onStage: (s) => setStage(s),
          onActivity: (a) => setActivities((prev) => [...prev, a]),
          onInitialReport: (content) => setInitialReport(content),
          onComplete: (result: ResearchResponse) => {
            completed = true;
            setInitialReport(result.initial_report);
            setEnhancedReport(result.enhanced_report);
            setCompletedTopic(result.topic);
            setStage("done");
            setStatus("done");
          },
          onError: (message) => {
            setErrorMessage(message);
            setStatus("error");
          },
        },
        controller.signal,
      );
      if (!completed && !controller.signal.aborted) {
        setErrorMessage("Research ended without a final report");
        setStatus("error");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage(err instanceof Error ? err.message : "Research failed");
      setStatus("error");
    }
  }, [keys.firecrawlApiKey, keys.openaiApiKey, status, topic]);

  const showComposer = status === "idle" || status === "error";
  const showProgress = status === "running";
  const showReport = status === "done" && enhancedReport;

  return (
    <div className="atmosphere relative min-h-screen overflow-hidden">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-70" />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-tight text-slate-900">
          Deep Research
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-3.5 py-2 text-sm font-medium text-slate-700 backdrop-blur transition hover:border-blue-800/40 hover:text-blue-900"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center px-5 pb-16 sm:px-8">
        {showComposer ? (
          <section className="flex w-full flex-1 flex-col items-center justify-center pt-6 pb-20 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
              OpenAI Agents · Firecrawl
            </p>
            <h1 className="max-w-xl font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Deep Research
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
              Ask a question. We search the web, synthesize sources, and deliver an enhanced
              research report you can download.
            </p>

            <div className="mt-10 w-full flex justify-center">
              <TopicComposer
                topic={topic}
                onTopicChange={setTopic}
                onSubmit={startResearch}
                keysReady={keysReady}
              />
            </div>

            {errorMessage ? (
              <div className="mt-6 flex max-w-2xl items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </section>
        ) : null}

        {showProgress ? (
          <section className="flex w-full flex-1 flex-col items-center justify-center py-12">
            <p className="mb-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              Researching
            </p>
            <p className="mb-8 max-w-lg text-center text-sm text-slate-600">{topic}</p>
            <ResearchProgress stage={stage} activities={activities} />
          </section>
        ) : null}

        {showReport ? (
          <section className="w-full py-8">
            <ReportView
              topic={completedTopic || topic}
              enhancedReport={enhancedReport}
              initialReport={initialReport}
              onReset={reset}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
