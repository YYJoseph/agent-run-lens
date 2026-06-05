import { describe, expect, it } from "vitest";
import { parseTraceText } from "./trace-model.js";

describe("trace model", () => {
  it("parses newline-delimited trace text and marks the first failure", () => {
    const traceText = [
      JSON.stringify({
        id: "event_1",
        runId: "run_1",
        timestamp: "2026-06-05T00:00:00.000Z",
        type: "run_started",
        status: "success",
        summary: "Run started"
      }),
      JSON.stringify({
        id: "event_2",
        runId: "run_1",
        timestamp: "2026-06-05T00:00:01.000Z",
        type: "tool_call_completed",
        status: "error",
        summary: "Command failed"
      }),
      JSON.stringify({
        id: "event_3",
        runId: "run_1",
        timestamp: "2026-06-05T00:00:02.000Z",
        type: "error",
        summary: "Follow-up failure"
      })
    ].join("\n");

    const model = parseTraceText(traceText);

    expect(model.events).toHaveLength(3);
    expect(model.summary.eventCount).toBe(3);
    expect(model.summary.failureCount).toBe(2);
    expect(model.firstFailure?.id).toBe("event_2");
  });

  it("throws line-numbered parse errors", () => {
    const traceText = [
      JSON.stringify({
        id: "event_1",
        runId: "run_1",
        timestamp: "2026-06-05T00:00:00.000Z",
        type: "run_started"
      }),
      "{broken}"
    ].join("\n");

    expect(() => parseTraceText(traceText)).toThrow("line 2");
  });
});
