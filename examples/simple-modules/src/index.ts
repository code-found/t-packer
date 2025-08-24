import path from 'node:path';
import { name } from './name';
import { readFileSync } from 'node:fs';
import { transformSync } from '@swc/core';
import { address } from './address';
export const hello = readFileSync(path.join(__dirname, 'source.txt'), 'utf8');

console.log(
  transformSync(
    `export const say:()=>void=()=>{
      console.log('hello');
    }`,
    {
      jsc: {
        target: 'es2020',
        parser: { syntax: 'typescript' },
      },
      module: { type: 'es6', strict: true },
    },
  ).code,
);
console.log(`${address} ${name} says: ${hello}`);
