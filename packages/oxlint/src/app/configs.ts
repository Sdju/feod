import { configs, createRuleConfig, loadFeodConfig, type ConfigOptions, type FeodConfig } from "@o-feod/eslint-structure-plugin";
import type { OxlintConfig } from "oxlint";

const jsPlugins = [{
  name: "feod-structure",
  specifier: "@o-feod/oxlint-structure-plugin",
}];

export const recommended = {
  jsPlugins,
  rules: configs.recommended.rules,
} satisfies OxlintConfig;

export function createConfig(config: FeodConfig = {}, options: ConfigOptions = {}): OxlintConfig {
  return { jsPlugins, rules: createRuleConfig(config, options).rules };
}

export function configFromProject(options: ConfigOptions = {}): OxlintConfig {
  const loaded = loadFeodConfig(options);
  return createConfig(loaded.config, { ...options, rootDir: loaded.rootDir });
}

export const strict = {
  jsPlugins,
  rules: configs.strict.rules,
} satisfies OxlintConfig;
