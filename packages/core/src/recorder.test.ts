import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createRecorder } from "./recorder.js";
import { appendTraceEvent, readTraceFile } from "./jsonl.js";

describe("recorder", () => {
  it("records events with generated run and event fields", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-recorder-"));
    const outputPath = join(directory, "run.trace.jsonl");

    const recorder = await createRecorder({ runName: "test-run", outputPath });
    await recorder.record({
      type: "user_prompt",
      summary: "Fix the failing test",
      input: { prompt: "Please fix it" }
    });
    await recorder.end({ status: "success" });

    const events = await readTraceFile(outputPath);
    expect(events.map((event) => event.type)).toEqual([
      "run_started",
      "user_prompt",
      "run_completed"
    ]);
    expect(events[0].runId).toBe(events[1].runId);
    expect(events[1].id).toMatch(/^event_/);
    await rm(directory, { recursive: true, force: true });
  });

  it("starts a fresh trace when the output path already has events", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-recorder-"));
    const outputPath = join(directory, "run.trace.jsonl");

    await appendTraceEvent(outputPath, {
      id: "event_old",
      runId: "run_old",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "run_started"
    });

    const recorder = await createRecorder({ runName: "fresh-run", outputPath });
    await recorder.end({ status: "success" });

    const events = await readTraceFile(outputPath);
    expect(events.map((event) => event.type)).toEqual(["run_started", "run_completed"]);
    expect(events.every((event) => event.runId === recorder.runId)).toBe(true);
    await rm(directory, { recursive: true, force: true });
  });
});
