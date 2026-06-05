import { parseTraceEvent, type TraceEvent } from "../../../packages/core/src/events.js";
import { summarizeTrace, type TraceSummary } from "../../../packages/core/src/summary.js";

export type TraceModel = {
  events: TraceEvent[];
  summary: TraceSummary;
  firstFailure: TraceEvent | null;
  filePatches: TraceEvent[];
};

export function parseTraceText(text: string): TraceModel {
  const events: TraceEvent[] = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim() === "") {
      continue;
    }

    try {
      events.push(parseTraceEvent(JSON.parse(line)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid trace line ${index + 1}: ${message}`);
    }
  }

  const summary = summarizeTrace(events);
  const firstFailure = events.find((event) => event.id === summary.firstFailureEventId) ?? null;
  const filePatches = events.filter((event) => event.type === "file_patch");

  return { events, summary, firstFailure, filePatches };
}
