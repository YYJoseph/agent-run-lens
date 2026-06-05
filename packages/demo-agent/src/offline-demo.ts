import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRecorder } from "@traceforge/core";
import { createNormalizeEmailFixture, patchNormalizeEmail } from "./fixture.js";

export type RunOfflineDemoOptions = {
  workspacePath: string;
  tracePath: string;
};

async function runCommand(command: string, args: string[], cwd: string) {
  const started = Date.now();
  return await new Promise<{ exitCode: number | null; stdout: string; stderr: string; durationMs: number }>((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: { exitCode: number | null; stdout: string; stderr: string; durationMs: number }) => {
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

export async function runOfflineDemo(options: RunOfflineDemoOptions): Promise<string> {
  await createNormalizeEmailFixture(options.workspacePath);
  const recorder = await createRecorder({ runName: "offline-normalize-email-demo", outputPath: options.tracePath });

  await recorder.record({
    type: "user_prompt",
    summary: "Fix the failing normalizeEmail test",
    input: { prompt: "Please fix the failing normalizeEmail test." }
  });
  await recorder.record({
    type: "decision",
    summary: "Run the fixture tests before editing",
    output: { reason: "The failure output provides evidence for the fix." }
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
  await recorder.record({
    type: "file_read",
    status: "success",
    summary: "Read normalize-email.mjs",
    input: { path: join(options.workspacePath, "normalize-email.mjs") },
    output: { text: await readFile(join(options.workspacePath, "normalize-email.mjs"), "utf8") }
  });

  const patch = await patchNormalizeEmail(options.workspacePath);
  await recorder.record({
    type: "file_patch",
    status: "success",
    summary: "Trim whitespace before lowercasing",
    input: { path: join(options.workspacePath, "normalize-email.mjs") },
    output: { patch }
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
