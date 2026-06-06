# AgentRunLens

AgentRunLens is a local-first black box recorder for artificial intelligence agent
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
corepack pnpm run agent-run-lens -- demo --offline
corepack pnpm run agent-run-lens -- view examples/traces/latest.trace.jsonl
```

## Optional OpenAI Demonstration

POSIX shells:

```bash
OPENAI_API_KEY=your_key corepack pnpm run agent-run-lens -- demo --openai
```

PowerShell:

```powershell
$env:OPENAI_API_KEY="your_key"; corepack pnpm run agent-run-lens -- demo --openai
```

Command Prompt:

```cmd
set "OPENAI_API_KEY=your_key" && corepack pnpm run agent-run-lens -- demo --openai
```

If `OPENAI_API_KEY` is not set, use the offline demonstration.

## Export A Trace

```bash
corepack pnpm run agent-run-lens -- export examples/traces/latest.trace.jsonl
```

The export command writes a folder containing the original trace, a generated
summary, captured file diffs, and safe environment metadata.
