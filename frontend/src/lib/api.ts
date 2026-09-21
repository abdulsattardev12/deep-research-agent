import type {
  HealthResponse,
  ResearchRequest,
  ResearchResponse,
  StreamHandlers,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ");
    }
    return data?.message || res.statusText || "Request failed";
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function runResearch(payload: ResearchRequest): Promise<ResearchResponse> {
  const res = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function streamResearch(
  payload: ResearchRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/research/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  if (!res.body) {
    throw new Error("Streaming is not supported by this browser");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  const dispatch = (event: string, rawData: string) => {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      return;
    }

    switch (event) {
      case "stage":
        if (typeof data.stage === "string") handlers.onStage?.(data.stage);
        break;
      case "activity":
        handlers.onActivity?.({
          type: String(data.type ?? "info"),
          message: String(data.message ?? ""),
        });
        break;
      case "initial_report":
        if (typeof data.content === "string") handlers.onInitialReport?.(data.content);
        break;
      case "complete":
        handlers.onComplete?.(data as unknown as ResearchResponse);
        break;
      case "error":
        handlers.onError?.(String(data.message ?? "Research failed"));
        break;
      default:
        break;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const lines = part.split("\n");
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLine += line.slice(5).trim();
        }
      }
      if (dataLine) {
        dispatch(currentEvent, dataLine);
        currentEvent = "message";
      }
    }
  }
}

export { API_BASE };
