import { assemble } from "../src/index";

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