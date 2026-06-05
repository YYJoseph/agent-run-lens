import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseTraceEvent, type TraceEvent } from "./events.js";

export async function appendTraceEvent(filePath: string, event: TraceEvent): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readTraceFile(filePath: string): Promise<TraceEvent[]> {
  const text = await readFile(filePath, "utf8");
  const events: TraceEvent[] = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "") {
      continue;
    }

    try {
      events.push(parseTraceEvent(JSON.parse(line)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid trace file at line ${index + 1}: ${message}`);
    }
  }

  return events;
}
