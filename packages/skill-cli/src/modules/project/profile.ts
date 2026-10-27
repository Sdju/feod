import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ProfileInfo } from "./types.js";

export const PROFILE_FILE = "feod.profile.md";

const clean = (value: string) => value.trim().replace(/^`|`$/g, "").trim();

/** Reads the `| key | value |` table of feod.profile.md; everything else in the file is ignored. */
export function readProfile(rootDir: string): ProfileInfo | null {
  const path = join(rootDir, PROFILE_FILE);
  if (!existsSync(path)) return null;
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\|([^|]+)\|([^|]+)\|\s*$/.exec(line);
    if (!match) continue;
    const key = clean(match[1]!);
    const value = clean(match[2]!);
    if (!key || /^-+$/.test(key) || key.toLowerCase() === "parameter") continue;
    values[key] = value;
  }
  return { path: PROFILE_FILE, values };
}

/** Layer directory names listed in the profile ("app, pages, modules"), or null when absent. */
export function profileLayers(profile: ProfileInfo | null): string[] | null {
  const value = profile?.values.layers;
  if (!value) return null;
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}
