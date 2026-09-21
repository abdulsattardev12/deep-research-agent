export type ResearchStage = "idle" | "researching" | "elaborating" | "done";

export type AppStatus = "idle" | "running" | "done" | "error";

export interface ApiKeys {
  openaiApiKey: string;
  firecrawlApiKey: string;
}

export interface HealthResponse {
  status: string;
  openai_configured: boolean;
  firecrawl_configured: boolean;
}

export interface ResearchRequest {
  topic: string;
  openai_api_key?: string;
  firecrawl_api_key?: string;
  max_depth?: number;
  time_limit?: number;
  max_urls?: number;
}

export interface ResearchResponse {
  topic: string;
  initial_report: string;
  enhanced_report: string;
  sources: unknown[];
  status: "success";
}

export interface ActivityEvent {
  type: string;
  message: string;
}

export interface StreamHandlers {
  onStage?: (stage: string) => void;
  onActivity?: (activity: ActivityEvent) => void;
  onInitialReport?: (content: string) => void;
  onComplete?: (result: ResearchResponse) => void;
  onError?: (message: string) => void;
}
