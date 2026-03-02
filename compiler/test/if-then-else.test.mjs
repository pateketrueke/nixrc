import assert from 'node:assert/strict';
import { parseMirc } from '../src/parser.js';
import { generate } from '../src/codegen.js';

function testMultiLineIfElse() {
  const input = `
if ($1 == a) {
  echo -s a
}
else {
  echo -s not a
}
`;

  const ast = parseMirc(input);
  assert.equal(ast.type, 'Program');
  assert.equal(ast.body.length, 1);

  const ifNode = ast.body[0];
  assert.equal(ifNode.type, 'IfStatement');
  assert.ok(ifNode.condition.includes('$1'));
  assert.equal(ifNode.body.length, 1);
  assert.equal(ifNode.body[0].name, 'echo');

  assert.ok(ifNode.alternate, 'Should have else block');
  assert.equal(ifNode.alternate.type, 'ElseStatement');
  assert.equal(ifNode.alternate.body.length, 1);
  assert.equal(ifNode.alternate.body[0].name, 'echo');

  console.log('  ✓ multi-line if/else');
}

function testMultiLineIfElseifElse() {
  const input = `
if ($1 == a) {
  echo -s a
}
elseif ($1 == b) {
  echo -s b
}
else {
  echo -s other
}
`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.ok(ifNode.alternate, 'Should have elseif');
  assert.equal(ifNode.alternate.type, 'ElseifStatement');
  assert.ok(ifNode.alternate.condition.includes('$1'));
  assert.ok(ifNode.alternate.alternate, 'Should have else after elseif');
  assert.equal(ifNode.alternate.alternate.type, 'ElseStatement');

  console.log('  ✓ multi-line if/elseif/else');
}

function testInlineIfElse() {
  const input = `if ($1 == a) { echo a } else { echo b }`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.ok(ifNode.alternate, 'Should have else');
  assert.equal(ifNode.alternate.type, 'ElseStatement');

  console.log('  ✓ inline if/else');
}

function testInlineIfElseifElse() {
  const input = `if ($1 == a) { echo a } elseif ($1 == b) { echo b } else { echo c }`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.ok(ifNode.alternate, 'Should have elseif');
  assert.equal(ifNode.alternate.type, 'ElseifStatement');
  assert.ok(ifNode.alternate.alternate, 'Should have else');
  assert.equal(ifNode.alternate.alternate.type, 'ElseStatement');

  console.log('  ✓ inline if/elseif/else');
}

function testSingleLineIfWithoutBraces() {
  const input = `if ($1) echo -s truthy`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.equal(ifNode.body.length, 1);
  assert.equal(ifNode.body[0].name, 'echo');

  console.log('  ✓ single-line if without braces');
}

function testSingleLineIfWithPipe() {
  const input = `if ($1) echo a | echo b`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.equal(ifNode.body.length, 2);
  assert.equal(ifNode.body[0].name, 'echo');
  assert.equal(ifNode.body[1].name, 'echo');

  console.log('  ✓ single-line if with pipe');
}

function testMinimalWhitespace() {
  const input = `if($1==a){echo a}else{echo b}`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.ok(ifNode.alternate, 'Should have else');

  console.log('  ✓ minimal whitespace');
}

function testNestedIfElse() {
  const input = `
if ($1 == a) {
  if ($2 == b) {
    echo nested
  }
  else {
    echo outer
  }
}
else {
  echo other
}
`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.equal(ifNode.body[0].type, 'IfStatement', 'Should have nested if');
  assert.ok(ifNode.body[0].alternate, 'Nested if should have else');
  assert.ok(ifNode.alternate, 'Outer if should have else');

  console.log('  ✓ nested if/else');
}

function testNestedParensCondition() {
  const input = `
if (%cur == 1 && (%sum == 2 || %sum == 3)) {
  echo alive
}
elseif (%cur == 0 && (%sum == 3 || %sum == 4)) {
  echo born
}
else {
  echo dead
}
`;

  const ast = parseMirc(input);
  const ifNode = ast.body[0];

  assert.equal(ifNode.type, 'IfStatement');
  assert.ok(ifNode.condition.includes('(%sum == 2 || %sum == 3)'));
  assert.ok(ifNode.alternate, 'Should have elseif');
  assert.equal(ifNode.alternate.type, 'ElseifStatement');
  assert.ok(ifNode.alternate.condition.includes('(%sum == 3 || %sum == 4)'));

  console.log('  ✓ nested parens in if/elseif condition');
}

function testWhileWithOpeningBraceSameLine() {
  const input = `
alias loop {
  set %i 1
  set %n 2
  while (%i <= %n) {
    inc %i
  }
}
`;

  const ast = parseMirc(input);
  const alias = ast.body[0];
  const loop = alias.body.find((x) => x.type === 'WhileStatement');

  assert.ok(loop, 'Should parse while statement');
  assert.equal(loop.condition.trim(), '%i <= %n');
  assert.equal(loop.body.length, 1);
  assert.equal(loop.body[0].name, 'inc');

  console.log('  ✓ while with opening brace on same line');
}

function testCodegenIfElse() {
  const input = `
if ($1 == a) {
  echo -s a
}
else {
  echo -s not a
}
`;

  const ast = parseMirc(input);
  const result = generate(ast);

  assert.ok(result.code.includes('if ('));
  assert.ok(result.code.includes('else {'));
  assert.ok(!result.code.includes('else if'), 'Should not have else if for simple else');

  console.log('  ✓ codegen if/else');
}

function testCodegenIfElseifElse() {
  const input = `
if ($1 == a) {
  echo -s a
}
elseif ($1 == b) {
  echo -s b
}
else {
  echo -s other
}
`;

  const ast = parseMirc(input);
  const result = generate(ast);

  assert.ok(result.code.includes('if ('));
  assert.ok(result.code.includes('else if ('));
  assert.ok(result.code.includes('else {'));

  console.log('  ✓ codegen if/elseif/else');
}

console.log('Testing if-then-else syntax...');
testMultiLineIfElse();
testMultiLineIfElseifElse();
testInlineIfElse();
testInlineIfElseifElse();
testSingleLineIfWithoutBraces();
testSingleLineIfWithPipe();
testMinimalWhitespace();
testNestedIfElse();
testNestedParensCondition();
testWhileWithOpeningBraceSameLine();
testCodegenIfElse();
testCodegenIfElseifElse();
console.log('\nAll if-then-else tests passed!');
