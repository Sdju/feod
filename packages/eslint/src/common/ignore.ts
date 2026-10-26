import path from "node:path";
import picomatch from "picomatch";

export type IgnorePatterns = string | string[] | undefined;

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

export function createIgnoreMatcher(patterns: IgnorePatterns, rootDir: string) {
  if (!patterns) {
    return () => false;
  }
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const isMatch = picomatch(list, { dot: true });
  return (filePath: string) => {
    const absolute = toPosix(path.resolve(filePath));
    const relative = toPosix(path.relative(rootDir, filePath));
    return isMatch(relative) || isMatch(absolute);
  };
}
