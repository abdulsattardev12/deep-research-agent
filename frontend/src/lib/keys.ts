import type { ApiKeys } from "@/types";

const STORAGE_KEY = "deep_research_api_keys";

export function loadApiKeys(): ApiKeys {
  if (typeof window === "undefined") {
    return { openaiApiKey: "", firecrawlApiKey: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { openaiApiKey: "", firecrawlApiKey: "" };
    const parsed = JSON.parse(raw) as ApiKeys;
    return {
      openaiApiKey: parsed.openaiApiKey || "",
      firecrawlApiKey: parsed.firecrawlApiKey || "",
    };
  } catch {
    return { openaiApiKey: "", firecrawlApiKey: "" };
  }
}

export function saveApiKeys(keys: ApiKeys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function clearApiKeys() {
  localStorage.removeItem(STORAGE_KEY);
}
