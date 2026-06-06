# AgentRunLens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working version of AgentRunLens: a local-first black box recorder for artificial intelligence agent runs with an offline demonstration, optional OpenAI demonstration, command-line tools, a local web viewer, and exportable trace folders.

**Architecture:** Use a TypeScript workspace with small packages. `packages/core` owns trace event types, validation, reading, writing, and summary derivation. `packages/demo-agent` creates deterministic and optional OpenAI-backed traces. `packages/cli` exposes commands, and `apps/web` renders traces in a Vite React application.

**Technology Stack:** TypeScript, Node.js, React, Vite, Vitest, pnpm workspaces, newline-delimited JSON trace files.

---

## File Structure

- Create: `package.json` for workspace scripts.
- Create: `pnpm-workspace.yaml` for workspace package discovery.
- Create: `tsconfig.base.json` for shared TypeScript compiler settings.
- Create: `vitest.config.ts` for shared test discovery.
- Create: `packages/core/src/events.ts` for trace event types and validators.
- Create: `packages/core/src/jsonl.ts` for newline-delimited JSON reading and writing.
- Create: `packages/core/src/recorder.ts` for the recorder application programming interface.
- Create: `packages/core/src/summary.ts` for derived failure, diff, and statistics summaries.
- Create: `packages/core/src/index.ts` for public exports.
- Create: `packages/core/src/*.test.ts` for core tests.
- Create: `packages/demo-agent/src/offline-demo.ts` for deterministic trace generation.
- Create: `packages/demo-agent/src/openai-demo.ts` for optional OpenAI-backed trace generation.
- Create: `packages/demo-agent/src/fixture.ts` for fixture creation and file patch helpers.
- Create: `packages/demo-agent/src/index.ts` for public exports.
- Create: `packages/cli/src/main.ts` for command-line parsing and command dispatch.
- Create: `packages/cli/src/commands/*.ts` for demo, view, and export commands.
- Create: `packages/cli/src/server.ts` for local viewer server.
- Create: `packages/cli/src/export-trace.ts` for export folder creation.
- Create: `apps/web/src/App.tsx` for viewer layout.
- Create: `apps/web/src/trace-model.ts` for browser-side trace parsing and summary mapping.
- Create: `apps/web/src/components/*.tsx` for timeline, details, filters, failure view, and diff view.
- Create: `examples/traces/.gitkeep` so generated traces have a home without committing private trace data.
- Modify: `README.md` for project explanation and quickstart.

## Task 1: Workspace Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `examples/traces/.gitkeep`

- [ ] **Step 1: Create the workspace manifest**

Add `package.json`:

```json
{
  "name": "agent-run-lens",
  "version": "0.1.0",
  "private": true,
  "description": "Local-first black box recorder for artificial intelligence agent runs.",
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "test": "vitest run",
    "check": "pnpm -r check",
    "agent-run-lens": "pnpm --filter @agent-run-lens/cli agent-run-lens"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create workspace discovery**

Add `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create shared TypeScript settings**

Add `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Create shared test settings**

Add `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    environment: "node"
  }
});
```

- [ ] **Step 5: Ignore generated files**

Add `.gitignore`:

```gitignore
node_modules/
dist/
.vite/
coverage/
traces/*.trace.jsonl
agent-run-lens-export-*/
examples/fixtures/**/node_modules/
examples/fixtures/**/dist/
```

- [ ] **Step 6: Create trace example directory marker**

Create `examples/traces/.gitkeep` as an empty file.

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`

Expected: dependency installation completes and creates `pnpm-lock.yaml`.

- [ ] **Step 8: Run the empty test command**

Run: `pnpm test`

Expected: Vitest reports no test files or completes without application test failures.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.config.ts .gitignore examples/traces/.gitkeep pnpm-lock.yaml
git commit -m "chore: create AgentRunLens workspace"
```

## Task 2: Core Trace Types And Validation

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/events.ts`
- Create: `packages/core/src/events.test.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: Create the core package manifest**

Add `packages/core/package.json`:

```json
{
  "name": "@agent-run-lens/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "check": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {}
}
```

- [ ] **Step 2: Create package TypeScript settings**

Add `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write failing validation tests**

Add `packages/core/src/events.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isTraceEvent, parseTraceEvent, traceEventTypes } from "./events.js";

describe("trace event validation", () => {
  it("accepts a minimal valid trace event", () => {
    const event = {
      id: "event_1",
      runId: "run_1",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "user_prompt",
      summary: "Fix the failing test"
    };

    expect(isTraceEvent(event)).toBe(true);
    expect(parseTraceEvent(event)).toEqual(event);
  });

  it("rejects missing core fields", () => {
    expect(isTraceEvent({ type: "user_prompt" })).toBe(false);
  });

  it("keeps unknown event types renderable", () => {
    const event = {
      id: "event_2",
      runId: "run_1",
      timestamp: "2026-06-05T00:00:00.000Z",
      type: "custom_framework_event"
    };

    expect(isTraceEvent(event)).toBe(true);
  });

  it("publishes the known event type list", () => {
    expect(traceEventTypes).toContain("shell_command");
    expect(traceEventTypes).toContain("run_completed");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test packages/core/src/events.test.ts`

Expected: FAIL because `events.ts` does not exist.

- [ ] **Step 5: Implement event types and validation**

Add `packages/core/src/events.ts`:

```ts
export const traceEventTypes = [
  "run_started",
  "user_prompt",
  "model_message",
  "decision",
  "tool_call_started",
  "tool_call_completed",
  "shell_command",
  "file_read",
  "file_patch",
  "test_result",
  "error",
  "retry",
  "run_completed"
] as const;

export type KnownTraceEventType = (typeof traceEventTypes)[number];
export type TraceEventType = KnownTraceEventType | (string & {});
export type TraceStatus = "started" | "success" | "error" | "skipped";

export type TraceEvent = {
  id: string;
  runId: string;
  timestamp: string;
  type: TraceEventType;
  status?: TraceStatus;
  durationMs?: number;
  summary?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function isOptionalStatus(value: unknown): value is TraceStatus | undefined {
  return (
    value === undefined ||
    value === "started" ||
    value === "success" ||
    value === "error" ||
    value === "skipped"
  );
}

export function isTraceEvent(value: unknown): value is TraceEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.runId === "string" &&
    typeof value.timestamp === "string" &&
    typeof value.type === "string" &&
    isOptionalStatus(value.status) &&
    isOptionalNumber(value.durationMs) &&
    isOptionalString(value.summary) &&
    (value.metadata === undefined || isRecord(value.metadata))
  );
}

export function parseTraceEvent(value: unknown): TraceEvent {
  if (!isTraceEvent(value)) {
    throw new Error("Invalid trace event: expected id, runId, timestamp, and type.");
  }

  return value;
}
```

- [ ] **Step 6: Export the core types**

Add `packages/core/src/index.ts`:

```ts
export * from "./events.js";
```

- [ ] **Step 7: Run tests and type checks**

Run: `pnpm test packages/core/src/events.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/core check`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core
git commit -m "feat: add core trace event validation"
```

## Task 3: Newline-Delimited JSON Reader, Writer, And Recorder

**Files:**
- Create: `packages/core/src/jsonl.ts`
- Create: `packages/core/src/jsonl.test.ts`
- Create: `packages/core/src/recorder.ts`
- Create: `packages/core/src/recorder.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing newline-delimited JSON tests**

Add `packages/core/src/jsonl.test.ts`:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { appendTraceEvent, readTraceFile } from "./jsonl.js";
import type { TraceEvent } from "./events.js";

describe("newline-delimited JSON trace files", () => {
  it("writes and reads trace events", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-jsonl-"));
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
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-jsonl-"));
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
```

- [ ] **Step 2: Write failing recorder tests**

Add `packages/core/src/recorder.test.ts`:

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createRecorder } from "./recorder.js";
import { readTraceFile } from "./jsonl.js";

describe("recorder", () => {
  it("records events with generated run and event fields", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-recorder-"));
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
```

- [ ] **Step 3: Run tests to verify failure**

Run: `pnpm test packages/core/src/jsonl.test.ts packages/core/src/recorder.test.ts`

Expected: FAIL because `jsonl.ts` and `recorder.ts` do not exist.

- [ ] **Step 4: Implement newline-delimited JSON helpers**

Add `packages/core/src/jsonl.ts`:

```ts
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseTraceEvent, type TraceEvent } from "./events.js";

export async function appendTraceEvent(filePath: string, event: TraceEvent): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readTraceFile(filePath: string): Promise<TraceEvent[]> {
  const text = await readFile(filePath, "utf8");
  const events: TraceEvent[] = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "") {
      continue;
    }

    try {
      events.push(parseTraceEvent(JSON.parse(line)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid trace file at line ${index + 1}: ${message}`);
    }
  }

  return events;
}
```

- [ ] **Step 5: Implement recorder**

Add `packages/core/src/recorder.ts`:

```ts
import { appendTraceEvent } from "./jsonl.js";
import type { TraceEvent, TraceEventType, TraceStatus } from "./events.js";

export type CreateRecorderOptions = {
  runName: string;
  outputPath: string;
};

export type RecordEventInput = {
  type: TraceEventType;
  status?: TraceStatus;
  durationMs?: number;
  summary?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
};

export type Recorder = {
  runId: string;
  outputPath: string;
  record(event: RecordEventInput): Promise<TraceEvent>;
  end(result: { status: "success" | "error"; summary?: string }): Promise<TraceEvent>;
};

let runCounter = 0;

function nextRunId(): string {
  runCounter += 1;
  return `run_${Date.now()}_${runCounter}`;
}

function nextEventId(index: number): string {
  return `event_${String(index).padStart(4, "0")}`;
}

export async function createRecorder(options: CreateRecorderOptions): Promise<Recorder> {
  const runId = nextRunId();
  let eventIndex = 0;

  async function write(input: RecordEventInput): Promise<TraceEvent> {
    eventIndex += 1;
    const event: TraceEvent = {
      id: nextEventId(eventIndex),
      runId,
      timestamp: new Date().toISOString(),
      type: input.type,
      status: input.status,
      durationMs: input.durationMs,
      summary: input.summary,
      input: input.input,
      output: input.output,
      metadata: input.metadata
    };

    await appendTraceEvent(options.outputPath, event);
    return event;
  }

  await write({
    type: "run_started",
    status: "started",
    summary: options.runName,
    metadata: { runName: options.runName }
  });

  return {
    runId,
    outputPath: options.outputPath,
    record: write,
    end(result) {
      return write({
        type: "run_completed",
        status: result.status,
        summary: result.summary ?? `Run completed with status ${result.status}`
      });
    }
  };
}
```

- [ ] **Step 6: Export new helpers**

Modify `packages/core/src/index.ts`:

```ts
export * from "./events.js";
export * from "./jsonl.js";
export * from "./recorder.js";
```

- [ ] **Step 7: Run tests and type checks**

Run: `pnpm test packages/core/src/jsonl.test.ts packages/core/src/recorder.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/core check`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core
git commit -m "feat: add trace recorder"
```

## Task 4: Trace Summary Derivation

**Files:**
- Create: `packages/core/src/summary.ts`
- Create: `packages/core/src/summary.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing summary tests**

Add `packages/core/src/summary.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test packages/core/src/summary.test.ts`

Expected: FAIL because `summary.ts` does not exist.

- [ ] **Step 3: Implement summary derivation**

Add `packages/core/src/summary.ts`:

```ts
import type { TraceEvent, TraceStatus } from "./events.js";

export type TraceSummary = {
  runId: string | null;
  eventCount: number;
  failureCount: number;
  retryCount: number;
  filePatchCount: number;
  firstFailureEventId: string | null;
  finalStatus: TraceStatus | null;
};

export function summarizeTrace(events: TraceEvent[]): TraceSummary {
  const firstFailure = events.find((event) => event.status === "error" || event.type === "error");
  const completion = [...events].reverse().find((event) => event.type === "run_completed");

  return {
    runId: events[0]?.runId ?? null,
    eventCount: events.length,
    failureCount: events.filter((event) => event.status === "error" || event.type === "error").length,
    retryCount: events.filter((event) => event.type === "retry").length,
    filePatchCount: events.filter((event) => event.type === "file_patch").length,
    firstFailureEventId: firstFailure?.id ?? null,
    finalStatus: completion?.status ?? null
  };
}
```

- [ ] **Step 4: Export summary helpers**

Modify `packages/core/src/index.ts`:

```ts
export * from "./events.js";
export * from "./jsonl.js";
export * from "./recorder.js";
export * from "./summary.js";
```

- [ ] **Step 5: Run tests and type checks**

Run: `pnpm test packages/core/src/summary.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/core check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat: summarize trace runs"
```

## Task 5: Deterministic Offline Demonstration Agent

**Files:**
- Create: `packages/demo-agent/package.json`
- Create: `packages/demo-agent/tsconfig.json`
- Create: `packages/demo-agent/src/fixture.ts`
- Create: `packages/demo-agent/src/offline-demo.ts`
- Create: `packages/demo-agent/src/offline-demo.test.ts`
- Create: `packages/demo-agent/src/index.ts`

- [ ] **Step 1: Create package manifest**

Add `packages/demo-agent/package.json`:

```json
{
  "name": "@agent-run-lens/demo-agent",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "check": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@agent-run-lens/core": "workspace:*"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create package TypeScript settings**

Add `packages/demo-agent/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write failing offline demonstration test**

Add `packages/demo-agent/src/offline-demo.test.ts`:

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readTraceFile } from "@agent-run-lens/core";
import { runOfflineDemo } from "./offline-demo.js";

describe("offline demonstration agent", () => {
  it("creates a complete trace with failure, patch, and final success", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-offline-demo-"));
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
```

- [ ] **Step 4: Run test to verify failure**

Run: `pnpm test packages/demo-agent/src/offline-demo.test.ts`

Expected: FAIL because `offline-demo.ts` does not exist.

- [ ] **Step 5: Implement fixture creation and patch helper**

Add `packages/demo-agent/src/fixture.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function createNormalizeEmailFixture(workspacePath: string): Promise<void> {
  await mkdir(workspacePath, { recursive: true });
  await writeFile(
    join(workspacePath, "package.json"),
    JSON.stringify(
      {
        type: "module",
        scripts: {
          test: "node normalize-email.test.mjs"
        }
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(
    join(workspacePath, "normalize-email.mjs"),
    [
      "export function normalizeEmail(value) {",
      "  return value.toLowerCase();",
      "}",
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    join(workspacePath, "normalize-email.test.mjs"),
    [
      "import { strict as assert } from 'node:assert';",
      "import { normalizeEmail } from './normalize-email.mjs';",
      "",
      "assert.equal(normalizeEmail(' User@Example.COM '), 'user@example.com');",
      "console.log('normalizeEmail tests passed');",
      ""
    ].join("\n"),
    "utf8"
  );
}

export async function patchNormalizeEmail(workspacePath: string): Promise<string> {
  const filePath = join(workspacePath, "normalize-email.mjs");
  const before = await readFile(filePath, "utf8");
  const after = before.replace("return value.toLowerCase();", "return value.trim().toLowerCase();");
  await writeFile(filePath, after, "utf8");
  return [
    "--- a/normalize-email.mjs",
    "+++ b/normalize-email.mjs",
    "@@",
    "-  return value.toLowerCase();",
    "+  return value.trim().toLowerCase();"
  ].join("\n");
}
```

- [ ] **Step 6: Implement offline demonstration**

Add `packages/demo-agent/src/offline-demo.ts`:

```ts
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createRecorder } from "@agent-run-lens/core";
import { createNormalizeEmailFixture, patchNormalizeEmail } from "./fixture.js";

export type RunOfflineDemoOptions = {
  workspacePath: string;
  tracePath: string;
};

async function runCommand(command: string, args: string[], cwd: string) {
  const started = Date.now();
  return await new Promise<{ exitCode: number | null; stdout: string; stderr: string; durationMs: number }>((resolve) => {
    const child = spawn(command, args, { cwd, shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr, durationMs: Date.now() - started });
    });
  });
}

export async function runOfflineDemo(options: RunOfflineDemoOptions): Promise<string> {
  await createNormalizeEmailFixture(options.workspacePath);
  const recorder = await createRecorder({ runName: "offline-normalize-email-demo", outputPath: options.tracePath });

  await recorder.record({
    type: "user_prompt",
    summary: "Fix the failing normalizeEmail test",
    input: { prompt: "Please fix the failing normalizeEmail test." }
  });
  await recorder.record({
    type: "decision",
    summary: "Run the fixture tests before editing",
    output: { reason: "The failure output provides evidence for the fix." }
  });

  const firstTest = await runCommand("npm", ["test"], options.workspacePath);
  await recorder.record({
    type: "shell_command",
    status: firstTest.exitCode === 0 ? "success" : "error",
    durationMs: firstTest.durationMs,
    summary: "Run npm test before the fix",
    input: { command: "npm test", cwd: options.workspacePath },
    output: firstTest
  });
  await recorder.record({
    type: "file_read",
    status: "success",
    summary: "Read normalize-email.mjs",
    input: { path: join(options.workspacePath, "normalize-email.mjs") },
    output: { text: await readFile(join(options.workspacePath, "normalize-email.mjs"), "utf8") }
  });

  const patch = await patchNormalizeEmail(options.workspacePath);
  await recorder.record({
    type: "file_patch",
    status: "success",
    summary: "Trim whitespace before lowercasing",
    input: { path: join(options.workspacePath, "normalize-email.mjs") },
    output: { patch }
  });
  await recorder.record({
    type: "retry",
    status: "started",
    summary: "Run tests again after patch"
  });

  const secondTest = await runCommand("npm", ["test"], options.workspacePath);
  await recorder.record({
    type: "test_result",
    status: secondTest.exitCode === 0 ? "success" : "error",
    durationMs: secondTest.durationMs,
    summary: "Run npm test after the fix",
    input: { command: "npm test", cwd: options.workspacePath },
    output: secondTest
  });
  await recorder.end({ status: secondTest.exitCode === 0 ? "success" : "error" });

  return options.tracePath;
}
```

- [ ] **Step 7: Export demonstration functions**

Add `packages/demo-agent/src/index.ts`:

```ts
export * from "./fixture.js";
export * from "./offline-demo.js";
```

- [ ] **Step 8: Run tests and type checks**

Run: `pnpm test packages/demo-agent/src/offline-demo.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/demo-agent check`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/demo-agent
git commit -m "feat: add offline demonstration agent"
```

## Task 6: Command-Line Interface For Demonstration And Export

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/main.ts`
- Create: `packages/cli/src/commands/demo.ts`
- Create: `packages/cli/src/export-trace.ts`
- Create: `packages/cli/src/commands/export.ts`
- Create: `packages/cli/src/main.test.ts`

- [ ] **Step 1: Create command-line package manifest**

Add `packages/cli/package.json`:

```json
{
  "name": "@agent-run-lens/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "agent-run-lens": "dist/main.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "check": "tsc -p tsconfig.json --noEmit",
    "agent-run-lens": "node dist/main.js"
  },
  "dependencies": {
    "@agent-run-lens/core": "workspace:*",
    "@agent-run-lens/demo-agent": "workspace:*"
  }
}
```

- [ ] **Step 2: Create package TypeScript settings**

Add `packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write failing command-line tests**

Add `packages/cli/src/main.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseArguments } from "./main.js";

describe("command-line argument parsing", () => {
  it("parses offline demonstration command", () => {
    expect(parseArguments(["demo", "--offline"])).toEqual({ command: "demo", mode: "offline" });
  });

  it("parses export command", () => {
    expect(parseArguments(["export", "traces/latest.trace.jsonl"])).toEqual({
      command: "export",
      traceFile: "traces/latest.trace.jsonl"
    });
  });
});
```

- [ ] **Step 4: Run test to verify failure**

Run: `pnpm test packages/cli/src/main.test.ts`

Expected: FAIL because `main.ts` does not exist.

- [ ] **Step 5: Implement command-line dispatch**

Add `packages/cli/src/main.ts`:

```ts
#!/usr/bin/env node
import { runDemoCommand } from "./commands/demo.js";
import { runExportCommand } from "./commands/export.js";

export type ParsedArguments =
  | { command: "demo"; mode: "offline" | "openai" }
  | { command: "export"; traceFile: string }
  | { command: "help" };

export function parseArguments(args: string[]): ParsedArguments {
  const [command, ...rest] = args;

  if (command === "demo") {
    return { command: "demo", mode: rest.includes("--openai") ? "openai" : "offline" };
  }

  if (command === "export" && rest[0]) {
    return { command: "export", traceFile: rest[0] };
  }

  return { command: "help" };
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const parsed = parseArguments(args);

  if (parsed.command === "demo") {
    await runDemoCommand(parsed.mode);
    return;
  }

  if (parsed.command === "export") {
    await runExportCommand(parsed.traceFile);
    return;
  }

  console.log(["AgentRunLens", "", "Commands:", "  agent-run-lens demo --offline", "  agent-run-lens demo --openai", "  agent-run-lens export <trace-file>"].join("\n"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
```

- [ ] **Step 6: Implement demonstration command**

Add `packages/cli/src/commands/demo.ts`:

```ts
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { runOfflineDemo } from "@agent-run-lens/demo-agent";

export async function runDemoCommand(mode: "offline" | "openai"): Promise<void> {
  if (mode === "openai" && !process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY is not set. Run `agent-run-lens demo --offline` for the local demonstration.");
    return;
  }

  if (mode === "openai") {
    const { runOpenAiDemo } = await import("@agent-run-lens/demo-agent");
    const tracePath = await runOpenAiDemo({
      workspacePath: resolve("examples/fixtures/openai-normalize-email"),
      tracePath: resolve("examples/traces/latest.trace.jsonl")
    });
    console.log(`Trace written to ${tracePath}`);
    return;
  }

  await mkdir(resolve("examples/traces"), { recursive: true });
  const tracePath = await runOfflineDemo({
    workspacePath: resolve("examples/fixtures/offline-normalize-email"),
    tracePath: resolve("examples/traces/latest.trace.jsonl")
  });
  console.log(`Trace written to ${tracePath}`);
}
```

- [ ] **Step 7: Implement export folder creation**

Add `packages/cli/src/export-trace.ts`:

```ts
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { readTraceFile, summarizeTrace } from "@agent-run-lens/core";

export async function exportTraceFolder(traceFile: string): Promise<string> {
  const tracePath = resolve(traceFile);
  const events = await readTraceFile(tracePath);
  const summary = summarizeTrace(events);
  const exportPath = resolve(`agent-run-lens-export-${summary.runId ?? "unknown-run"}`);

  await mkdir(exportPath, { recursive: true });
  await copyFile(tracePath, join(exportPath, basename(tracePath)));
  await writeFile(
    join(exportPath, "summary.md"),
    [
      "# AgentRunLens Export Summary",
      "",
      `- Run identifier: ${summary.runId ?? "unknown"}`,
      `- Event count: ${summary.eventCount}`,
      `- Failure count: ${summary.failureCount}`,
      `- Retry count: ${summary.retryCount}`,
      `- File patch count: ${summary.filePatchCount}`,
      `- Final status: ${summary.finalStatus ?? "unknown"}`,
      ""
    ].join("\n"),
    "utf8"
  );

  return exportPath;
}
```

- [ ] **Step 8: Implement export command**

Add `packages/cli/src/commands/export.ts`:

```ts
import { exportTraceFolder } from "../export-trace.js";

export async function runExportCommand(traceFile: string): Promise<void> {
  const exportPath = await exportTraceFolder(traceFile);
  console.log(`Trace export written to ${exportPath}`);
}
```

- [ ] **Step 9: Run tests, type checks, and build**

Run: `pnpm test packages/cli/src/main.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/cli check`

Expected: PASS.

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/cli
git commit -m "feat: add AgentRunLens command-line tools"
```

## Task 7: Optional OpenAI Demonstration

**Files:**
- Create: `packages/demo-agent/src/openai-demo.ts`
- Create: `packages/demo-agent/src/openai-demo.test.ts`
- Modify: `packages/demo-agent/src/index.ts`

- [ ] **Step 1: Write failing missing-key behavior test**

Add `packages/demo-agent/src/openai-demo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertOpenAiKey } from "./openai-demo.js";

describe("OpenAI demonstration", () => {
  it("returns a readable message when the key is missing", () => {
    expect(() => assertOpenAiKey(undefined)).toThrow("OPENAI_API_KEY is required");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test packages/demo-agent/src/openai-demo.test.ts`

Expected: FAIL because `openai-demo.ts` does not exist.

- [ ] **Step 3: Implement optional OpenAI demonstration**

Add `packages/demo-agent/src/openai-demo.ts`:

```ts
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createRecorder } from "@agent-run-lens/core";
import { createNormalizeEmailFixture, patchNormalizeEmail } from "./fixture.js";
import type { RunOfflineDemoOptions } from "./offline-demo.js";

export function assertOpenAiKey(value: string | undefined): string {
  if (!value) {
    throw new Error("OPENAI_API_KEY is required for the OpenAI demonstration. Use the offline demonstration instead.");
  }

  return value;
}

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

async function requestModelMessage(apiKey: string): Promise<string> {
  const model = process.env.TRACEFORGE_OPENAI_MODEL ?? "gpt-5.4-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: "A TypeScript test fails because normalizeEmail(' User@Example.COM ') returns a value with spaces. Give a short debugging plan.",
      max_output_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI Responses request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as OpenAiResponse;
  return body.output_text ?? body.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n").trim() ?? "";
}

async function runCommand(command: string, args: string[], cwd: string) {
  const started = Date.now();
  return await new Promise<{ exitCode: number | null; stdout: string; stderr: string; durationMs: number }>((resolve) => {
    const child = spawn(command, args, { cwd, shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr, durationMs: Date.now() - started });
    });
  });
}

export async function runOpenAiDemo(options: RunOfflineDemoOptions): Promise<string> {
  const apiKey = assertOpenAiKey(process.env.OPENAI_API_KEY);
  await createNormalizeEmailFixture(options.workspacePath);
  const recorder = await createRecorder({ runName: "openai-normalize-email-demo", outputPath: options.tracePath });

  await recorder.record({
    type: "user_prompt",
    summary: "Fix the failing normalizeEmail test",
    input: { prompt: "Please fix the failing normalizeEmail test." }
  });

  const modelMessage = await requestModelMessage(apiKey);
  await recorder.record({
    type: "model_message",
    status: "success",
    summary: "OpenAI model produced a debugging plan",
    output: { text: modelMessage, model: process.env.TRACEFORGE_OPENAI_MODEL ?? "gpt-5.4-mini" }
  });
  await recorder.record({
    type: "decision",
    summary: "Use model plan, then inspect test evidence",
    output: { reason: "The model plan points to whitespace handling, but the trace still records the concrete command evidence." }
  });

  const firstTest = await runCommand("npm", ["test"], options.workspacePath);
  await recorder.record({
    type: "shell_command",
    status: firstTest.exitCode === 0 ? "success" : "error",
    durationMs: firstTest.durationMs,
    summary: "Run npm test before the fix",
    input: { command: "npm test", cwd: options.workspacePath },
    output: firstTest
  });

  await recorder.record({
    type: "file_read",
    status: "success",
    summary: "Read normalize-email.mjs",
    input: { path: join(options.workspacePath, "normalize-email.mjs") },
    output: { text: await readFile(join(options.workspacePath, "normalize-email.mjs"), "utf8") }
  });

  const patch = await patchNormalizeEmail(options.workspacePath);
  await recorder.record({
    type: "file_patch",
    status: "success",
    summary: "Trim whitespace before lowercasing",
    input: { path: join(options.workspacePath, "normalize-email.mjs") },
    output: { patch }
  });

  const secondTest = await runCommand("npm", ["test"], options.workspacePath);
  await recorder.record({
    type: "test_result",
    status: secondTest.exitCode === 0 ? "success" : "error",
    durationMs: secondTest.durationMs,
    summary: "Run npm test after the fix",
    input: { command: "npm test", cwd: options.workspacePath },
    output: secondTest
  });
  await recorder.end({ status: secondTest.exitCode === 0 ? "success" : "error" });

  return options.tracePath;
}
```

- [ ] **Step 4: Export OpenAI demonstration functions**

Modify `packages/demo-agent/src/index.ts`:

```ts
export * from "./fixture.js";
export * from "./offline-demo.js";
export * from "./openai-demo.js";
```

- [ ] **Step 5: Run tests and type checks**

Run: `pnpm test packages/demo-agent/src/openai-demo.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/demo-agent check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/demo-agent
git commit -m "feat: add optional OpenAI demonstration path"
```

## Task 8: Local Web Viewer

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/trace-model.ts`
- Create: `apps/web/src/trace-model.test.ts`
- Create: `apps/web/src/components/EventTimeline.tsx`
- Create: `apps/web/src/components/EventDetails.tsx`
- Create: `apps/web/src/components/FailurePanel.tsx`
- Create: `apps/web/src/components/DiffPanel.tsx`
- Create: `apps/web/src/styles.css`

- [ ] **Step 1: Create web package manifest**

Add `apps/web/package.json`:

```json
{
  "name": "@agent-run-lens/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "check": "tsc -p tsconfig.json --noEmit",
    "dev": "vite --host 127.0.0.1"
  },
  "dependencies": {
    "@agent-run-lens/core": "workspace:*",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

- [ ] **Step 2: Create web entry files**

Add `apps/web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgentRunLens</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Add `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

Add `apps/web/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()]
});
```

- [ ] **Step 3: Write failing trace model test**

Add `apps/web/src/trace-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseTraceText } from "./trace-model.js";

describe("browser trace model", () => {
  it("parses trace text and marks the first failure", () => {
    const text = [
      JSON.stringify({ id: "event_1", runId: "run_1", timestamp: "2026-06-05T00:00:00.000Z", type: "run_started" }),
      JSON.stringify({ id: "event_2", runId: "run_1", timestamp: "2026-06-05T00:00:01.000Z", type: "shell_command", status: "error" })
    ].join("\n");

    const model = parseTraceText(text);
    expect(model.events).toHaveLength(2);
    expect(model.summary.firstFailureEventId).toBe("event_2");
  });
});
```

- [ ] **Step 4: Run test to verify failure**

Run: `pnpm test apps/web/src/trace-model.test.ts`

Expected: FAIL because `trace-model.ts` does not exist.

- [ ] **Step 5: Implement browser trace model**

Add `apps/web/src/trace-model.ts`:

```ts
import { parseTraceEvent, summarizeTrace, type TraceEvent, type TraceSummary } from "@agent-run-lens/core";

export type TraceModel = {
  events: TraceEvent[];
  summary: TraceSummary;
};

export function parseTraceText(text: string): TraceModel {
  const events = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      try {
        return parseTraceEvent(JSON.parse(line));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid trace line ${index + 1}: ${message}`);
      }
    });

  return { events, summary: summarizeTrace(events) };
}
```

- [ ] **Step 6: Implement React application and components**

Add `apps/web/src/main.tsx`:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Add `apps/web/src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import type { TraceEvent } from "@agent-run-lens/core";
import { parseTraceText } from "./trace-model.js";
import { EventTimeline } from "./components/EventTimeline.js";
import { EventDetails } from "./components/EventDetails.js";
import { FailurePanel } from "./components/FailurePanel.js";
import { DiffPanel } from "./components/DiffPanel.js";

const sampleTrace = [
  JSON.stringify({ id: "event_1", runId: "run_sample", timestamp: new Date().toISOString(), type: "run_started", status: "started", summary: "Sample run" })
].join("\n");

export function App() {
  const [traceText, setTraceText] = useState(sampleTrace);
  const [loadError, setLoadError] = useState<string | null>(null);
  const model = useMemo(() => parseTraceText(traceText), [traceText]);
  const [selectedEvent, setSelectedEvent] = useState<TraceEvent | null>(model.events[0] ?? null);

  useEffect(() => {
    fetch("/trace")
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("No trace file was served."))))
      .then((text) => {
        setTraceText(text);
        setLoadError(null);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : String(error));
      });
  }, []);

  useEffect(() => {
    setSelectedEvent(model.events[0] ?? null);
  }, [model.events]);

  return (
    <main className="shell">
      <aside className="sidebar">
        <h1>AgentRunLens</h1>
        <p>{model.summary.eventCount} events</p>
        <p>{model.summary.failureCount} failures</p>
        {loadError ? <p className="notice">{loadError}</p> : null}
        <textarea value={traceText} onChange={(event) => setTraceText(event.target.value)} aria-label="Trace text" />
      </aside>
      <section className="timeline">
        <EventTimeline events={model.events} selectedEventId={selectedEvent?.id ?? null} onSelect={setSelectedEvent} />
      </section>
      <section className="details">
        <EventDetails event={selectedEvent} />
        <FailurePanel events={model.events} summary={model.summary} />
        <DiffPanel events={model.events} />
      </section>
    </main>
  );
}
```

Add component files:

```tsx
// apps/web/src/components/EventTimeline.tsx
import type { TraceEvent } from "@agent-run-lens/core";

export function EventTimeline(props: { events: TraceEvent[]; selectedEventId: string | null; onSelect(event: TraceEvent): void }) {
  return (
    <div>
      <h2>Timeline</h2>
      {props.events.map((event) => (
        <button className={event.id === props.selectedEventId ? "event selected" : "event"} key={event.id} onClick={() => props.onSelect(event)}>
          <span>{event.type}</span>
          <strong>{event.summary ?? event.id}</strong>
          <small>{event.status ?? "unknown"}</small>
        </button>
      ))}
    </div>
  );
}
```

```tsx
// apps/web/src/components/EventDetails.tsx
import type { TraceEvent } from "@agent-run-lens/core";

export function EventDetails(props: { event: TraceEvent | null }) {
  if (!props.event) {
    return <section><h2>Event Details</h2><p>Select an event.</p></section>;
  }

  return (
    <section>
      <h2>Event Details</h2>
      <pre>{JSON.stringify(props.event, null, 2)}</pre>
    </section>
  );
}
```

```tsx
// apps/web/src/components/FailurePanel.tsx
import type { TraceEvent, TraceSummary } from "@agent-run-lens/core";

export function FailurePanel(props: { events: TraceEvent[]; summary: TraceSummary }) {
  const firstFailure = props.events.find((event) => event.id === props.summary.firstFailureEventId);

  return (
    <section>
      <h2>Failures</h2>
      {firstFailure ? <pre>{JSON.stringify(firstFailure, null, 2)}</pre> : <p>No failures recorded.</p>}
    </section>
  );
}
```

```tsx
// apps/web/src/components/DiffPanel.tsx
import type { TraceEvent } from "@agent-run-lens/core";

export function DiffPanel(props: { events: TraceEvent[] }) {
  const patches = props.events.filter((event) => event.type === "file_patch");

  return (
    <section>
      <h2>File Diffs</h2>
      {patches.length === 0 ? <p>No file patches recorded.</p> : patches.map((event) => <pre key={event.id}>{String((event.output as { patch?: unknown } | undefined)?.patch ?? "")}</pre>)}
    </section>
  );
}
```

Add `apps/web/src/styles.css`:

```css
:root {
  color: #172026;
  background: #f7f8fa;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.shell {
  display: grid;
  grid-template-columns: 280px minmax(360px, 1fr) minmax(360px, 520px);
  min-height: 100vh;
}

.sidebar,
.timeline,
.details {
  border-right: 1px solid #dde2e7;
  padding: 16px;
  overflow: auto;
}

textarea {
  width: 100%;
  min-height: 360px;
  font-family: ui-monospace, "Cascadia Code", monospace;
  font-size: 12px;
}

.event {
  display: grid;
  grid-template-columns: 150px 1fr 90px;
  width: 100%;
  border: 1px solid #d8dee4;
  border-radius: 6px;
  background: white;
  padding: 10px;
  margin-bottom: 8px;
  text-align: left;
}

.event.selected {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.14);
}

pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #ffffff;
  border: 1px solid #d8dee4;
  border-radius: 6px;
  padding: 12px;
}

.notice {
  border: 1px solid #d8a200;
  background: #fff8df;
  border-radius: 6px;
  padding: 8px;
}
```

- [ ] **Step 7: Run tests, type checks, and build**

Run: `pnpm test apps/web/src/trace-model.test.ts`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/web check`

Expected: PASS.

Run: `pnpm --filter @agent-run-lens/web build`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat: add local trace viewer"
```

## Task 9: Connect Command-Line View Command To Web Viewer

**Files:**
- Create: `packages/cli/src/server.ts`
- Create: `packages/cli/src/commands/view.ts`
- Modify: `packages/cli/src/main.ts`
- Modify: `packages/cli/src/main.test.ts`

- [ ] **Step 1: Extend argument parsing test**

Modify `packages/cli/src/main.test.ts` to include:

```ts
it("parses view command", () => {
  expect(parseArguments(["view", "examples/traces/latest.trace.jsonl"])).toEqual({
    command: "view",
    traceFile: "examples/traces/latest.trace.jsonl"
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test packages/cli/src/main.test.ts`

Expected: FAIL because the view command is not parsed.

- [ ] **Step 3: Implement local server helper**

Add `packages/cli/src/server.ts`:

```ts
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jsonl": "application/x-ndjson; charset=utf-8"
};

export async function startViewerServer(traceFile: string, port = 4173): Promise<string> {
  const webRoot = resolve("apps/web/dist");
  const tracePath = resolve(traceFile);

  const server = createServer(async (request, response) => {
    try {
      if (request.url === "/trace") {
        response.writeHead(200, { "Content-Type": contentTypes[".jsonl"] });
        response.end(await readFile(tracePath, "utf8"));
        return;
      }

      const pathName = request.url === "/" ? "/index.html" : request.url ?? "/index.html";
      const filePath = join(webRoot, pathName);
      response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await new Promise<void>((resolveStart) => {
    server.listen(port, "127.0.0.1", resolveStart);
  });

  return `http://127.0.0.1:${port}`;
}
```

- [ ] **Step 4: Implement view command**

Add `packages/cli/src/commands/view.ts`:

```ts
import { startViewerServer } from "../server.js";

export async function runViewCommand(traceFile: string): Promise<void> {
  const url = await startViewerServer(traceFile);
  console.log(`AgentRunLens viewer running at ${url}`);
}
```

- [ ] **Step 5: Wire command parsing and dispatch**

Modify `packages/cli/src/main.ts` so `ParsedArguments` includes:

```ts
| { command: "view"; traceFile: string }
```

Add parsing before export:

```ts
if (command === "view" && rest[0]) {
  return { command: "view", traceFile: rest[0] };
}
```

Import and dispatch:

```ts
import { runViewCommand } from "./commands/view.js";
```

```ts
if (parsed.command === "view") {
  await runViewCommand(parsed.traceFile);
  return;
}
```

Add help line:

```text
  agent-run-lens view <trace-file>
```

- [ ] **Step 6: Run checks**

Run: `pnpm test packages/cli/src/main.test.ts`

Expected: PASS.

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/cli
git commit -m "feat: serve traces in local viewer"
```

## Task 10: Documentation And End-To-End Verification

**Files:**
- Create: `README.md`
- Create: `docs/trace-format.md`
- Modify: `package.json`

- [ ] **Step 1: Add read me**

Add `README.md`:

```md
# AgentRunLens

AgentRunLens is a local-first black box recorder for artificial intelligence agent
runs. It records prompts, decisions, tool calls, shell commands, file patches,
failures, retries, and final results into a portable newline-delimited JSON
trace file.

The first release includes a deterministic offline demonstration and a local web
viewer. The demonstration shows an agent fixing a failing `normalizeEmail` test,
then lets you inspect the full run timeline and file diff.

## Quickstart

```bash
pnpm install
pnpm build
pnpm run agent-run-lens -- demo --offline
pnpm run agent-run-lens -- view examples/traces/latest.trace.jsonl
```

## Optional OpenAI Demonstration

```bash
OPENAI_API_KEY=your_key pnpm run agent-run-lens -- demo --openai
```

If `OPENAI_API_KEY` is not set, use the offline demonstration.

## Export A Trace

```bash
pnpm run agent-run-lens -- export examples/traces/latest.trace.jsonl
```

The export command writes a folder containing the original trace and a generated
summary.
```

- [ ] **Step 2: Add trace format documentation**

Add `docs/trace-format.md`:

```md
# Trace Format

AgentRunLens stores traces as newline-delimited JSON. Each line is one event.

Required fields:

- `id`: unique event identifier within the run.
- `runId`: identifier shared by all events in a run.
- `timestamp`: ISO 8601 timestamp.
- `type`: event type, such as `shell_command` or `file_patch`.

Optional fields:

- `status`: `started`, `success`, `error`, or `skipped`.
- `durationMs`: event duration in milliseconds.
- `summary`: short human-readable event summary.
- `input`: event input payload.
- `output`: event output payload.
- `metadata`: additional structured metadata.
```

- [ ] **Step 3: Add full verification script**

Modify root `package.json` scripts:

```json
"verify": "pnpm build && pnpm test"
```

- [ ] **Step 4: Run full verification**

Run: `pnpm verify`

Expected: PASS.

- [ ] **Step 5: Run offline demonstration**

Run: `pnpm run agent-run-lens -- demo --offline`

Expected: command prints a path ending in `examples/traces/latest.trace.jsonl`.

- [ ] **Step 6: Export demonstration trace**

Run: `pnpm run agent-run-lens -- export examples/traces/latest.trace.jsonl`

Expected: command prints a path beginning with `agent-run-lens-export-`.

- [ ] **Step 7: Build web viewer**

Run: `pnpm --filter @agent-run-lens/web build`

Expected: PASS and `apps/web/dist` exists.

- [ ] **Step 8: Commit**

```bash
git add README.md docs/trace-format.md package.json
git commit -m "docs: add AgentRunLens quickstart"
```

## Coverage Review

- Core trace events, validation, reading, writing, and summary derivation are covered by Tasks 2, 3, and 4.
- The deterministic offline demonstration is covered by Task 5.
- The command-line demonstration, export, and view commands are covered by Tasks 6 and 9.
- The optional OpenAI path is covered by Task 7.
- The local web viewer is covered by Task 8.
- Documentation and complete verification are covered by Task 10.
