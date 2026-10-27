import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { FeodConfigError, collectProjectInfo, renderText } from "../../modules/project/index.js";

export const INFO_USAGE = "feod info [--root <dir>] [--json]   show the project as FEOD sees it";

/** Wires arguments to the project module; returns the process exit code. */
export function runInfo(argv: string[], write: (text: string) => void = text => process.stdout.write(text)): number {
  const { values } = parseArgs({
    args: argv,
    options: { root: { type: "string" }, json: { type: "boolean", default: false } },
    strict: true,
  });
  try {
    const info = collectProjectInfo(resolve(values.root ?? process.cwd()));
    write(values.json ? `${JSON.stringify(info, null, 2)}\n` : renderText(info));
    return info.findings.some(finding => finding.severity === "error") ? 1 : 0;
  } catch (error) {
    if (error instanceof FeodConfigError) {
      write(values.json ? `${JSON.stringify({ error: error.message })}\n` : `${error.message}\n`);
      return 2;
    }
    throw error;
  }
}
