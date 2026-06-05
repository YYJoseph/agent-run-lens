#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export type ParsedArguments =
  | { command: "demo"; mode: "offline" | "openai" }
  | { command: "export"; traceFile: string }
  | { command: "view"; traceFile: string }
  | { command: "help" };

export function parseArguments(args: string[]): ParsedArguments {
  const [command, ...rest] = args;

  if (command === "demo") {
    if (rest.includes("--openai")) {
      return { command: "demo", mode: "openai" };
    }

    return { command: "demo", mode: "offline" };
  }

  if (command === "export" && rest[0]) {
    return { command: "export", traceFile: rest[0] };
  }

  if (command === "view" && rest[0]) {
    return { command: "view", traceFile: rest[0] };
  }

  return { command: "help" };
}

export function helpText(): string {
  return [
    "TraceForge command-line tools",
    "",
    "Usage:",
    "  traceforge demo --offline",
    "  traceforge demo --openai",
    "  traceforge export <trace-file>",
    "  traceforge view <trace-file>"
  ].join("\n");
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const parsed = parseArguments(args);

  if (parsed.command === "demo") {
    const { runDemoCommand } = await import("./commands/demo.js");
    await runDemoCommand(parsed.mode);
    return;
  }

  if (parsed.command === "export") {
    const { runExportCommand } = await import("./commands/export.js");
    await runExportCommand(parsed.traceFile);
    return;
  }

  if (parsed.command === "view") {
    const { runViewCommand } = await import("./commands/view.js");
    await runViewCommand(parsed.traceFile);
    return;
  }

  console.log(helpText());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
