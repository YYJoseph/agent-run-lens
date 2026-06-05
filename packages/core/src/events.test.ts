import { describe, expect, it } from "vitest";
import { isTraceEvent, parseTraceEvent, traceEventTypes } from "./events.js";

describe("trace event validation", () => {
  it("accepts a minimal valid trace event", () => {
    const event = {
      id: "event_1",
      runId: "run_1",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "user_prompt",
      summary: "Fix the failing test"
    };

    expect(isTraceEvent(event)).toBe(true);
    expect(parseTraceEvent(event)).toEqual(event);
  });

  it("rejects missing core fields", () => {
    expect(isTraceEvent({ type: "user_prompt" })).toBe(false);
  });

  it("keeps unknown event types renderable", () => {
    const event = {
      id: "event_2",
      runId: "run_1",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "custom_framework_event"
    };

    expect(isTraceEvent(event)).toBe(true);
  });

  it("publishes the known event type list", () => {
    expect(traceEventTypes).toContain("shell_command");
    expect(traceEventTypes).toContain("run_completed");
  });
});
