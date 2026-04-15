import assert from 'node:assert/strict';
import { evaluateExpression, evaluateCondition, evaluateAST, clearExpressionCache, getExpressionCacheStats } from '../src/expression-eval.js';

console.log('Testing evaluateAST...');

let ast = { type: 'Literal', value: 42 };
assert.equal(evaluateAST(ast, {}), 42);
console.log('  ✓ evaluates number literals');

ast = { type: 'Literal', value: 'hello' };
assert.equal(evaluateAST(ast, {}), 'hello');
console.log('  ✓ evaluates string literals');

ast = { type: 'Variable', name: '%x' };
const ctx = { vars: new Map([['%x', 'test']]) };
assert.equal(evaluateAST(ast, ctx), 'test');
console.log('  ✓ evaluates variables');

ast = { type: 'Variable', name: '%y' };
assert.equal(evaluateAST(ast, { vars: new Map() }), '');
console.log('  ✓ returns empty string for undefined variables');

ast = {
  type: 'BinaryOp',
  op: '+',
  left: { type: 'Literal', value: 1 },
  right: { type: 'Literal', value: 2 },
};
assert.equal(evaluateAST(ast, {}), 3);
console.log('  ✓ evaluates binary operations');

ast = {
  type: 'Call',
  name: '$test',
  args: [{ type: 'Literal', value: 1 }],
};
const callCtx = {
  identifiers: {
    '$test': (args) => args[0] * 2,
  },
};
assert.equal(evaluateAST(ast, callCtx), 2);
console.log('  ✓ evaluates function calls');

console.log('\nTesting evaluateExpression...');

clearExpressionCache();

assert.equal(evaluateExpression('1 + 2', {}), 3);
assert.equal(evaluateExpression('10 - 3', {}), 7);
assert.equal(evaluateExpression('2 * 3', {}), 6);
assert.equal(evaluateExpression('10 / 2', {}), 5);
assert.equal(evaluateExpression('10 % 3', {}), 1);
console.log('  ✓ evaluates simple arithmetic');

assert.equal(evaluateExpression('2 ^ 3', {}), 8);
assert.equal(evaluateExpression('3 ^ 2', {}), 9);
console.log('  ✓ evaluates power operator');

const varCtx = { vars: new Map([['%x', 5]]) };
assert.equal(evaluateExpression('%x + 1', varCtx), 6);
console.log('  ✓ evaluates variables');

assert.equal(evaluateExpression('5 > 3', {}), true);
assert.equal(evaluateExpression('3 > 5', {}), false);
assert.equal(evaluateExpression('5 >= 5', {}), true);
assert.equal(evaluateExpression('5 < 3', {}), false);
assert.equal(evaluateExpression('3 <= 5', {}), true);
console.log('  ✓ evaluates comparisons');

assert.equal(evaluateExpression('5 = 5', {}), true);
assert.equal(evaluateExpression('5 = 6', {}), false);
assert.equal(evaluateExpression('5 <> 6', {}), true);
assert.equal(evaluateExpression('5 <> 5', {}), false);
console.log('  ✓ evaluates equality');

assert.equal(evaluateExpression('1 && 1', {}), true);
assert.equal(evaluateExpression('1 && 0', {}), false);
assert.equal(evaluateExpression('0 || 1', {}), true);
assert.equal(evaluateExpression('0 || 0', {}), false);
console.log('  ✓ evaluates logical operators');

assert.equal(evaluateExpression('-5', {}), -5);
console.log('  ✓ evaluates unary minus');

assert.equal(evaluateExpression('(1 + 2) * 3', {}), 9);
assert.equal(evaluateExpression('1 + (2 * 3)', {}), 7);
console.log('  ✓ evaluates parentheses');

assert.equal(evaluateExpression('2 + 3 * 4', {}), 14);
assert.equal(evaluateExpression('(2 + 3) * 4', {}), 20);
console.log('  ✓ evaluates complex expressions');

assert.equal(evaluateExpression('"hello" + " world"', {}), 'hello world');
console.log('  ✓ handles string concatenation');

assert.equal(evaluateExpression('"value: " + 42', {}), 'value: 42');
console.log('  ✓ handles mixed types');

const resolveCtx = {
  resolveIdentifier: (name, args) => {
    if (name === '$double') return args[0] * 2;
    return 0;
  },
};
assert.equal(evaluateExpression('$double(5)', resolveCtx), 10);
console.log('  ✓ uses resolveIdentifier for function calls');

evaluateExpression('1 + 2', {});
const stats = getExpressionCacheStats();
assert.ok(stats.size > 0);
console.log('  ✓ caches parsed ASTs');

assert.equal(evaluateExpression('', {}), '');
assert.equal(evaluateExpression(null, {}), '');
assert.equal(evaluateExpression(undefined, {}), '');
console.log('  ✓ handles empty input');

assert.equal(evaluateExpression('10 / 0', {}), 0);
console.log('  ✓ handles division by zero');

console.log('\nTesting evaluateCondition...');

clearExpressionCache();

assert.equal(evaluateCondition('1', {}), true);
assert.equal(evaluateCondition('"yes"', {}), true);
assert.equal(evaluateCondition('5 > 3', {}), true);
console.log('  ✓ returns true for truthy values');

assert.equal(evaluateCondition('0', {}), false);
assert.equal(evaluateCondition('""', {}), false);
assert.equal(evaluateCondition('3 > 5', {}), false);
console.log('  ✓ returns false for falsy values');

assert.equal(evaluateCondition('1 > 0 && 2 > 1', {}), true);
assert.equal(evaluateCondition('1 > 0 || 0 > 1', {}), true);
assert.equal(evaluateCondition('1 > 0 && 0 > 1', {}), false);
console.log('  ✓ handles complex conditions');

console.log('\nTesting cache management...');

clearExpressionCache();
evaluateExpression('1 + 2', {});
evaluateExpression('3 * 4', {});
const cacheStats = getExpressionCacheStats();
assert.equal(cacheStats.size, 2);
assert.ok(cacheStats.maxSize > 0);
console.log('  ✓ reports cache stats');

clearExpressionCache();
const clearedStats = getExpressionCacheStats();
assert.equal(clearedStats.size, 0);
console.log('  ✓ clears cache');

console.log('\n✓ All expression evaluator tests passed');
