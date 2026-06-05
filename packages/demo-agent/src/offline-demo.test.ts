import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readTraceFile } from "@traceforge/core";
import { runOfflineDemo } from "./offline-demo.js";

afterEach(() => {
  vi.doUnmock("node:child_process");
  vi.resetModules();
});

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

  it("records command launch failures as evidence", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-offline-demo-"));
    const tracePath = join(directory, "latest.trace.jsonl");

    vi.doMock("node:child_process", () => ({
      spawn: () => {
        const child = new EventEmitter() as EventEmitter & {
          stdout: EventEmitter;
          stderr: EventEmitter;
        };
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        queueMicrotask(() => {
          child.emit("error", new Error("spawn failed"));
        });
        return child;
      }
    }));
    const { runOfflineDemo: runOfflineDemoWithSpawnFailure } = await import("./offline-demo.js");

    await runOfflineDemoWithSpawnFailure({ workspacePath: join(directory, "fixture"), tracePath });

    const events = await readTraceFile(tracePath);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "shell_command",
        status: "error",
        output: expect.objectContaining({
          exitCode: null,
          stderr: expect.stringContaining("spawn failed")
        })
      })
    );
    expect(events.at(-1)).toMatchObject({ type: "run_completed", status: "error" });

    await rm(directory, { recursive: true, force: true });
  });
});
