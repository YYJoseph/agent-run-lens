import type { TraceEvent, TraceStatus } from "./events.js";

export type TraceSummary = {
  runId: string | null;
  eventCount: number;
  failureCount: number;
  retryCount: number;
  filePatchCount: number;
  firstFailureEventId: string | null;
  finalStatus: TraceStatus | null;
};

export function summarizeTrace(events: TraceEvent[]): TraceSummary {
  const firstFailure = events.find((event) => event.status === "error" || event.type === "error");
  const completion = [...events].reverse().find((event) => event.type === "run_completed");

  return {
    runId: events[0]?.runId ?? null,
    eventCount: events.length,
    failureCount: events.filter((event) => event.status === "error" || event.type === "error").length,
    retryCount: events.filter((event) => event.type === "retry").length,
    filePatchCount: events.filter((event) => event.type === "file_patch").length,
    firstFailureEventId: firstFailure?.id ?? null,
    finalStatus: completion?.status ?? null
  };
}
