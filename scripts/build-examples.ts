import { assemble } from "../src";

const build = async () => {
  await assemble({
    src: "examples/simple-modules/src",
    output: "examples/simple-modules/dist",
    target: "es2020",
    includeModules: true,
  });
};

build();
