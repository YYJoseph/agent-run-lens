# TraceForge

TraceForge is a local-first black box recorder for artificial intelligence agent
runs. It records prompts, decisions, tool calls, shell commands, file patches,
failures, retries, and final results into a portable newline-delimited JSON
trace file.

The first release includes a deterministic offline demonstration, an optional
OpenAI demonstration, a local web viewer, and an export command for packaging a
trace with a generated summary.

## Quickstart

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm run traceforge -- demo --offline
corepack pnpm run traceforge -- view examples/traces/latest.trace.jsonl
```

## Optional OpenAI Demonstration

```bash
OPENAI_API_KEY=your_key corepack pnpm run traceforge -- demo --openai
```

If `OPENAI_API_KEY` is not set, use the offline demonstration.

## Export A Trace

```bash
corepack pnpm run traceforge -- export examples/traces/latest.trace.jsonl
```

The export command writes a folder containing the original trace and a generated
summary.
