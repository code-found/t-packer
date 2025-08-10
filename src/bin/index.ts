#!/usr/bin/env node

import { assemble } from "../index";
import { program } from "commander";

program
  .option("-c, --cjs <output>", "output directory for CommonJS modules")
  .option("-e, --esm <output>", "output directory for ECMAScript modules")
  .option("-t, --target <target>", "target JavaScript version")
  .option("-s, --src <src>", "source directory")
  .option("-o, --output <output>", "output directory")
  .parse(process.argv);

const options = program.opts();
assemble(options);