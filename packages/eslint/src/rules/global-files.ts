import { createIgnoreMatcher } from "../common/ignore.js";
import path from "node:path";
import picomatch from "picomatch";
import type { Rule } from "eslint";
import {
  getFilename,
  getLayers,
  layerSetSchema,
  type LayerDirs,
  globalFilesSchema,
  type GlobalFilesPolicy,
} from "../modules/Architecture/index.js";

import type { LayerSet } from "../modules/Layers/index.js";

type Options = GlobalFilesPolicy & { rootDir?: string; srcRoot?: string; ignore?: string | string[]; layerDirs?: LayerDirs; layers?: LayerSet };

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Restrict visited global-layer files to configured patterns" },
    schema: [{ type: "object", additionalProperties: false, properties: {
      ...globalFilesSchema.properties, rootDir: { type: "string" }, srcRoot: { type: "string" },
      ignore: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
      layers: layerSetSchema,
      layerDirs: { type: "object", additionalProperties: false, properties: { global: { type: "string" } } },
    } }],
    messages: { invalidGlobalFile: "FEOD: global file '{{file}}' does not match allowedFiles." },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    if (!options.allowedFiles?.length) return {};
    const filename = getFilename(context);
    if (!filename || filename.startsWith("<")) return {};
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const absolute = path.resolve(rootDir, filename);
    if (createIgnoreMatcher(options.ignore, rootDir)(absolute)) return {};
    const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
    // The longest layer match owns a file, including nested custom layers.
    const layer = getLayers(options.srcRoot ?? "src", options.layerDirs, options.layers)
      .find(layer => relative.startsWith(`${layer.dir}/`));
    if (layer?.role !== "global") return {};
    const file = relative.slice(layer.dir.length + 1);
    if (picomatch(options.allowedFiles, { dot: true })(file)) return {};
    return { Program(node) { context.report({ node, messageId: "invalidGlobalFile", data: { file } }); } };
  },
};
export default rule;
