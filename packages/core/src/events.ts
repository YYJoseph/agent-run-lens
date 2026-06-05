export const traceEventTypes = [
  "run_started",
  "user_prompt",
  "model_message",
  "decision",
  "tool_call_started",
  "tool_call_completed",
  "shell_command",
  "file_read",
  "file_patch",
  "test_result",
  "error",
  "retry",
  "run_completed"
] as const;

export type KnownTraceEventType = (typeof traceEventTypes)[number];
export type TraceEventType = KnownTraceEventType | (string & {});
export type TraceStatus = "started" | "success" | "error" | "skipped";

export type TraceEvent = {
  id: string;
  runId: string;
  timestamp: string;
  type: TraceEventType;
  status?: TraceStatus;
  durationMs?: number;
  summary?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function isOptionalStatus(value: unknown): value is TraceStatus | undefined {
  return (
    value === undefined ||
    value === "started" ||
    value === "success" ||
    value === "error" ||
    value === "skipped"
  );
}

export function isTraceEvent(value: unknown): value is TraceEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.runId === "string" &&
    typeof value.timestamp === "string" &&
    typeof value.type === "string" &&
    isOptionalStatus(value.status) &&
    isOptionalNumber(value.durationMs) &&
    isOptionalString(value.summary) &&
    (value.metadata === undefined || isRecord(value.metadata))
  );
}

export function parseTraceEvent(value: unknown): TraceEvent {
  if (!isTraceEvent(value)) {
    throw new Error("Invalid trace event: expected id, runId, timestamp, and type.");
  }

  return value;
}
