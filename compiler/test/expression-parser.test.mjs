import assert from 'node:assert/strict';
import { parseExpression, tokenize, TOKEN_TYPES } from '../src/expression-parser.js';

console.log('Testing tokenizer...');

const tokens = tokenize('42');
assert.equal(tokens[0].type, TOKEN_TYPES.NUMBER);
assert.equal(tokens[0].value, '42');
console.log('  ✓ tokenizes numbers');

const floatTokens = tokenize('3.14');
assert.equal(floatTokens[0].type, TOKEN_TYPES.NUMBER);
assert.equal(floatTokens[0].value, '3.14');
console.log('  ✓ tokenizes floats');

const negTokens = tokenize('-5');
assert.equal(negTokens[0].type, TOKEN_TYPES.NUMBER);
assert.equal(negTokens[0].value, '-5');
console.log('  ✓ tokenizes negative numbers');

const strTokens = tokenize('"hello"');
assert.equal(strTokens[0].type, TOKEN_TYPES.STRING);
assert.equal(strTokens[0].value, 'hello');
console.log('  ✓ tokenizes strings');

const varTokens = tokenize('%x');
assert.equal(varTokens[0].type, TOKEN_TYPES.VARIABLE);
assert.equal(varTokens[0].value, '%x');
console.log('  ✓ tokenizes variables');

const identTokens = tokenize('$nick');
assert.equal(identTokens[0].type, TOKEN_TYPES.IDENTIFIER);
assert.equal(identTokens[0].value, '$nick');
console.log('  ✓ tokenizes identifiers');

const paramTokens = tokenize('$1 $2');
assert.equal(paramTokens[0].type, TOKEN_TYPES.IDENTIFIER);
assert.equal(paramTokens[0].value, '$1');
assert.equal(paramTokens[1].type, TOKEN_TYPES.IDENTIFIER);
assert.equal(paramTokens[1].value, '$2');
console.log('  ✓ tokenizes positional parameters');

const opTokens = tokenize('1 + 2 - 3 * 4 / 5');
assert.equal(opTokens[1].type, TOKEN_TYPES.OPERATOR);
assert.equal(opTokens[1].value, '+');
assert.equal(opTokens[3].value, '-');
assert.equal(opTokens[5].value, '*');
assert.equal(opTokens[7].value, '/');
console.log('  ✓ tokenizes operators');

const twoCharTokens = tokenize('1 <> 2 && 3 || 4');
assert.equal(twoCharTokens[1].value, '<>');
assert.equal(twoCharTokens[3].value, '&&');
assert.equal(twoCharTokens[5].value, '||');
console.log('  ✓ tokenizes two-character operators');

const parenTokens = tokenize('(1 + 2)');
assert.equal(parenTokens[0].type, TOKEN_TYPES.LPAREN);
assert.equal(parenTokens[4].type, TOKEN_TYPES.RPAREN);
console.log('  ✓ tokenizes parentheses');

const callTokens = tokenize('$calc(1 + 2)');
assert.equal(callTokens[0].type, TOKEN_TYPES.IDENTIFIER);
assert.equal(callTokens[0].value, '$calc');
assert.equal(callTokens[1].type, TOKEN_TYPES.LPAREN);
console.log('  ✓ tokenizes function calls');

console.log('\nTesting parser...');

let ast = parseExpression('42');
assert.equal(ast.type, 'Literal');
assert.equal(ast.value, 42);
console.log('  ✓ parses number literals');

ast = parseExpression('"hello"');
assert.equal(ast.type, 'Literal');
assert.equal(ast.value, 'hello');
console.log('  ✓ parses string literals');

ast = parseExpression('%x');
assert.equal(ast.type, 'Variable');
assert.equal(ast.name, '%x');
console.log('  ✓ parses variables');

ast = parseExpression('$nick');
assert.equal(ast.type, 'Identifier');
assert.equal(ast.name, '$nick');
console.log('  ✓ parses identifiers');

ast = parseExpression('1 + 2');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '+');
assert.equal(ast.left.type, 'Literal');
assert.equal(ast.left.value, 1);
assert.equal(ast.right.type, 'Literal');
assert.equal(ast.right.value, 2);
console.log('  ✓ parses binary operations');

ast = parseExpression('1 + 2 * 3');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '+');
assert.equal(ast.right.type, 'BinaryOp');
assert.equal(ast.right.op, '*');
console.log('  ✓ respects operator precedence');

ast = parseExpression('(1 + 2) * 3');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '*');
assert.equal(ast.left.type, 'BinaryOp');
assert.equal(ast.left.op, '+');
console.log('  ✓ handles parentheses');

ast = parseExpression('$calc(1 + 2)');
assert.equal(ast.type, 'Call');
assert.equal(ast.name, '$calc');
assert.equal(ast.args.length, 1);
console.log('  ✓ parses function calls');

ast = parseExpression('$mid(text, 1, 3)');
assert.equal(ast.type, 'Call');
assert.equal(ast.name, '$mid');
assert.equal(ast.args.length, 3);
console.log('  ✓ parses function calls with multiple arguments');

ast = parseExpression('-5');
assert.equal(ast.type, 'Literal');
assert.equal(ast.value, -5);
console.log('  ✓ parses negative numbers as literals');

ast = parseExpression('-(5 + 3)');
assert.equal(ast.type, 'UnaryOp');
assert.equal(ast.op, '-');
console.log('  ✓ parses unary minus for expressions');

ast = parseExpression('5 > 3');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '>');
console.log('  ✓ parses comparison operators');

ast = parseExpression('a = b');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '=');
console.log('  ✓ parses equality operators');

ast = parseExpression('a <> b');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '<>');
console.log('  ✓ parses not-equal operators');

ast = parseExpression('1 && 0');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '&&');
console.log('  ✓ parses logical operators');

ast = parseExpression('2 ^ 3');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '^');
console.log('  ✓ parses power operator');

ast = parseExpression('');
assert.equal(ast.type, 'Literal');
assert.equal(ast.value, '');
console.log('  ✓ handles empty input');

ast = parseExpression(null);
assert.equal(ast.type, 'Literal');
assert.equal(ast.value, '');
console.log('  ✓ handles null input');

ast = parseExpression('((1 + 2) * (3 - 4)) / 5');
assert.equal(ast.type, 'BinaryOp');
assert.equal(ast.op, '/');
console.log('  ✓ handles complex nested expressions');

console.log('\n✓ All expression parser tests passed');
