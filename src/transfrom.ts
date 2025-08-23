import fs from "node:fs";
import path from "node:path";

import { ModuleTransformer } from "./transformer";

/**
 * Central transformer registry for the build pipeline.
 * Registers the TypeScript/TSX transformer powered by SWC.
 */
const moduleTransformer = new ModuleTransformer();

/**
 * Recursively transform files from `src` into `output` using the configured transformers.
 */
export const transform = async ({
  src,
  output,
  module,
  target,
}: {
  src: string;
  output: string;
  module: "cjs" | "esm";
  target: string;
}) => {
  const root = path.resolve(process.cwd(), src);
  const dist = path.resolve(process.cwd(), output);

  // Read directory entries and process them in parallel
  const files = await fs.promises.readdir(root);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.resolve(root, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        await transform({
          src: filePath,
          output: path.join(dist, file),
          module,
          target,
        });
      } else {
        const basename = path.basename(filePath);
        // Transform file content and determine final filename
        const { code, map, filename } = await moduleTransformer.transform(
          await fs.promises.readFile(filePath),
          basename,
          { target, module },
        );
        if (!fs.existsSync(dist)) {
          await fs.promises.mkdir(dist, { recursive: true });
        }
        await fs.promises.writeFile(
          path.join(dist, filename ?? basename),
          code,
        );
        if (map) {
          await fs.promises.writeFile(
            path.join(dist, `${filename ?? basename}.map`),
            map,
          );
        }
      }
    }),
  );
};
