import { describe, expect, it } from "vitest";
import { assertOpenAiKey } from "./openai-demo.js";

describe("OpenAI demonstration", () => {
  it("returns a readable message when the key is missing", () => {
    expect(() => assertOpenAiKey(undefined)).toThrow("OPENAI_API_KEY is required");
  });
});
