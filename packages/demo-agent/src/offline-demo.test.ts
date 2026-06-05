import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readTraceFile } from "@traceforge/core";
import { runOfflineDemo } from "./offline-demo.js";

describe("offline demonstration agent", () => {
  it("creates a complete trace with failure, patch, and final success", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-offline-demo-"));
    const tracePath = join(directory, "latest.trace.jsonl");

    await runOfflineDemo({ workspacePath: join(directory, "fixture"), tracePath });

    const events = await readTraceFile(tracePath);
    expect(events.map((event) => event.type)).toContain("shell_command");
    expect(events.map((event) => event.type)).toContain("file_patch");
    expect(events.some((event) => event.status === "error")).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: "run_completed", status: "success" });

    await rm(directory, { recursive: true, force: true });
  });
});
