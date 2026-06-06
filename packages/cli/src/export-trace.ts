import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { readTraceFile, summarizeTrace, type TraceEvent, type TraceSummary } from "@agent-run-lens/core";

function formatNullable(value: string | number | null): string {
  return value === null ? "None" : String(value);
}

function formatSummary(summary: TraceSummary, traceFileName: string): string {
  return [
    "# AgentRunLens Export Summary",
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

function readRecordString(value: unknown, key: string): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : null;
}

function formatFileDiffs(events: TraceEvent[]): string {
  const filePatchEvents = events.filter((event) => event.type === "file_patch");
  const lines = ["# AgentRunLens File Diffs", ""];

  if (filePatchEvents.length === 0) {
    lines.push("No file patch events were captured.", "");
    return lines.join("\n");
  }

  filePatchEvents.forEach((event, index) => {
    const path = readRecordString(event.input, "path") ?? "Unknown file";
    const patch = readRecordString(event.output, "patch") ?? "No patch content captured.";

    lines.push(`## ${index + 1}. ${path}`, "");
    if (event.summary) {
      lines.push(event.summary, "");
    }
    lines.push("```diff", patch, "```", "");
  });

  return lines.join("\n");
}

function createEnvironmentMetadata() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    agentRunLensVersion: process.env.npm_package_version ?? null,
    exportedAt: new Date().toISOString()
  };
}

export async function exportTraceFolder(traceFile: string): Promise<string> {
  const tracePath = resolve(traceFile);
  const events = await readTraceFile(tracePath);
  const summary = summarizeTrace(events);
  const safeRunId = sanitizeRunId(summary.runId);
  const exportPath = resolve(`agent-run-lens-export-${safeRunId}`);
  const traceFileName = basename(tracePath);

  await mkdir(exportPath, { recursive: true });
  await copyFile(tracePath, join(exportPath, traceFileName));
  await writeFile(join(exportPath, "summary.md"), formatSummary(summary, traceFileName), "utf8");
  await writeFile(join(exportPath, "diffs.md"), formatFileDiffs(events), "utf8");
  await writeFile(join(exportPath, "environment.json"), `${JSON.stringify(createEnvironmentMetadata(), null, 2)}\n`, "utf8");

  return exportPath;
}
