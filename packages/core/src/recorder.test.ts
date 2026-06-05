import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createRecorder } from "./recorder.js";
import { readTraceFile } from "./jsonl.js";

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
});
