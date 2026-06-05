import { afterEach, describe, expect, it, vi } from "vitest";
import { assertOpenAiKey, parseOpenAiResponseText, requestOpenAiPatch } from "./openai-demo.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("OpenAI demonstration", () => {
  it("returns a readable message when the key is missing", () => {
    expect(() => assertOpenAiKey(undefined)).toThrow("OPENAI_API_KEY is required");
  });

  it("requests the Responses endpoint with the configured model and prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [{ type: "output_text", text: "Use value.trim().toLowerCase()." }]
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TRACEFORGE_OPENAI_MODEL", "custom-model");

    const result = await requestOpenAiPatch("test-key", "Fix normalizeEmail");

    expect(result).toBe("Use value.trim().toLowerCase().");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "custom-model",
          input: "Fix normalizeEmail"
        })
      })
    );
  });

  it("parses raw Responses text content", () => {
    expect(
      parseOpenAiResponseText({
        output: [
          {
            content: [
              { type: "input_text", text: "ignored" },
              { type: "output_text", text: "Patch the email normalizer." }
            ]
          }
        ]
      })
    ).toBe("Patch the email normalizer.");
  });

  it("throws a sanitized and capped error for non-OK responses", async () => {
    const apiKey = "sk-secret";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () =>
        JSON.stringify({
          error: {
            message: `quota exceeded for ${apiKey} with Bearer leaked-token ${"x".repeat(500)}`,
            code: "rate_limit_exceeded"
          }
        })
    });
    vi.stubGlobal("fetch", fetchMock);

    let message = "";
    try {
      await requestOpenAiPatch(apiKey, "Fix normalizeEmail");
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toMatch(/^OpenAI Responses request failed with 429: rate_limit_exceeded: quota exceeded/);
    expect(message).not.toContain(apiKey);
    expect(message).not.toMatch(/Bearer leaked-token/);
    expect(message).toMatch(/^.{1,240}$/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error when Responses output has no text", () => {
    expect(() => parseOpenAiResponseText({ output: [{ content: [{ type: "output_text" }] }] })).toThrow(
      "OpenAI Responses output did not include text content"
    );
  });
});
