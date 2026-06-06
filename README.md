# AgentRunLens

AgentRunLens is a local-first black box recorder for artificial intelligence agent
runs. It records prompts, decisions, tool calls, shell commands, file patches,
failures, retries, and final results into a portable newline-delimited JSON
trace file.

The first release includes a deterministic offline demonstration, an optional
OpenAI demonstration, a local web viewer, and an export command for packaging a
trace with a generated summary.

## 中文介绍

AgentRunLens 是一个面向人工智能代理项目的本地优先黑匣子记录器。它可以把一次代理运行中的提示词、决策过程、工具调用、命令执行、文件修改、失败、重试和最终结果记录成可携带的 newline-delimited JSON 轨迹文件，并通过本地网页查看器清楚展示出来。

这个项目特别适合中国创作者、独立开发者和团队在构建重要人工智能代理项目时使用。比如你正在做一个复杂的自动化开发代理、研究型代理、多代理协作系统，或者一个需要长期维护的开源项目，那么仅仅看到最终代码是不够的。你可能还需要完整复盘项目是怎样一步一步构建出来的：代理调用了哪些工具、哪些地方失败过、哪些文件被修改、哪一步最关键、最终结果是否和目标一致。AgentRunLens 的价值就在这里，它让项目构建过程从“只看结果”变成“过程和结果都可以检查”。

典型使用场景包括：

- 重要项目的全程复盘：记录一次人工智能代理从接收任务到完成交付的完整过程，方便事后检查、总结和分享。
- 代理调试：查看工具调用、文件差异、失败事件和重试过程，快速定位代理为什么偏离目标。
- 开源项目展示：把代理构建过程导出成可以复盘的运行包，让其他人更容易理解项目是怎样被完成的。
- 团队协作审查：当多人共同评估一个代理输出结果时，可以同时查看过程记录，而不是只讨论最终文件。
- 教学和演示：用离线演示快速生成示例轨迹，再通过可视化界面展示人工智能代理的运行链路。

作者已经将 AgentRunLens 做成了 Codex 的本地个人插件，方便在上述场景中直接使用。也就是说，当你在 Codex 里需要演示、查看或导出代理运行记录时，可以通过插件说明让 Codex 自动调用这个项目的命令，而不必每次手动记住完整命令。推荐其他创作者也尝试把自己的代理工具做成本地个人插件：这样既能保留开源项目的独立性，又能让日常使用更顺手。

目前这个插件不会自动记录你所有的 Codex 工作。它更适合在你明确需要记录、复盘、演示或导出某一次重要代理运行时启用。对于真正重要的项目，尤其是需要证明构建过程、分析失败原因、沉淀经验或者公开展示创作过程的项目，AgentRunLens 会非常有必要。

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
