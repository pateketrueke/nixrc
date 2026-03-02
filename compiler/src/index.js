import { parseMirc } from './parser.js';
import { generate } from './codegen.js';

export function transpile(source, options = {}) {
  const ast = parseMirc(source);
  const output = generate(ast, options);
  return {
    ast,
    ...output,
  };
}

export function emitDts(transpileResult) {
  const names = transpileResult.exports || [];
  if (!names.length) return '';
  return `${names.map((name) => `export declare function ${name}(...args: unknown[]): unknown;`).join('\n')}\n`;
}
