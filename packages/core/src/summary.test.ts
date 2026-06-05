import { describe, expect, it } from "vitest";
import { summarizeTrace } from "./summary.js";
import type { TraceEvent } from "./events.js";

const base = {
  runId: "run_1",
  timestamp: "2026-06-05T00:00:00.000Z"
};

describe("trace summary", () => {
  it("counts events and finds failures", () => {
    const events: TraceEvent[] = [
      { ...base, id: "event_1", type: "run_started", status: "started" },
      { ...base, id: "event_2", type: "shell_command", status: "error", output: { command: "npm test" } },
      { ...base, id: "event_3", type: "retry", status: "started" },
      { ...base, id: "event_4", type: "run_completed", status: "success" }
    ];

    expect(summarizeTrace(events)).toMatchObject({
      runId: "run_1",
      eventCount: 4,
      failureCount: 1,
      retryCount: 1,
      firstFailureEventId: "event_2",
      finalStatus: "success"
    });
  });
});
