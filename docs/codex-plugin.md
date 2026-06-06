# Codex Local Personal Plugin Guide

AgentRunLens can be used as a Codex local personal plugin. In this setup, Codex
can follow the plugin instructions to run the offline demonstration, open the
local viewer, and export a trace bundle without requiring the user to remember
every command.

## When This Is Useful

Use the plugin when you want Codex to help with:

- Running an AgentRunLens offline demonstration
- Opening the latest trace in the local viewer
- Exporting a trace bundle for review
- Recording an important artificial intelligence agent project for later review
- Preparing a process record for an open source demo or team discussion

## Example Codex Prompts

```text
Use AgentRunLens to run an offline demonstration.
```

```text
Use AgentRunLens to open the latest trace in the local viewer.
```

```text
Use AgentRunLens to export the latest trace bundle for review.
```

## Local-First Behavior

The plugin is local-first. It does not automatically record every Codex task,
and it does not upload trace files by itself. You explicitly choose when a run
should be recorded, reviewed, or exported.

## 中文说明

作者已经把 AgentRunLens 做成了 Codex 的本地个人插件，方便在重要项目复盘、代理调试、开源展示和团队审查时直接使用。你可以让 Codex 调用 AgentRunLens 的演示、查看和导出命令，而不用每次手动记住完整命令。

推荐其他创作者也尝试这种方式：把自己的代理工具做成本地个人插件。这样既能保留开源项目的独立性，又能让日常使用更方便，特别适合需要全程记录项目构建过程的重要工作。
