import { createIgnoreMatcher } from "../common/ignore.js";
import fs from "node:fs";
import path from "node:path";
import type { Rule } from "eslint";
import {
  getFilename,
  reportInventoryOnce,
} from "../modules/Architecture/index.js";

import { checkLargeFile, largeFilesSchema, lineCount, type LargeFilesPolicy } from "../modules/LargeFiles/index.js";

type Options = { largeFiles?: LargeFilesPolicy; rootDir?: string; ignore?: string | string[] };

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Require oversized files to be split or registered with a ceiling and a plan" },
    schema: [{ type: "object", additionalProperties: false, properties: {
      largeFiles: largeFilesSchema, rootDir: { type: "string" }, srcRoot: { type: "string" },
      ignore: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
    } }],
    messages: {
      needsEntry: "FEOD: {{file}} has {{lines}} lines, over the {{limit}} limit. Split it, or register it in extra.largeFiles.files with a ceiling and a split plan.",
      grew: "FEOD: {{file}} grew to {{lines}} lines, past its registry ceiling of {{ceiling}}. Split it instead of growing it.",
      shrank: "FEOD: {{file}} shrank to {{lines}} lines. Lower its ceiling in extra.largeFiles.files from {{ceiling}} to {{lines}}.",
      withinLimit: "FEOD: {{file}} is now {{lines}} lines, within the {{limit}} limit. Remove it from extra.largeFiles.files.",
      stale: "FEOD: '{{file}}' is registered in extra.largeFiles.files but does not exist. Remove the entry.",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    const policy = options.largeFiles;
    if (!policy) return {};
    const filename = getFilename(context);
    if (!filename || filename.startsWith("<")) return {};
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const absolute = path.resolve(rootDir, filename);
    if (createIgnoreMatcher(options.ignore, rootDir)(absolute)) return {};
    const file = path.relative(rootDir, absolute).replace(/\\/g, "/");
    const lines = lineCount(context.sourceCode.text);
    const finding = checkLargeFile(file, lines, policy);

    return { Program(node) {
      if (finding) context.report({ node, messageId: finding.id, data: { file, lines, ...finding } });
      // Registry entries without a file cannot be seen by linting it; report once per run.
      for (const listed of Object.keys(policy.files ?? {})) {
        if (fs.existsSync(path.resolve(rootDir, listed))) continue;
        reportInventoryOnce(`large-files:${rootDir}:${listed}`, () =>
          context.report({ node, messageId: "stale", data: { file: listed } }));
      }
    } };
  },
};
export default rule;
