# AgentRunLens 中文介绍

AgentRunLens 是一个面向人工智能代理项目的本地优先黑匣子记录器。它可以把一次代理运行中的提示词、决策过程、工具调用、命令执行、文件修改、失败、重试和最终结果记录成可携带的 newline-delimited JSON 轨迹文件，并通过本地网页查看器清楚展示出来。

这个项目特别适合中国创作者、独立开发者和团队在构建重要人工智能代理项目时使用。比如你正在做一个复杂的自动化开发代理、研究型代理、多代理协作系统，或者一个需要长期维护的开源项目，那么仅仅看到最终代码是不够的。你可能还需要完整复盘项目是怎样一步一步构建出来的：代理调用了哪些工具、哪些地方失败过、哪些文件被修改、哪一步最关键、最终结果是否和目标一致。

AgentRunLens 的价值就在这里：它让项目构建过程从“只看结果”变成“过程和结果都可以检查”。

## 典型使用场景

- 重要项目的全程复盘：记录一次人工智能代理从接收任务到完成交付的完整过程，方便事后检查、总结和分享。
- 代理调试：查看工具调用、文件差异、失败事件和重试过程，快速定位代理为什么偏离目标。
- 开源项目展示：把代理构建过程导出成可以复盘的运行包，让其他人更容易理解项目是怎样被完成的。
- 团队协作审查：当多人共同评估一个代理输出结果时，可以同时查看过程记录，而不是只讨论最终文件。
- 教学和演示：用离线演示快速生成示例轨迹，再通过可视化界面展示人工智能代理的运行链路。

## 为什么重要项目更需要它

当一个项目非常重要时，最终代码只是答案的一部分。你还需要知道：

- 代理为什么选择某个方案
- 它调用了哪些工具
- 它执行了哪些命令
- 它修改了哪些文件
- 它在哪一步失败过
- 它如何重试并恢复
- 最终结果是否符合最初目标

AgentRunLens 可以把这些过程保存下来，方便你复盘、展示、归档，也方便团队或开源社区一起审查。

## 快速开始

```bash
git clone https://github.com/YYJoseph/agent-run-lens.git
cd agent-run-lens
corepack enable
corepack pnpm install
corepack pnpm build
corepack pnpm run agent-run-lens -- demo --offline
corepack pnpm run agent-run-lens -- view examples/traces/latest.trace.jsonl
```

导出一份可以分享、归档和复盘的运行包：

```bash
corepack pnpm run agent-run-lens -- export examples/traces/latest.trace.jsonl
```

目前 AgentRunLens 不会自动记录你所有的 Codex 工作。它更适合在你明确需要记录、复盘、演示或导出某一次重要代理运行时启用。
