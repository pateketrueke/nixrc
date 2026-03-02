import { execSync } from 'node:child_process';

const cmds = [
  'node compiler/test/transpiler.test.mjs',
  'node runtime/test/interpreter.test.mjs',
  'node playground/test/url-codec.test.mjs',
];

for (const cmd of cmds) {
  execSync(cmd, { stdio: 'inherit' });
}

console.log('all tests passed');
