import { rm } from "node:fs/promises";
import { resolve } from "node:path";

type RunDemoOptions = {
  workspacePath: string;
  tracePath: string;
};

type DemoAgentModule = {
  runOfflineDemo(options: RunDemoOptions): Promise<string>;
  runOpenAiDemo(options: RunDemoOptions): Promise<string>;
};

const demoAgentPackage = "@traceforge/demo-agent";

async function loadDemoAgent(): Promise<DemoAgentModule> {
  return (await import(demoAgentPackage)) as DemoAgentModule;
}

export async function runDemoCommand(mode: "offline" | "openai"): Promise<void> {
  const tracePath = resolve("examples", "traces", "latest.trace.jsonl");
  const workspacePath = resolve("examples", "fixtures", "offline-normalize-email");

  await rm(tracePath, { force: true });
  const demoAgent = await loadDemoAgent();

  if (mode === "offline") {
    const outputPath = await demoAgent.runOfflineDemo({ workspacePath, tracePath });
    console.log(`Trace written to ${outputPath}`);
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY is not set. Run `traceforge demo --offline` for the local demonstration.");
    return;
  }

  const outputPath = await demoAgent.runOpenAiDemo({ workspacePath, tracePath });
  console.log(`Trace written to ${outputPath}`);
}
