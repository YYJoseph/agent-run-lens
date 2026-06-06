# AgentRunLens

AgentRunLens is a local-first black box recorder for artificial intelligence
agent runs. It records prompts, decisions, tool calls, shell commands, file
patches, failures, retries, and final results into a portable trace file that
can be reviewed in a local web viewer.

![AgentRunLens viewer preview](docs/assets/viewer-preview.svg)

## Why Use It

- Review how an important agent-built project was constructed from start to finish.
- Debug tool calls, shell commands, file changes, failures, and retries.
- Export a shareable run bundle for open source demos, team review, or issue reports.
- Keep the process evidence, not only the final files.

中文介绍请看 [docs/zh-CN.md](docs/zh-CN.md)。

## Quickstart

Requirements:

- Node.js 20 or newer
- Corepack
- Git

```bash
git clone https://github.com/YYJoseph/agent-run-lens.git
cd agent-run-lens
corepack enable
corepack pnpm install
corepack pnpm build
corepack pnpm run agent-run-lens -- demo --offline
corepack pnpm run agent-run-lens -- view examples/traces/latest.trace.jsonl
```

The offline demonstration writes the latest trace to:

```text
examples/traces/latest.trace.jsonl
```

Export a shareable run bundle:

```bash
corepack pnpm run agent-run-lens -- export examples/traces/latest.trace.jsonl
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

## Codex Local Personal Plugin

The author also uses AgentRunLens as a Codex local personal plugin, so Codex can
run the demo, open the viewer, and export trace bundles through natural language
requests.

See [docs/codex-plugin.md](docs/codex-plugin.md) for details.

## Documentation

- [Chinese introduction](docs/zh-CN.md)
- [Codex local personal plugin guide](docs/codex-plugin.md)
- [Trace format](docs/trace-format.md)

## Troubleshooting

If dependency installation fails, make sure Node.js 20 or newer is installed and
run `corepack enable` before installing again.

If `examples/traces/latest.trace.jsonl` does not exist, run:

```bash
corepack pnpm run agent-run-lens -- demo --offline
```

If the local viewer starts but the browser does not open automatically, copy the
printed local address into your browser manually.
