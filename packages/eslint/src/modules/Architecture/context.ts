import type { Rule } from "eslint";

type RuleContextWithFilename = Rule.RuleContext & {
  filename?: string;
  getFilename?: () => string;
};

export function getFilename(context: RuleContextWithFilename) {
  if (typeof context.filename === "string") return context.filename;
  if (typeof context.getFilename === "function") return context.getFilename();
  return "<input>";
}
