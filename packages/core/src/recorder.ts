import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { appendTraceEvent } from "./jsonl.js";
import type { TraceEvent, TraceEventType, TraceStatus } from "./events.js";

export type CreateRecorderOptions = {
  runName: string;
  outputPath: string;
};

export type RecordEventInput = {
  type: TraceEventType;
  status?: TraceStatus;
  durationMs?: number;
  summary?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
};

export type Recorder = {
  runId: string;
  outputPath: string;
  record(event: RecordEventInput): Promise<TraceEvent>;
  end(result: { status: "success" | "error"; summary?: string }): Promise<TraceEvent>;
};

let runCounter = 0;

function nextRunId(): string {
  runCounter += 1;
  return `run_${Date.now()}_${runCounter}`;
}

function nextEventId(index: number): string {
  return `event_${String(index).padStart(4, "0")}`;
}

export async function createRecorder(options: CreateRecorderOptions): Promise<Recorder> {
  const runId = nextRunId();
  let eventIndex = 0;

  async function write(input: RecordEventInput): Promise<TraceEvent> {
    eventIndex += 1;
    const event: TraceEvent = {
      id: nextEventId(eventIndex),
      runId,
      timestamp: new Date().toISOString(),
      type: input.type,
      status: input.status,
      durationMs: input.durationMs,
      summary: input.summary,
      input: input.input,
      output: input.output,
      metadata: input.metadata
    };

    await appendTraceEvent(options.outputPath, event);
    return event;
  }

  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, "", "utf8");

  await write({
    type: "run_started",
    status: "started",
    summary: options.runName,
    metadata: { runName: options.runName }
  });

  return {
    runId,
    outputPath: options.outputPath,
    record: write,
    end(result) {
      return write({
        type: "run_completed",
        status: result.status,
        summary: result.summary ?? `Run completed with status ${result.status}`
      });
    }
  };
}
