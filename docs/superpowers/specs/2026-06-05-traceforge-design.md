# AgentRunLens Design Spec

## Summary

AgentRunLens is a local-first black box recorder for AI agents. It captures the
important events in an agent run, stores them in a portable trace format, and
shows them in a clear web UI so developers can debug behavior, inspect failures,
review file changes, and share reproducible traces.

The first version targets a practical open-source developer tool with a useful
visual interface. It will ship with an offline demo agent that requires no API
key and an optional OpenAI-backed demo for users who want to record a real LLM
run.

## Goals

- Make agent behavior inspectable through a chronological trace timeline.
- Let users run a complete demo locally without external services.
- Support an optional real LLM demo when `OPENAI_API_KEY` is available.
- Provide a small, clean TypeScript recorder API that future integrations can
  build on.
- Show failures, retries, tool calls, command output, and file diffs in a web UI.
- Export a shareable trace bundle for debugging or public examples.

## Non-Goals

- Build a general-purpose autonomous coding agent in the first version.
- Support every agent framework at launch.
- Provide cloud hosting, team accounts, authentication, or collaboration.
- Implement full deterministic replay of arbitrary commands.
- Store private traces on external servers.

## Primary User

The primary user is a developer building or evaluating AI agents who wants to
answer questions such as:

- What did the agent do step by step?
- Which tool call or command failed?
- What files did it read or change?
- Did it retry, and what changed between attempts?
- Can I share this run with another developer in a reproducible form?

## Product Shape

AgentRunLens will expose three main surfaces:

- `@agent-run-lens/core`: TypeScript event types, trace writer, and recorder API.
- `agent-run-lens` CLI: demo execution, trace viewing, and export commands.
- `apps/web`: React/Vite trace viewer for timeline, details, diffs, and failures.

The recommended first-run experience is:

```bash
npm install
npm run build
npm run agent-run-lens -- demo --offline
npm run agent-run-lens -- view ./traces/latest.trace.jsonl
```

## CLI Commands

### `agent-run-lens demo --offline`

Runs a deterministic local demo against a tiny TypeScript fixture project. The
demo simulates an agent debugging a failing test:

1. Receive a user request to fix a bug.
2. Inspect the fixture files.
3. Run the fixture test command.
4. Record the failing output.
5. Patch the bug.
6. Run the tests again.
7. Record the passing output.
8. Write the trace to `traces/latest.trace.jsonl`.

The offline demo must be stable in CI and must not require network access or an
API key.

### `agent-run-lens demo --openai`

Runs a real LLM-backed demo when `OPENAI_API_KEY` is present. It uses the same
fixture and trace schema as the offline demo. If the key is missing, the CLI
prints a short message pointing users to `agent-run-lens demo --offline`.

The OpenAI demo is optional and must not be required for tests.

### `agent-run-lens view <trace-file>`

Starts a local web server and opens or prints a URL for the trace viewer. The
viewer loads a JSONL trace and displays the run timeline, event details, file
diffs, errors, and run stats.

### `agent-run-lens export <trace-file>`

Creates a shareable bundle containing:

- The original trace JSONL.
- A generated `summary.md`.
- Any captured file diffs.
- Basic environment metadata.

The first version writes an export folder. Zip packaging is deferred until after
the MVP.

## Trace Format

The MVP trace format is newline-delimited JSON. Each line is one event. JSONL is
chosen because it can be streamed while the run is happening, is easy to inspect
in GitHub, and can later be converted to SQLite, OpenTelemetry, or other stores.

All events share a common envelope:

```ts
type TraceEvent = {
  id: string;
  runId: string;
  timestamp: string;
  type: TraceEventType;
  status?: "started" | "success" | "error" | "skipped";
  durationMs?: number;
  summary?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
};
```

MVP event types:

- `run_started`
- `user_prompt`
- `model_message`
- `decision`
- `tool_call_started`
- `tool_call_completed`
- `shell_command`
- `file_read`
- `file_patch`
- `test_result`
- `error`
- `retry`
- `run_completed`

The schema remains permissive in the first version, but core fields must be
validated before the viewer renders a trace.

## Recorder API

The core package exposes a simple API:

```ts
const recorder = await createRecorder({
  runName: "offline-demo",
  outputPath: "traces/latest.trace.jsonl",
});

await recorder.record({
  type: "user_prompt",
  summary: "Fix the failing test",
  input: { prompt },
});

await recorder.end({ status: "success" });
```

The API optimizes for clarity over abstraction. Convenience helpers such as
`recordShellCommand`, `recordFilePatch`, and `recordError` are included only when
they remove repeated event-shaping code in the demo and CLI.

## Web UI

The viewer is clear and information-dense, not decorative. The first screen is
the trace inspection experience, not a landing page.

Layout:

- Left sidebar: run metadata, event type filters, status filters, and basic
  stats.
- Center pane: chronological event timeline with status, type, summary, and
  duration.
- Right pane: selected event details, including input, output, metadata, and
  errors.
- Diff view: file patches rendered in a readable split or unified diff format.
- Failure view: failed commands, error events, last successful event, and retry
  count.

Expected interactions:

- Select an event from the timeline.
- Filter by event type or status.
- Jump to the first failure.
- Copy selected event JSON.
- Export the trace bundle from the UI or link to the CLI export command.

## Demo Fixture

The offline fixture is intentionally small. It uses a TypeScript
`normalizeEmail` function with a failing test for whitespace trimming before
lowercasing.

The fixture must be boring on purpose. The star of the demo is the trace, not
the bug.

## Data Flow

1. CLI creates a recorder with a run id and output path.
2. Demo agent records user prompt and initial decision events.
3. Demo agent reads files, runs commands, records outputs, and writes patches.
4. Recorder appends each event to JSONL immediately.
5. Viewer loads the JSONL trace, validates event envelopes, and builds derived
   indexes for timeline, failures, diffs, and stats.
6. Export command reads the trace and writes a portable bundle.

## Error Handling

- Invalid trace file: viewer shows a readable parse error with line number when
  possible.
- Unknown event type: viewer renders it as an unknown event instead of failing.
- Missing OpenAI key: `demo --openai` exits with a clear message and suggests
  `demo --offline`.
- Failed fixture command: recorded as a normal `shell_command` or `test_result`
  event with `status: "error"`.
- Recorder write failure: CLI exits non-zero and prints the output path that
  failed.

## Testing Strategy

Core package:

- Unit tests for event validation.
- Unit tests for JSONL writing and reading.
- Unit tests for trace summary derivation.

CLI:

- Integration test for `demo --offline` producing a valid trace.
- Integration test for missing `OPENAI_API_KEY` behavior.
- Snapshot or structural test for export output.

Web:

- Component tests for timeline rendering.
- Component tests for event details and failure view.
- Fixture-based test that loads a sample trace and verifies the first failure
  and final success are visible.

End-to-end:

- One smoke test that runs the offline demo and verifies the viewer can load the
  generated trace.

## Repository Structure

```text
.
|-- apps/
|   `-- web/
|-- examples/
|   |-- fixtures/
|   `-- traces/
|-- packages/
|   |-- cli/
|   |-- core/
|   `-- demo-agent/
|-- docs/
|   `-- superpowers/
|       `-- specs/
`-- README.md
```

## MVP Acceptance Criteria

- `demo --offline` creates a valid JSONL trace without network access.
- `view <trace-file>` displays the trace in a local web UI.
- Timeline, event details, failures, and file diffs are visible in the UI.
- `export <trace-file>` creates a shareable trace bundle.
- `demo --openai` works when `OPENAI_API_KEY` is set and degrades clearly when it
  is not.
- The README explains the project value, quickstart, trace format, and demo
  story.

## Future Extensions

- Adapters for LangChain, AutoGen, OpenAI Agents SDK, and other frameworks.
- Import from Codex or other agent logs when available.
- OpenTelemetry export.
- SQLite trace store for large runs.
- GitHub Action that uploads trace bundles as CI artifacts.
- VS Code extension for opening traces inside the editor.
- Policy checks for risky commands, sensitive files, and secret leakage.
