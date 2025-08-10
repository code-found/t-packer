import path from "path";




export interface TransformOptions {
  target?: string;
  module?: string;
}
export interface Transformer {
  transform(name: string, code: string, options: TransformOptions): Promise<{ code: string, map?: string, name: string }>;
}

export class TransformerManager {
  private transformers: Map<string, Transformer> = new Map();
  addTransfromer(exts: string[], transformer: Transformer) {
    exts.forEach(ext => {
      this.transformers.set(ext, transformer);
    });
  }
  async transform(filePath: string, code: string, options: TransformOptions) {
    const ext = path.extname(filePath);
    const transformer = this.transformers.get(ext);

    if (!transformer) {
      return { code, map: undefined }
    }

    const { target = "es2020", module = "esm" } = options;
    const result = await transformer.transform(filePath, code, { target, module });
    return { code: result.code, map: result.map, name: result.name }
  }
}

