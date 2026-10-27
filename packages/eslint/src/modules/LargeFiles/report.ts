import fs from "node:fs";
import path from "node:path";
import { lineCount, sizeLimit, type LargeFilesPolicy } from "./policy.js";

export type LargeFileRow = {
  file: string;
  /** Current line count, or null when the registered file does not exist. */
  lines: number | null;
  ceiling: number;
  plan: string;
  /** Threshold that applies to this file's extension. */
  limit: number;
};

/** Registered files with their current size, biggest ceiling first. Sizes use the rule's own counter. */
export function largeFilesRows(options: { rootDir: string; policy: LargeFilesPolicy }): LargeFileRow[] {
  const rootDir = path.resolve(options.rootDir);
  return Object.entries(options.policy.files ?? {})
    .map(([file, entry]) => {
      let lines: number | null = null;
      try {
        lines = lineCount(fs.readFileSync(path.resolve(rootDir, file), "utf8"));
      } catch {
        // A missing file is reported as such; the large-files rule flags the stale entry.
      }
      return {
        file,
        lines,
        ceiling: entry.ceiling,
        plan: entry.plan,
        limit: sizeLimit(file, options.policy.thresholds),
      };
    })
    .sort((a, b) => b.ceiling - a.ceiling || a.file.localeCompare(b.file));
}

export type LargeFilesMarkdownOptions = {
  title?: string;
  /** Paragraph between the title and the table. */
  intro?: string;
  columns?: { file?: string; lines?: string; ceiling?: string; plan?: string };
  /** Shown instead of a line count for a missing file. */
  missing?: string;
};

const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/** Render rows as a Markdown table; wording and the output location belong to the caller. */
export function renderLargeFilesMarkdown(
  rows: readonly LargeFileRow[],
  options: LargeFilesMarkdownOptions = {},
): string {
  const columns = { file: "File", lines: "Lines", ceiling: "Ceiling", plan: "Split plan", ...options.columns };
  const missing = options.missing ?? "—";
  return [
    `# ${options.title ?? "Large files"}`,
    "",
    ...(options.intro ? [options.intro, ""] : []),
    `| ${columns.file} | ${columns.lines} | ${columns.ceiling} | ${columns.plan} |`,
    "| --- | ---: | ---: | --- |",
    ...rows.map(row => `| \`${cell(row.file)}\` | ${row.lines ?? missing} | ${row.ceiling} | ${cell(row.plan)} |`),
    "",
  ].join("\n");
}
