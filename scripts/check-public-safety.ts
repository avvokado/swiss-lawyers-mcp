import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

type Finding = {
  file: string;
  line: number;
  rule: string;
};

const ignoredDirectories = new Set([
  ".git",
  "dist",
  "node_modules",
]);

const checkedExtensions = new Set([
  ".js",
  ".json",
  ".md",
  ".ts",
]);

const blockedPatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: "PANART account or organisation reference", pattern: /\bPANART(?:-Marketing)?\b/i },
  { name: "private repository reference", pattern: /\bavvokado\.ch-mcp\b/i },
  { name: "Codex operating notes", pattern: /\bCodex\b/i },
  { name: "GitHub ruleset or bypass instructions", pattern: /\b(?:ruleset|bypass|current_user_can_bypass)\b/i },
  { name: "private PR workflow notes", pattern: /\bgithub-pr-workflow\b/i },
  { name: "GitHub CLI operational command", pattern: /\bgh\s+(?:api|pr)\b/i },
];

function hasCheckedExtension(filePath: string): boolean {
  return [...checkedExtensions].some((extension) => filePath.endsWith(extension));
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(path));
      continue;
    }

    if (entry.isFile() && hasCheckedExtension(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

async function scanFile(root: string, filePath: string): Promise<Finding[]> {
  const relativePath = relative(root, filePath).replace(/\\/g, "/");

  if (relativePath === "scripts/check-public-safety.ts") {
    return [];
  }

  const content = await readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const findings: Finding[] = [];

  for (const [index, line] of lines.entries()) {
    for (const blockedPattern of blockedPatterns) {
      if (blockedPattern.pattern.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          rule: blockedPattern.name,
        });
      }
    }
  }

  return findings;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const files = await collectFiles(root);
  const findings = (await Promise.all(files.map((file) => scanFile(root, file))))
    .flat();

  if (findings.length === 0) {
    console.log("Public safety check passed.");
    return;
  }

  console.error("Public safety check failed. Potential internal content found:");

  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.rule}`);
  }

  console.error("");
  console.error("Move internal workflow notes outside this public repository.");
  process.exit(1);
}

main().catch((error) => {
  console.error("Public safety check failed unexpectedly.");
  console.error(error);
  process.exit(1);
});
