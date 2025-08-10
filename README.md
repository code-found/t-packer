# t-packer

A small SWC-powered build utility to assemble TypeScript/TSX/JavaScript projects into CommonJS and ES Module outputs. It exposes a minimal `assemble` API and a pluggable transformer layer.

> 📖 **中文文档**: [查看中文版 README](docs/zh/README.md)

## Features

- SWC-based transpilation with source maps
- Parallel builds for CJS and ESM
- Recursive transform with output cleaning
- Extensible via `ModuleTransformer`

## Requirements & Installation

- Node.js 18+ is required
- Package manager: pnpm (or npm/yarn)
- Runtime dependency:
  - `@swc/core`
- Recommended dev dependencies (for TypeScript projects):
  - `typescript`, `@types/node`

Install dependencies in your project:

```bash
# using pnpm
pnpm add @swc/core
pnpm add -D typescript @types/node

# optional: if you want to run TS build scripts directly
pnpm add -D ts-node
```

## Quick start

Create a build script and call `assemble`.

```ts
// scripts/build.ts
import { assemble } from "./src/index"; // or from the installed package name

assemble({
  src: "./src",
  output: "./dist",
  cjs: { output: "./cjs" },
  esm: { output: "./esm" },
  target: "es2020",
});
```

Run it (examples):

```bash
# with ts-node
pnpm ts-node scripts/build.ts

# or transpile first and run JS
pnpm tsc && node scripts/build.js
```

The output layout will be:

```
./dist/
  cjs/
  esm/
```

## CLI (experimental)

An experimental CLI exists under `src/bin/index.ts` (Commander-based). When published and compiled, usage will look like:

```bash
t-packer -s ./src -o ./dist -c ./cjs -e ./esm -t es2020
```

Options:

- `-c, --cjs <output>`: CJS output dir
- `-e, --esm <output>`: ESM output dir
- `-t, --target <target>`: target JS version (e.g., `es2020`)
- `-s, --src <src>`: source dir
- `-o, --output <output>`: output dir

## API

### assemble(options)

Assembles the project to the desired module formats.

```ts
import type { Options } from "./src/config"; // or from the installed package
export const assemble: (options?: Options) => Promise<void>;
```

Options:

- `src` (string, default `"./src"`): Source directory
- `output` (string, default `"./dist"`): Root output directory
- `cjs` (`{ output: string } | null`, default `{ output: "./cjs" }`): Set to `null` to disable CJS
- `esm` (`{ output: string } | null`, default `{ output: "./esm" }`): Set to `null` to disable ESM
- `target` (string, default `"es2020"`): SWC JSC target

The build:

- Cleans target directories inside `output`
- Recursively processes files from `src`
- Builds CJS and/or ESM in parallel
- Writes source maps when available
- Logs total time

## Transformer system

The transformer system is managed by `ModuleTransformer`. A default SWC-based transformer for TS/TSX/JS/JSX is registered in the transformer module and auto-added in the constructor.

```ts
import { ModuleTransformer } from "./src/transformer";

const transformer = new ModuleTransformer();
// custom transformers can be added with transformer.addTransformer(...)
```

### Writing a custom transformer

Implement `TransformerHook` and register it.

```ts
import { ModuleTransformer, type TransformerHook, type TransformOptions } from "./src/transformer";

const myTransformer: TransformerHook = {
  exts: [[".txt", ".js"]],
  transformSync: (code: Buffer, _options: TransformOptions) => {
    const js = `export const text = ${JSON.stringify(code.toString("utf-8"))};\n`;
    return { code: Buffer.from(js) };
  },
};

const t = new ModuleTransformer();
 t.addTransformer(myTransformer);
```

When `assemble` runs, files handled by your transformer will be converted accordingly.

## Further reading

- English docs: `docs/en/README.md`
- 中文文档: `docs/zh/README.md`

