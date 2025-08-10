import path from "node:path";
import { tsTransformer } from "./ts-transformer";

/**
 * A transformer declaration that describes which extensions it handles
 * and how to transform code synchronously or asynchronously.
 */
export interface TransformerHook {
  /**
   * A list of extensions; string maps to itself, tuple maps from->to.
   */
  exts: (string | [string, string])[];
  /**
   * Synchronous transform function.
   */
  transformSync: TransformProgram;
  /**
   * Optional async transform; if provided, it will be preferred.
   */
  transform?: (
    ...args: Parameters<TransformProgram>
  ) => Promise<ReturnType<TransformProgram>>;
}

/**
 * Minimal transform options forwarded to underlying toolchain (e.g. SWC).
 */
export interface TransformOptions {
  target?: string;
  module?: string;
}

/**
 * The transform program signature.
 */
export type TransformProgram = (
  code: Buffer,
  options: TransformOptions,
) => { code: Buffer | string; map?: string };

/**
 * Registry and dispatcher for file transformers.
 */
export class ModuleTransformer {
  protected transformers: Map<
    string,
    {
      ext: [string, string];
      hooks: TransformerHook;
    }
  > = new Map();

  constructor(transformers: TransformerHook[] = []) {
    this.addTransformer(tsTransformer as TransformerHook);
    for (const transformer of transformers) {
      this.addTransformer(transformer);
    }
  }

  /**
   * Register a transformer and its handled extensions.
   */
  addTransformer(transformer: TransformerHook) {
    for (let ext of transformer.exts) {
      ext = typeof ext === "string" ? [ext, ext] : ext;
      const transformers = this.transformers.get(ext[0]);
      if (transformers) {
        transformers.hooks = transformer;
      } else {
        this.transformers.set(ext[0], {
          ext,
          hooks: transformer,
        });
      }
    }
  }

  /**
   * Remove a transformer by its handled extensions.
   */
  removeTransformer(transformer: TransformerHook) {
    for (let ext of transformer.exts) {
      ext = typeof ext === "string" ? [ext, ext] : ext;
      this.transformers.delete(ext[0]);
    }
  }

  /**
   * Transform a single file buffer based on its extension.
   */
  async transform(
    code: Buffer,
    filename: string,
    options: TransformOptions,
  ): Promise<{ code: Buffer; map?: string; filename: string }> {
    const transformers = this.transformers.get(path.extname(filename));

    if (transformers) {
      filename = filename.replace(transformers.ext[0], transformers.ext[1]);
      const transformer = transformers.hooks;
      const transform = transformer.transform ?? transformer.transformSync;
      const result = await transform(code, options);
      return {
        code: result.code as Buffer,
        map: result.map,
        filename,
      };
    }
    return { code, filename };
  }
  /**
   * Synchronous variant of transform. Keeps the same API shape.
   */
  transformSync(
    code: Buffer,
    filename: string,
    options: TransformOptions,
  ) {
    const transformers = this.transformers.get(path.extname(filename));
    if (transformers) {
      filename = filename.replace(transformers.ext[0], transformers.ext[1]);
      const transformer = transformers.hooks;
      const result = transformer.transformSync(code, options);
      return {
        code: result.code as Buffer,
        map: result.map,
        filename,
      };
    }
    return { code, filename };
  }
}
