#!/usr/bin/env node
import { INFO_USAGE, runInfo } from "../commands/info/index.js";

const [command, ...rest] = process.argv.slice(2);

if (command === "info") {
  process.exitCode = runInfo(rest);
} else {
  process.stderr.write(`usage:\n  ${INFO_USAGE}\n`);
  process.exitCode = command === undefined || command === "--help" ? 0 : 64;
}
