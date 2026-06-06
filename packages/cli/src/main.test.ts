import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runDemoCommand } from "./commands/demo.js";
import { helpText, parseArguments } from "./main.js";

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }
  vi.restoreAllMocks();
});

describe("command-line argument parsing", () => {
  it("parses offline demonstration command", () => {
    expect(parseArguments(["demo", "--offline"])).toEqual({ command: "demo", mode: "offline" });
  });

  it("parses export command", () => {
    expect(parseArguments(["export", "traces/latest.trace.jsonl"])).toEqual({
      command: "export",
      traceFile: "traces/latest.trace.jsonl"
    });
  });

  it("parses view command", () => {
    expect(parseArguments(["view", "examples/traces/latest.trace.jsonl"])).toEqual({
      command: "view",
      traceFile: "examples/traces/latest.trace.jsonl"
    });
  });

  it("keeps the latest trace when the OpenAI demonstration is missing an API key", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-run-lens-demo-test-"));
    const latestTrace = join(directory, "examples", "traces", "latest.trace.jsonl");
    const traceContent = "{\"id\":\"event_1\"}\n";

    delete process.env.OPENAI_API_KEY;
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await mkdir(join(directory, "examples", "traces"), { recursive: true });
      await writeFile(latestTrace, traceContent, "utf8");

      await runDemoCommand("openai", directory);

      expect(await readFile(latestTrace, "utf8")).toBe(traceContent);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe("command-line help", () => {
  it("uses the AgentRunLens product and command names", () => {
    expect(helpText()).toContain("AgentRunLens command-line tools");
    expect(helpText()).toContain("agent-run-lens demo --offline");
    expect(helpText()).not.toContain("TraceForge");
  });
});
