import assert from 'node:assert/strict';
import { transpile, emitDts } from '../src/index.js';

const fixture = `
alias greet {
  set %x 5
  echo -a Hello $1 $+ !
  msg #chan hi | timer 1 1000 greet
}

on *:TEXT:hello:#:{
  msg $chan Hi $nick $+ !
}
`;

const result = transpile(fixture, {
  banner: 'test compile',
  sourceName: 'fixture.mrc',
  fileName: 'fixture.ts',
});

assert.equal(result.ast.type, 'Program');
assert.ok(result.code.includes('from "nixrc/runtime"'));
assert.ok(result.code.includes('echo({'));
assert.ok(result.code.includes('msg('));
assert.ok(result.code.includes('timer('));
assert.ok(result.code.includes('export function greet'));
assert.ok(result.code.includes('let _x = 5;'));
assert.ok(result.code.includes('msg("#chan", "hi");'));
assert.ok(result.code.includes('timer(1, 1000, "greet");'));
assert.ok(result.code.includes('on("TEXT"'));
assert.equal(result.map.version, 3);
assert.deepEqual(result.map.sources, ['fixture.mrc']);

const dts = emitDts(result);
assert.ok(dts.includes('export declare function greet'));

console.log('transpiler smoke test passed');
