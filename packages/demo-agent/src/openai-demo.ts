import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRecorder } from "@agent-run-lens/core";
import { createNormalizeEmailFixture, patchNormalizeEmail } from "./fixture.js";
import type { RunOfflineDemoOptions } from "./offline-demo.js";

export type RunOpenAiDemoOptions = RunOfflineDemoOptions;

type CommandResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
};

type OpenAiResponse = {
  output?: unknown;
};

const maxOpenAiErrorDetailLength = 180;

export function assertOpenAiKey(value: string | undefined): string {
  if (!value) {
    throw new Error("OPENAI_API_KEY is required");
  }

  return value;
}

async function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  const started = Date.now();
  return await new Promise<CommandResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: CommandResult) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };
    const finishWithError = (error: Error) => {
      finish({ exitCode: null, stdout, stderr: stderr + String(error.message), durationMs: Date.now() - started });
    };

    const child = (() => {
      try {
        return spawn(command, args, { cwd });
      } catch (error) {
        finishWithError(error instanceof Error ? error : new Error(String(error)));
        return undefined;
      }
    })();

    if (!child) {
      return;
    }

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      finishWithError(error);
    });
    child.on("close", (exitCode) => {
      finish({ exitCode, stdout, stderr, durationMs: Date.now() - started });
    });
  });
}

function createNpmCommand(args: string[]) {
  if (process.platform !== "win32") {
    return { command: "npm", args };
  }

  return {
    command: process.execPath,
    args: [join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"), ...args]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOpenAiResponseText(body: OpenAiResponse): string {
  if (!Array.isArray(body.output)) {
    throw new Error("OpenAI Responses output did not include text content");
  }

  for (const item of body.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (!isRecord(content) || content.type !== "output_text" || typeof content.text !== "string") {
        continue;
      }

      if (content.text.length > 0) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI Responses output did not include text content");
}

function truncate(value: string): string {
  if (value.length <= maxOpenAiErrorDetailLength) {
    return value;
  }

  return `${value.slice(0, maxOpenAiErrorDetailLength - 3)}...`;
}

function redactOpenAiError(value: string, apiKey: string): string {
  let redacted = value.replace(/Bearer\s+[^\s"'\\]+/gi, "Bearer [REDACTED]");
  if (apiKey.length > 0) {
    redacted = redacted.split(apiKey).join("[REDACTED]");
  }

  return redacted;
}

function readOpenAiErrorDetail(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!isRecord(parsed) || !isRecord(parsed.error)) {
      return rawBody;
    }

    const parts = [];
    if (typeof parsed.error.code === "string" && parsed.error.code.length > 0) {
      parts.push(parsed.error.code);
    }
    if (typeof parsed.error.message === "string" && parsed.error.message.length > 0) {
      parts.push(parsed.error.message);
    }

    return parts.length > 0 ? parts.join(": ") : rawBody;
  } catch {
    return rawBody;
  }
}

function formatOpenAiError(status: number, rawBody: string, apiKey: string): string {
  const detail = truncate(redactOpenAiError(readOpenAiErrorDetail(rawBody), apiKey));
  return `OpenAI Responses request failed with ${status}: ${detail}`;
}

export async function requestOpenAiPatch(apiKey: string, prompt: string): Promise<string> {
  const model = process.env.TRACEFORGE_OPENAI_MODEL ?? "gpt-5.4-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(formatOpenAiError(response.status, errorText, apiKey));
  }

  return parseOpenAiResponseText((await response.json()) as OpenAiResponse);
}

export async function runOpenAiDemo(options: RunOpenAiDemoOptions): Promise<string> {
  const apiKey = assertOpenAiKey(process.env.OPENAI_API_KEY);
  await createNormalizeEmailFixture(options.workspacePath);
  const recorder = await createRecorder({ runName: "openai-normalize-email-demo", outputPath: options.tracePath });

  const prompt = [
    "Please fix the failing normalizeEmail test.",
    "The expected behavior is to normalize whitespace and letter casing for an email address."
  ].join(" ");
  await recorder.record({
    type: "user_prompt",
    summary: "Ask OpenAI how to fix normalizeEmail",
    input: { prompt }
  });

  const modelMessage = await requestOpenAiPatch(apiKey, prompt);
  await recorder.record({
    type: "model_message",
    status: "success",
    summary: "Receive OpenAI guidance for normalizeEmail",
    output: { message: modelMessage }
  });
  await recorder.record({
    type: "decision",
    summary: "Run the fixture tests before editing",
    output: { reason: "The failure output confirms the patch is addressing the observed bug." }
  });

  const npmTestCommand = createNpmCommand(["test"]);
  const firstTest = await runCommand(npmTestCommand.command, npmTestCommand.args, options.workspacePath);
  await recorder.record({
    type: "shell_command",
    status: firstTest.exitCode === 0 ? "success" : "error",
    durationMs: firstTest.durationMs,
    summary: "Run npm test before the fix",
    input: { command: "npm test", cwd: options.workspacePath },
    output: firstTest
  });

  const filePath = join(options.workspacePath, "normalize-email.mjs");
  await recorder.record({
    type: "file_read",
    status: "success",
    summary: "Read normalize-email.mjs",
    input: { path: filePath },
    output: { text: await readFile(filePath, "utf8") }
  });

  const patch = await patchNormalizeEmail(options.workspacePath);
  await recorder.record({
    type: "file_patch",
    status: "success",
    summary: "Apply normalizeEmail fix",
    input: { path: filePath },
    output: { patch, modelMessage }
  });
  await recorder.record({
    type: "retry",
    status: "started",
    summary: "Run tests again after patch"
  });

  const secondTest = await runCommand(npmTestCommand.command, npmTestCommand.args, options.workspacePath);
  await recorder.record({
    type: "test_result",
    status: secondTest.exitCode === 0 ? "success" : "error",
    durationMs: secondTest.durationMs,
    summary: "Run npm test after the fix",
    input: { command: "npm test", cwd: options.workspacePath },
    output: secondTest
  });
  await recorder.end({ status: secondTest.exitCode === 0 ? "success" : "error" });

  return options.tracePath;
}
