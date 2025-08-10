import path from "path";
import type { Options } from "./config";
import fs from "fs";
import { TransformerManager } from "./transformer";
import { tsTransformer } from "./transformer/ts-transformer";


const transformerManager = new TransformerManager();

transformerManager.addTransfromer([".ts", ".tsx"], tsTransformer);

const transform = async ({ src, output, module, target }: { src: string, output: string, module: 'cjs' | 'esm', target: string }) => {
  const root = path.resolve(process.cwd(), src);
  const dist = path.resolve(process.cwd(), output);

  const files = await fs.promises.readdir(root);
  await Promise.all(files.map(async (file) => {
    const filePath = path.resolve(root, file);
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      await transform({ src: filePath, output: path.join(dist, file), module, target });
    } else {
      const basename = path.basename(filePath);
      const { code, map, name } = await transformerManager.transform(basename, await fs.promises.readFile(filePath, 'utf-8'), { target, module });
      if (!fs.existsSync(dist)) {
        await fs.promises.mkdir(dist, { recursive: true });
      }
      await fs.promises.writeFile(path.join(dist, name ?? basename), code);
      if (map) {
        await fs.promises.writeFile(path.join(dist, (name ?? basename) + '.map'), map);
      }
    }
  }));
};
export const assemble = async (options: Options = {}) => {
  const timer = new Date();
  const { src = "./src", output = "./dist", cjs = { output: "./cjs" }, esm = { output: "./esm" }, target = "es2020" } = options;
  const root = path.resolve(process.cwd(), src);
  const dist = path.resolve(process.cwd(), output);

  const tasks: Promise<void>[] = []
  if (cjs) {
    fs.rmSync(path.join(dist, cjs.output), { recursive: true, force: true });
    tasks.push(transform({ src: root, output: path.join(dist, cjs.output), module: 'cjs', target }));
  }
  if (esm) {
    fs.rmSync(path.join(dist, esm.output), { recursive: true, force: true });
    tasks.push(transform({ src: root, output: path.join(dist, esm.output), module: 'esm', target }));
  }

  await Promise.all(tasks);
  console.log(`assemble success in ${new Date().getTime() - timer.getTime()}ms`);
};