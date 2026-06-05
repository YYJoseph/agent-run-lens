import { describe, expect, it } from "vitest";
import { parseArguments } from "./main.js";

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
});
