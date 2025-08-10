t-packer（中文）

一个基于 SWC 的轻量构建工具，将 TypeScript/TSX/JavaScript 项目装配为 CommonJS 与 ES Module 产物。

## 特性

- 基于 SWC 的快速转译与 Source Map
- 并行构建 CJS 与 ESM
- 递归转换并自动清理输出目录
- 通过 `ModuleTransformer` 可扩展转换器

## 环境与安装

- 需要 Node.js 18+
- 包管理器：pnpm（或 npm/yarn）
- 运行时依赖：
  - `@swc/core`
- 推荐开发依赖（用于 TypeScript 项目）：
  - `typescript`、`@types/node`

在你的项目中安装依赖：

```bash
# 使用 pnpm
pnpm add @swc/core
pnpm add -D typescript @types/node

# 可选：直接运行 TS 构建脚本
pnpm add -D ts-node
```

## 快速开始

```ts
// scripts/build.ts
import { assemble } from "../../src/index"; // 或使用已安装的包名

assemble({
  src: "./src",
  output: "./dist",
  cjs: { output: "./cjs" },
  esm: { output: "./esm" },
  target: "es2020",
});
```

运行：

```bash
pnpm ts-node scripts/build.ts
# 或编译后再运行 JS
pnpm tsc && node scripts/build.js
```

输出目录结构：

```
./dist/
  cjs/
  esm/
```

## CLI（实验性）

在 `src/bin/index.ts` 提供了基于 Commander 的实验性 CLI。发布与编译后，使用示例：

```bash
t-packer -s ./src -o ./dist -c ./cjs -e ./esm -t es2020
```

选项：

- `-c, --cjs <output>`：CJS 输出目录
- `-e, --esm <output>`：ESM 输出目录
- `-t, --target <target>`：目标 JS 版本（如 `es2020`）
- `-s, --src <src>`：源码目录
- `-o, --output <output>`：输出目录

## API

### assemble(options)

将项目装配到指定的模块格式。

```ts
import type { Options } from "../../src/config"; // 或使用已安装的包名
export const assemble: (options?: Options) => Promise<void>;
```

选项：

- `src`（string，默认 "./src"）：源码目录
- `output`（string，默认 "./dist"）：输出根目录
- `cjs`（{ output: string } | null，默认 { output: "./cjs" }）：设为 `null` 关闭 CJS 构建
- `esm`（{ output: string } | null，默认 { output: "./esm" }）：设为 `null` 关闭 ESM 构建
- `target`（string，默认 "es2020"）：SWC JSC 目标

构建过程：

- 清理 `output` 下目标目录
- 递归处理 `src` 文件
- 并行构建 CJS 与/或 ESM
- 可写入 Source Map（若可用）
- 输出耗时日志

## 转换器系统

`ModuleTransformer` 管理文件转换器。默认提供的 SWC 转换器支持 TS/TSX/JS/JSX，并在构造器内自动注册。

```ts
import { ModuleTransformer } from "../../src/transformer";

const transformer = new ModuleTransformer();
// 你可以通过 transformer.addTransformer(...) 注册自定义转换器
```

### 自定义转换器

实现 `TransformerHook` 接口并注册：

```ts
import { ModuleTransformer, type TransformerHook, type TransformOptions } from "../../src/transformer";

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

当执行 `assemble` 时，受你转换器处理的文件会被相应转换。
