import { resolve } from "node:path";

type RunDemoOptions = {
  workspacePath: string;
  tracePath: string;
};

type DemoAgentModule = {
  runOfflineDemo(options: RunDemoOptions): Promise<string>;
  runOpenAiDemo(options: RunDemoOptions): Promise<string>;
};

const demoAgentPackage = "@agent-run-lens/demo-agent";

async function loadDemoAgent(): Promise<DemoAgentModule> {
  return (await import(demoAgentPackage)) as DemoAgentModule;
}

export async function runDemoCommand(mode: "offline" | "openai", rootPath = process.cwd()): Promise<void> {
  const tracePath = resolve(rootPath, "examples", "traces", "latest.trace.jsonl");
  const workspacePath = resolve(rootPath, "examples", "fixtures", "offline-normalize-email");

  if (mode === "offline") {
    const demoAgent = await loadDemoAgent();
    const outputPath = await demoAgent.runOfflineDemo({ workspacePath, tracePath });
    console.log(`Trace written to ${outputPath}`);
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY is not set. Run `agent-run-lens demo --offline` for the local demonstration.");
    return;
  }

  const demoAgent = await loadDemoAgent();
  const outputPath = await demoAgent.runOpenAiDemo({ workspacePath, tracePath });
  console.log(`Trace written to ${outputPath}`);
}
