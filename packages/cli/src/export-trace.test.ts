import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { exportTraceFolder } from "./export-trace.js";

describe("trace export folders", () => {
  it("sanitizes run identifiers before creating export folders", async () => {
    const directory = await mkdtemp(join(tmpdir(), "traceforge-export-test-"));
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
      expect(basename(exportPath)).toBe("traceforge-export-.._bad_run");
    } finally {
      if (exportPath) {
        await rm(exportPath, { recursive: true, force: true });
      }
      await rm(directory, { recursive: true, force: true });
    }
  });
});
