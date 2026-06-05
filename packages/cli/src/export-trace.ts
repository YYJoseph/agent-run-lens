import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { readTraceFile, summarizeTrace, type TraceSummary } from "@traceforge/core";

function formatNullable(value: string | number | null): string {
  return value === null ? "None" : String(value);
}

function formatSummary(summary: TraceSummary, traceFileName: string): string {
  return [
    "# TraceForge Export Summary",
    "",
    `Trace file: ${traceFileName}`,
    `Run identifier: ${formatNullable(summary.runId)}`,
    `Final status: ${formatNullable(summary.finalStatus)}`,
    `Event count: ${summary.eventCount}`,
    `Failure count: ${summary.failureCount}`,
    `Retry count: ${summary.retryCount}`,
    `File patch count: ${summary.filePatchCount}`,
    `First failure event identifier: ${formatNullable(summary.firstFailureEventId)}`,
    ""
  ].join("\n");
}

function sanitizeRunId(runId: string | null): string {
  const trimmed = runId?.trim() ?? "";
  const sanitized = trimmed.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);

  return sanitized === "" ? "unknown-run" : sanitized;
}

export async function exportTraceFolder(traceFile: string): Promise<string> {
  const tracePath = resolve(traceFile);
  const events = await readTraceFile(tracePath);
  const summary = summarizeTrace(events);
  const safeRunId = sanitizeRunId(summary.runId);
  const exportPath = resolve(`traceforge-export-${safeRunId}`);
  const traceFileName = basename(tracePath);

  await mkdir(exportPath, { recursive: true });
  await copyFile(tracePath, join(exportPath, traceFileName));
  await writeFile(join(exportPath, "summary.md"), formatSummary(summary, traceFileName), "utf8");

  return exportPath;
}
