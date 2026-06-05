import { startViewerServer } from "../server.js";

export async function runViewCommand(traceFile: string): Promise<void> {
  const url = await startViewerServer(traceFile);
  console.log(`TraceForge viewer running at ${url}`);
}
