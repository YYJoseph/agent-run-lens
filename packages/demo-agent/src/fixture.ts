import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function createNormalizeEmailFixture(workspacePath: string): Promise<void> {
  await mkdir(workspacePath, { recursive: true });
  await writeFile(
    join(workspacePath, "package.json"),
    JSON.stringify(
      {
        type: "module",
        scripts: {
          test: "node normalize-email.test.mjs"
        }
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(
    join(workspacePath, "normalize-email.mjs"),
    [
      "export function normalizeEmail(value) {",
      "  return value.toLowerCase();",
      "}",
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    join(workspacePath, "normalize-email.test.mjs"),
    [
      "import { strict as assert } from 'node:assert';",
      "import { normalizeEmail } from './normalize-email.mjs';",
      "",
      "assert.equal(normalizeEmail(' User@Example.COM '), 'user@example.com');",
      "console.log('normalizeEmail tests passed');",
      ""
    ].join("\n"),
    "utf8"
  );
}

export async function patchNormalizeEmail(workspacePath: string): Promise<string> {
  const filePath = join(workspacePath, "normalize-email.mjs");
  const before = await readFile(filePath, "utf8");
  const after = before.replace("return value.toLowerCase();", "return value.trim().toLowerCase();");
  await writeFile(filePath, after, "utf8");
  return [
    "--- a/normalize-email.mjs",
    "+++ b/normalize-email.mjs",
    "@@",
    "-  return value.toLowerCase();",
    "+  return value.trim().toLowerCase();"
  ].join("\n");
}
