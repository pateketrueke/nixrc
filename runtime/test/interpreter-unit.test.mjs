import assert from 'node:assert/strict';
import { NixrcInterpreter } from '../src/interpreter.js';
import { createMockContext } from '../../test/helpers/mock-runtime.js';

console.log('Testing interpreter - resolveToken...');

const { ctx, logs } = createMockContext();
const interp = new NixrcInterpreter(ctx);

ctx.vars.set('%x', 'hello');
interp.load('alias test { echo %x }');
interp.call('test');
assert.ok(logs.some(l => l.msg.includes('hello')));
console.log('  ✓ resolves variables');

interp.load('alias test { echo $1 }');
interp.call('test', ['arg1']);
assert.ok(logs.some(l => l.msg.includes('arg1')));
console.log('  ✓ resolves positional parameters');

interp.load('alias test { echo 42 }');
interp.call('test');
assert.ok(logs.some(l => l.msg.includes('42')));
console.log('  ✓ resolves numbers');

interp.load('alias test { echo "hello world" }');
interp.call('test');
assert.ok(logs.some(l => l.msg.includes('hello')));
console.log('  ✓ resolves quoted strings');

console.log('\nTesting interpreter - identifiers...');

interp.load('alias test { set %r $calc(2 + 2) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '4');
console.log('  ✓ evaluates $calc');

interp.load('alias test { set %r $rand(1, 10) }');
interp.call('test');
const randVal = Number(ctx.vars.get('%r'));
assert.ok(randVal >= 1 && randVal <= 10);
console.log('  ✓ evaluates $rand');

interp.load('alias test { set %r $len("hello") }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '5');
console.log('  ✓ evaluates $len');

interp.load('alias test { set %r $upper("hello") }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'HELLO');
console.log('  ✓ evaluates $upper');

interp.load('alias test { set %r $lower("HELLO") }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'hello');
console.log('  ✓ evaluates $lower');

interp.load('alias test { set %r $left("hello", 3) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'hel');
console.log('  ✓ evaluates $left');

interp.load('alias test { set %r $right("hello", 3) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'llo');
console.log('  ✓ evaluates $right');

interp.load('alias test { set %r $mid("hello", 2, 3) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'ell');
console.log('  ✓ evaluates $mid');

interp.load('alias test { set %r $chr(65) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'A');
console.log('  ✓ evaluates $chr');

interp.load('alias test { set %r $asc("A") }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '65');
console.log('  ✓ evaluates $asc');

interp.load('alias test { set %r $sqrt(16) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '4');
console.log('  ✓ evaluates $sqrt');

interp.load('alias test { set %r $abs(-5) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '5');
console.log('  ✓ evaluates $abs');

interp.load('alias test { set %r $int(3.7) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '3');
console.log('  ✓ evaluates $int');

interp.load('alias test { set %r $sin(90) }');
interp.call('test');
assert.ok(Math.abs(Number(ctx.vars.get('%r')) - 1) < 0.01);
console.log('  ✓ evaluates $sin');

interp.load('alias test { set %r $cos(0) }');
interp.call('test');
assert.ok(Math.abs(Number(ctx.vars.get('%r')) - 1) < 0.01);
console.log('  ✓ evaluates $cos');

console.log('\nTesting interpreter - token identifiers...');

interp.load('alias test { set %r $numtok("a b c", 32) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '3');
console.log('  ✓ evaluates $numtok');

interp.load('alias test { set %r $gettok("a b c", 2, 32) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'b');
console.log('  ✓ evaluates $gettok');

console.log('\nTesting interpreter - commands...');

ctx.vars.clear();
interp.load('alias test { set %x 5 }');
interp.call('test');
assert.equal(ctx.vars.get('%x'), '5');
console.log('  ✓ runs set command');

ctx.vars.set('%x', 5);
interp.load('alias test { inc %x }');
interp.call('test');
assert.equal(ctx.vars.get('%x'), 6);
console.log('  ✓ runs inc command');

ctx.vars.set('%x', 5);
interp.load('alias test { dec %x }');
interp.call('test');
assert.equal(ctx.vars.get('%x'), 4);
console.log('  ✓ runs dec command');

console.log('\nTesting interpreter - hash commands...');

interp.load('alias test { hmake mytable | hadd mytable key value | set %r $hget(mytable, key) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'value');
console.log('  ✓ runs hash commands');

console.log('\nTesting interpreter - ini commands...');

interp.load('alias test { writeini file section key value | set %r $readini(file, section, key) }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), 'value');
console.log('  ✓ runs ini commands');

console.log('\nTesting interpreter - regex...');

interp.load('alias test { set %r $regex("hello world", "/world/") }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '1');
console.log('  ✓ evaluates $regex');

interp.load('alias test { set %r $regex("hello", "/x/") }');
interp.call('test');
assert.equal(ctx.vars.get('%r'), '0');
console.log('  ✓ evaluates $regex no match');

console.log('\n✓ All interpreter unit tests passed');
