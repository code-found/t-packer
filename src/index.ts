export function run(): void {
  // 占位运行逻辑
  // 未来可扩展为 CLI 或库入口
  // 不使用 default export，保持命名导出
  // eslint-disable-next-line no-console
  console.log("t-packer ready");
}

if (process.argv[1]?.endsWith("index.ts")) {
  run();
}
