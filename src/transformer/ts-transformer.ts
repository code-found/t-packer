import type { TransformerHook, TransformOptions } from ".";
import { type JscTarget, transform, transformSync, type Options, } from "@swc/core";


/**
 * Base SWC configuration for TS/TSX/JS/JSX files.
 * Specific fields like `jsc.target` and `module.type` are overridden per call
 * using incoming TransformOptions.
 */
const SwcConfig: Options = {
  jsc: {
    target: "es2020",
    parser: {
      syntax: "typescript",
      tsx: true,
    },
    transform: {
      react: {
        pragma: "React.createElement",
        pragmaFrag: "React.Fragment",
        throwIfNamespace: false,
        development: false,
        useBuiltins: false,
        runtime: "automatic",
        importSource: "react",
      },
      legacyDecorator: true,
      decoratorMetadata: true,
      decoratorVersion: "2021-12",
      useDefineForClassFields: true,
      verbatimModuleSyntax: true,
      tsEnumIsMutable: true,
    },
  },
  sourceMaps: true,
};

/**
 * SWC-powered transformer handling TS/TSX/JS/JSX to JS with source maps.
 */
export const tsTransformer: TransformerHook = {
  exts: [[".ts", ".js"], [".tsx", '.js'], ['.js', '.js'], [".jsx", '.js']],
  transformSync: (code: Buffer, options: TransformOptions) => {
    const result = transformSync(code.toString('utf-8'), {
      ...SwcConfig,
      jsc: {
        ...SwcConfig.jsc,
        target: options.target as JscTarget,
      },
      module: {
        type: options.module === 'esm' ? 'es6' : 'commonjs',
      },
    });
    return { code: Buffer.from(result.code), map: result.map, }
  },
  transform: async (code: Buffer, options: TransformOptions) => {
    const result = await transform(code.toString('utf-8'), {
      ...SwcConfig,
      jsc: {
        ...SwcConfig.jsc,
        target: options.target as JscTarget,
      },
      module: {
        type: options.module === 'esm' ? 'es6' : 'commonjs',
      },
    });
    return { code: Buffer.from(result.code), map: result.map, }
  },
};