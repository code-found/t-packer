import fs from 'node:fs';
import { createRequire, isBuiltin } from 'node:module';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { ModuleTransformer } from './transformer';

const isModule = (file: string) => {
  return (
    file.endsWith('.ts') ||
    file.endsWith('.tsx') ||
    file.endsWith('.js') ||
    file.endsWith('.jsx')
  );
};
interface RequireItem {
  requireIdentifier: string;
}

const findRequires = (code: string) => {
  const results: RequireItem[] = [];

  const addResult = (specifier: string, quote: '"' | "'") => {
    results.push({
      requireIdentifier: `${quote}${specifier}${quote}`,
    });
  };

  const length = code.length;
  let i = 0;

  let inS = false; // '
  let inD = false; // "
  let inT = false; // `
  let inLC = false; // //
  let inBC = false; // /* */

  const isWhitespace = (ch: string) =>
    ch === ' ' ||
    ch === '\n' ||
    ch === '\r' ||
    ch === '\t' ||
    ch === '\f' ||
    ch === '\v';

  const skipWhitespace = (idx: number) => {
    while (idx < length && isWhitespace(code[idx])) idx++;
    return idx;
  };

  const parseStringAt = (
    idx: number,
  ): { end: number; quote: '"' | "'"; value: string } | null => {
    const q = code[idx];
    if (q !== '"' && q !== "'") return null;
    let j = idx + 1;
    let value = '';
    while (j < length) {
      const ch = code[j];
      if (ch === '\\') {
        // skip escaped char
        if (j + 1 < length) {
          value += code[j + 1];
          j += 2;
          continue;
        }
      }
      if (ch === q) {
        return { end: j + 1, quote: q as '"' | "'", value };
      }
      value += ch;
      j++;
    }
    return null;
  };

  const matchWordAt = (idx: number, word: string) => code.startsWith(word, idx);

  while (i < length) {
    const ch = code[i];

    // handle comment states first
    if (inLC) {
      if (ch === '\n') inLC = false;
      i++;
      continue;
    }
    if (inBC) {
      if (ch === '*' && i + 1 < length && code[i + 1] === '/') {
        inBC = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // strings/templates
    if (inS) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === "'") inS = false;
      i++;
      continue;
    }
    if (inD) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '"') inD = false;
      i++;
      continue;
    }
    if (inT) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') inT = false;
      i++;
      continue;
    }

    // enter comments/strings
    if (ch === '/' && i + 1 < length && code[i + 1] === '/') {
      inLC = true;
      i += 2;
      continue;
    }
    if (ch === '/' && i + 1 < length && code[i + 1] === '*') {
      inBC = true;
      i += 2;
      continue;
    }
    if (ch === "'") {
      inS = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inD = true;
      i++;
      continue;
    }
    if (ch === '`') {
      inT = true;
      i++;
      continue;
    }

    // try match require(
    if (matchWordAt(i, 'require')) {
      let j = i + 'require'.length;
      j = skipWhitespace(j);
      if (j < length && code[j] === '(') {
        j++;
        j = skipWhitespace(j);
        const str = parseStringAt(j);
        if (str) {
          j = str.end;
          j = skipWhitespace(j);
          if (j < length && code[j] === ')') {
            addResult(str.value, str.quote);
            i = j + 1;
            continue;
          }
        }
      }
    }

    // try match import(
    if (matchWordAt(i, 'import')) {
      let j = i + 'import'.length;
      j = skipWhitespace(j);
      if (j < length && code[j] === '(') {
        j++;
        j = skipWhitespace(j);
        const str = parseStringAt(j);
        if (str) {
          j = str.end;
          j = skipWhitespace(j);
          if (j < length && code[j] === ')') {
            addResult(str.value, str.quote);
            i = j + 1;
            continue;
          }
        }
      } else {
        // static imports
        // case: import "x";
        const str = parseStringAt(j);
        if (str) {
          addResult(str.value, str.quote);
          i = str.end;
          continue;
        }
        // case: import ... from "x";
        let k = j;
        // scan until ';' or newline, looking for from <string>
        let innerInS = false;
        let innerInD = false;
        while (k < length) {
          const ck = code[k];
          if (!innerInS && !innerInD && ck === ';') break;
          if (!innerInS && !innerInD && (ck === '\n' || ck === '\r')) break;
          if (!innerInS && ck === '"') {
            innerInD = true;
            k++;
            continue;
          }
          if (!innerInD && ck === "'") {
            innerInS = true;
            k++;
            continue;
          }
          if (innerInS) {
            if (ck === '\\') {
              k += 2;
              continue;
            }
            if (ck === "'") {
              innerInS = false;
              k++;
              continue;
            }
            k++;
            continue;
          }
          if (innerInD) {
            if (ck === '\\') {
              k += 2;
              continue;
            }
            if (ck === '"') {
              innerInD = false;
              k++;
              continue;
            }
            k++;
            continue;
          }
          // try find 'from'
          if (code.startsWith('from', k)) {
            let f = k + 4;
            f = skipWhitespace(f);
            const lit = parseStringAt(f);
            if (lit) {
              addResult(lit.value, lit.quote);
              i = lit.end;
              break;
            }
          }
          k++;
        }
      }
    }

    i++;
  }

  return results;
};

const resolveRequireFile = (filepath: string, cwd: string) => {
  if (filepath.startsWith('.')) {
    filepath = resolve(dirname(cwd), filepath);
    for (const ext of ['', `${sep}/index`].flatMap((x) =>
      ['', '.js', '.ts', '.jsx', '.tsx'].map((y) => x + y),
    )) {
      if (
        fs.existsSync(filepath + ext) &&
        fs.statSync(filepath + ext).isFile()
      ) {
        return filepath + ext;
      }
    }
    return filepath;
  } else {
    const require = createRequire(cwd);
    try {
      return require.resolve(filepath);
    } catch {
      return filepath;
    }
  }
};
export const transform = async ({
  src: root,
  output,
  module,
  target,
  includeModules,
}: {
  src: string;
  output: string;
  module: 'cjs' | 'esm';
  target: string;
  includeModules?: boolean;
}) => {
  const moduleTransformer = new ModuleTransformer();
  const fileMap = new Map<
    string,
    {
      compiled: boolean;
      output?: string;
    }
  >();
  const transformFile = async (src: string): Promise<string | undefined> => {
    if (
      fileMap.get(src)?.compiled ||
      isBuiltin(src) ||
      !fs.existsSync(src) ||
      (!includeModules && src.includes('node_modules'))
    ) {
      /**
       * if the file has transformed, return the output
       * if the file is a builtin module, we don't need to transform it
       * if the file does not exist, we don't need to transform it
       * if the file is in node_modules, and includeModules is false, we don't need to transform it
       */
      return fileMap.get(src)?.output ?? '';
    }
    if (fs.statSync(src).isDirectory()) {
      const files = await fs.promises.readdir(src);
      for (const file of files) {
        await transformFile(join(src, file));
      }
    } else {
      // set the transform info
      fileMap.set(src, {
        compiled: false,
      });
      let fileContent: Buffer | string = await fs.promises.readFile(src);
      const dist = src.includes('node_modules')
        ? join(
            output,
            dirname(
              src
                .slice(
                  src.lastIndexOf('node_modules') + 'node_modules'.length,
                  src.length,
                )
                .replace('@', ''),
            ),
          )
        : dirname(join(output, src.replace(root, '')));
      if (isModule(src)) {
        fileContent = fileContent.toString('utf-8');
        const requires = findRequires(fileContent);
        for (const requireItem of requires) {
          const { requireIdentifier } = requireItem;
          // because requireIdentifier is has quotes, we need to remove them
          const filepath = requireIdentifier.slice(1, -1);
          const resolvedPath = resolveRequireFile(
            filepath,
            filepath.startsWith('.') ? src : root,
          );

          /**
           * circular dependency fix
           * example:
           * file a.ts
           * import { b } from "./b";
           *
           * export a = {}
           *
           * file b.ts
           * import { a } from "./a";
           *
           * export b = {a}
           * when we transform a.ts, we will get the output of b.ts
           * but b.ts will also need to import a.ts
           * so we need to check if the a.ts is already in transform to prevent circular dependency
           *
           * but here is still a problem
           * if a.ts is not transformed, the output of a.ts is empty
           * and we can't replace the requireIdentifier with the output of a.ts
           * it may cause some error
           *
           * maybe we should fix it in the future
           *
           */
          const output = fileMap.get(resolvedPath)
            ? (fileMap.get(resolvedPath)?.output ?? '')
            : await transformFile(resolvedPath);

          if (output) {
            fileContent = fileContent.replaceAll(
              requireIdentifier,
              `"./${relative(dist, output).replace(/\\/g, '/')}"`,
            );
          }
        }
      }

      try {
        const { code, map, filename } = await moduleTransformer.transform(
          fileContent,
          basename(src),
          {
            module,
            target,
          },
        );
        if (!fs.existsSync(dist)) {
          await fs.promises.mkdir(dist, { recursive: true });
        }
        const outputFile = join(dist, filename ?? basename(src));
        await fs.promises.writeFile(outputFile, code);
        if (map) {
          await fs.promises.writeFile(`${outputFile}.map`, map);
        }
        fileMap.set(src, {
          compiled: true,
          output: outputFile,
        });
        return outputFile;
      } catch (e) {
        console.log('error', e, src);
      }
    }
  };
  await transformFile(root);
};
