import fs from "node:fs";
import path from "node:path";

import type { Options } from "./config";
import { transform } from "./transfrom";

export {
  ModuleTransformer,
  type TransformerHook,
  type TransformOptions,
  type TransformProgram,
} from "./transformer";

/**
 * Assemble the project to the desired module formats.
 * - Cleans target directories
 * - Builds CJS and/or ESM in parallel
 * - Prints timing information
 */
export const assemble = async (options: Options = {}) => {
  const {
    src = "./src",
    output = "./dist",
    cjs = { output: "./cjs" },
    esm = { output: "./esm" },
    target = "es2020",
  } = options;
  const root = path.resolve(process.cwd(), src);
  const dist = path.resolve(process.cwd(), output);

  const tasks: Promise<void>[] = [];
  if (cjs) {
    fs.rmSync(path.join(dist, cjs.output), { recursive: true, force: true });
    tasks.push(
      transform({
        src: root,
        output: path.join(dist, cjs.output),
        module: "cjs",
        target,
      }),
    );
  }
  if (esm) {
    fs.rmSync(path.join(dist, esm.output), { recursive: true, force: true });
    tasks.push(
      transform({
        src: root,
        output: path.join(dist, esm.output),
        module: "esm",
        target,
      }),
    );
  }

  await Promise.all(tasks);
};
