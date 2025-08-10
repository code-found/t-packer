/**
 * Output options for a specific module format.
 * - `output`: relative output directory (will be resolved from process.cwd())
 */
interface OutputOptions {
  output: string;
}

/**
 * Assemble options controlling inputs, outputs and transpilation target.
 * - `src`: source directory to read from (default: "./src")
 * - `output`: root output directory (default: "./dist")
 * - `cjs`: CommonJS output options; set to null to disable CJS build
 * - `esm`: ES Module output options; set to null to disable ESM build
 * - `target`: SWC JSC target (e.g. "es2020")
 */
export interface Options {
  output?: string;
  src?: string;
  cjs?: OutputOptions | null;
  esm?: OutputOptions | null;
  target?: string;
}
