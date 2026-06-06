import { startViewerServer } from "../server.js";

export async function runViewCommand(traceFile: string): Promise<void> {
  const url = await startViewerServer(traceFile);
  console.log(`AgentRunLens viewer running at ${url}`);
}
