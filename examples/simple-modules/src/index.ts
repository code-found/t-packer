import fs from "node:fs";
import path from "node:path";
export const hello = fs.readFileSync(
  path.join(__dirname, "source.txt"),
  "utf8",
);
console.log(hello);
