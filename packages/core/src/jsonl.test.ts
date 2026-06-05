import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { appendTraceEvent, readTraceFile } from "./jsonl.js";
import type { TraceEvent } from "./events.js";

describe("newline-delimited JSON trace files", () => {
  it("writes and reads trace events", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-jsonl-"));
    const filePath = join(directory, "run.trace.jsonl");
    const event: TraceEvent = {
      id: "event_1",
      runId: "run_1",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "run_started"
    };

    await appendTraceEvent(filePath, event);

    expect(await readTraceFile(filePath)).toEqual([event]);
    expect(await readFile(filePath, "utf8")).toBe(`${JSON.stringify(event)}\n`);
    await rm(directory, { recursive: true, force: true });
  });

  it("reports the line number for invalid JSON", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-jsonl-"));
    const filePath = join(directory, "broken.trace.jsonl");

    await appendTraceEvent(filePath, {
      id: "event_1",
      runId: "run_1",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "run_started"
    });
    await import("node:fs/promises").then((fs) => fs.appendFile(filePath, "{broken}\n"));

    await expect(readTraceFile(filePath)).rejects.toThrow("line 2");
    await rm(directory, { recursive: true, force: true });
  });
});
