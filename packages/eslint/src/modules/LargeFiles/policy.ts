import path from "node:path";

import { DEFAULT_LARGE_FILE_LIMIT, type LargeFileEntry, type LargeFilesPolicy } from "@o-feod/config";
export { DEFAULT_LARGE_FILE_LIMIT };
export type { LargeFileEntry, LargeFilesPolicy };

export const largeFilesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    thresholds: {
      type: "object",
      additionalProperties: { type: "integer", minimum: 1 },
      propertyNames: { pattern: "^(default|\\.[^./\\\\]+)$" },
    },
    files: {
      type: "object",
      propertyNames: { minLength: 1 },
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        required: ["ceiling", "plan"],
        properties: { ceiling: { type: "integer", minimum: 1 }, plan: { type: "string", minLength: 1 } },
      },
    },
  },
};

export function sizeLimit(file: string, thresholds: Record<string, number> | undefined) {
  return thresholds?.[path.posix.extname(file)] ?? thresholds?.default ?? DEFAULT_LARGE_FILE_LIMIT;
}

export type LargeFileFinding =
  | { id: "needsEntry"; limit: number }
  | { id: "grew"; ceiling: number }
  | { id: "withinLimit"; limit: number }
  | { id: "shrank"; ceiling: number };

/**
 * Decide what a file's size means against the registry. The ceiling ratchets
 * down: growth, a stale ceiling and a no-longer-needed entry are all findings.
 */
export function checkLargeFile(file: string, lines: number, policy: LargeFilesPolicy): LargeFileFinding | undefined {
  const limit = sizeLimit(file, policy.thresholds);
  const entry = policy.files?.[file];
  if (!entry) return lines > limit ? { id: "needsEntry", limit } : undefined;
  if (lines > entry.ceiling) return { id: "grew", ceiling: entry.ceiling };
  if (lines <= limit) return { id: "withinLimit", limit };
  if (lines < entry.ceiling) return { id: "shrank", ceiling: entry.ceiling };
  return undefined;
}

export const lineCount = (text: string) => text.split("\n").length - 1;
