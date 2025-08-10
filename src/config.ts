interface OutputOptions {
  output: string;
}
export interface Options {
  output?: string;
  src?: string;
  cjs?: OutputOptions | null;
  esm?: OutputOptions | null;
  target?: string;
}