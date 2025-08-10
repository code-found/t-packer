import path from "path";
import type { Transformer, TransformOptions } from ".";
import { transform, type JscTarget, } from "@swc/core";


export const tsTransformer: Transformer = {
  async transform(name: string, code: string, options: TransformOptions): Promise<{ code: string, map?: string, name: string }> {
    const { target = "es2020", module = "esm" } = options;
    const result = await transform(code, {
      jsc: {
        target: target as JscTarget,
        parser: {
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          legacyDecorator: true,
        },
      },
      module: {
        type: module === 'esm' ? 'es6' : 'commonjs',
      },
      sourceMaps: true,
    });
    return { code: result.code, map: result.map, name: name.replace(/\.ts$/, '.js') }
  },
};