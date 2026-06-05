import { exportTraceFolder } from "../export-trace.js";

export async function runExportCommand(traceFile: string): Promise<void> {
  const exportPath = await exportTraceFolder(traceFile);
  console.log(`Trace exported to ${exportPath}`);
}
