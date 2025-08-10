/**
 * Example build script that assembles both CommonJS and ES Module outputs.
 *
 * How to run:
 * - With ts-node: `ts-node scripts/build.ts`
 * - Or compile first and run the compiled JavaScript.
 */
import { assemble } from "../src/index";

// Assemble the project to dist/cjs (CommonJS) and dist/esm (ESM)
assemble({
  src: "./src",
  output: "./dist",
  cjs: {
    output: "./cjs",
  },
  esm: {
    output: "./esm",
  },
});
