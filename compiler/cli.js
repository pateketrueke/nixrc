#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { transpile, emitDts } from './src/index.js';

function usage() {
  console.error('Usage: nixrc compile <input.mrc> [--out <dir>] [--stdout] [--watch] [--emit-dts]');
}

function parseArgs(argv) {
  const args = {
    command: argv[2],
    input: argv[3],
    outDir: null,
    stdout: false,
    watch: false,
    emitDts: false,
  };

  for (let i = 4; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--stdout') {
      args.stdout = true;
      continue;
    }
    if (token === '--watch') {
      args.watch = true;
      continue;
    }
    if (token === '--emit-dts') {
      args.emitDts = true;
      continue;
    }
    if (token === '--out') {
      args.outDir = argv[i + 1] || null;
      i += 1;
      continue;
    }
  }

  return args;
}

function compileOnce(inputPath, args) {
  const source = fs.readFileSync(inputPath, 'utf8');
  const outName = `${path.basename(inputPath, path.extname(inputPath))}.ts`;
  const outDir = args.outDir ? path.resolve(process.cwd(), args.outDir) : path.dirname(inputPath);
  const outPath = path.join(outDir, outName);
  const mapPath = `${outPath}.map`;

  const result = transpile(source, {
    banner: `Compiled from ${path.basename(inputPath)}`,
    sourceName: path.basename(inputPath),
    fileName: outName,
  });

  if (args.stdout) {
    process.stdout.write(result.code);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, `${result.code}\n//# sourceMappingURL=${path.basename(mapPath)}\n`, 'utf8');
  fs.writeFileSync(mapPath, `${JSON.stringify(result.map, null, 2)}\n`, 'utf8');

  if (args.emitDts) {
    const dts = emitDts(result);
    const dtsPath = outPath.replace(/\.ts$/, '.d.ts');
    fs.writeFileSync(dtsPath, dts || '// No exported aliases were found.\n', 'utf8');
  }

  console.error(`Wrote ${outPath}`);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.command !== 'compile' || !args.input) {
    usage();
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  const run = () => {
    try {
      compileOnce(inputPath, args);
    } catch (err) {
      console.error(`Compile failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  run();

  if (!args.watch) return;

  console.error(`Watching ${inputPath}...`);
  fs.watch(inputPath, { persistent: true }, (_eventType) => {
    run();
  });
}

main();
