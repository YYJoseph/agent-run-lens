import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { exportTraceFolder } from "./export-trace.js";

describe("trace export folders", () => {
  it("sanitizes run identifiers before creating export folders", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-export-test-"));
    const traceFile = join(directory, "malicious.trace.jsonl");
    const event = {
      id: "event_1",
      runId: "../bad\\run",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "run_started"
    };

    await writeFile(traceFile, `${JSON.stringify(event)}\n`, "utf8");

    let exportPath: string | null = null;

    try {
      exportPath = await exportTraceFolder(traceFile);

      expect(dirname(exportPath)).toBe(resolve("."));
      expect(basename(exportPath)).toBe("agent-run-lens-export-.._bad_run");
    } finally {
      if (exportPath) {
        await rm(exportPath, { recursive: true, force: true });
      }
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("includes file diffs and safe environment metadata in the export folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-export-test-"));
    const traceFile = join(directory, "bundle.trace.jsonl");
    const events = [
      {
        id: "event_1",
        runId: "bundle-run",
        timestamp: "2026-06-05T00:00:00.000Z",
        type: "run_started"
      },
      {
        id: "event_2",
        runId: "bundle-run",
        timestamp: "2026-06-05T00:00:01.000Z",
        type: "file_patch",
        summary: "Trim whitespace before lowercasing",
        input: { path: "normalize-email.mjs" },
        output: { patch: "-return value.toLowerCase();\n+return value.trim().toLowerCase();" }
      }
    ];

    await writeFile(traceFile, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");

    let exportPath: string | null = null;

    try {
      exportPath = await exportTraceFolder(traceFile);

      const diffs = await readFile(join(exportPath, "diffs.md"), "utf8");
      const environment = JSON.parse(await readFile(join(exportPath, "environment.json"), "utf8")) as Record<
        string,
        unknown
      >;

      expect(diffs).toContain("normalize-email.mjs");
      expect(diffs).toContain("return value.trim().toLowerCase();");
      expect(environment.nodeVersion).toBe(process.version);
      expect(environment.platform).toBe(process.platform);
      expect(environment.architecture).toBe(process.arch);
      expect(typeof environment.exportedAt).toBe("string");
      expect(environment).toHaveProperty("agentRunLensVersion");
    } finally {
      if (exportPath) {
        await rm(exportPath, { recursive: true, force: true });
      }
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("writes a readable run review summary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-export-test-"));
    const traceFile = join(directory, "review.trace.jsonl");
    const events = [
      {
        id: "event_1",
        runId: "review-run",
        timestamp: "2026-06-05T00:00:00.000Z",
        type: "run_started",
        summary: "Start recording the agent run"
      },
      {
        id: "event_2",
        runId: "review-run",
        timestamp: "2026-06-05T00:00:01.000Z",
        type: "user_prompt",
        input: "Build a local-first trace viewer"
      },
      {
        id: "event_3",
        runId: "review-run",
        timestamp: "2026-06-05T00:00:02.000Z",
        type: "shell_command",
        status: "success",
        summary: "Run the test suite"
      },
      {
        id: "event_4",
        runId: "review-run",
        timestamp: "2026-06-05T00:00:03.000Z",
        type: "file_patch",
        summary: "Add export report",
        input: { path: "packages/cli/src/export-trace.ts" },
        output: { patch: "+formatSummary(events);" }
      },
      {
        id: "event_5",
        runId: "review-run",
        timestamp: "2026-06-05T00:00:04.000Z",
        type: "run_completed",
        status: "success",
        durationMs: 4000,
        output: "Viewer and export report completed"
      }
    ];

    await writeFile(traceFile, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");

    let exportPath: string | null = null;

    try {
      exportPath = await exportTraceFolder(traceFile);

      const summary = await readFile(join(exportPath, "summary.md"), "utf8");

      expect(summary).toContain("# AgentRunLens Run Review");
      expect(summary).toContain("## Original Request");
      expect(summary).toContain("Build a local-first trace viewer");
      expect(summary).toContain("## Tool And Command Activity");
      expect(summary).toContain("Run the test suite");
      expect(summary).toContain("packages/cli/src/export-trace.ts");
      expect(summary).toContain("Viewer and export report completed");
      expect(summary).toContain("Completed duration: 4000 ms");
    } finally {
      if (exportPath) {
        await rm(exportPath, { recursive: true, force: true });
      }
      await rm(directory, { recursive: true, force: true });
    }
  });
});
