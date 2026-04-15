import assert from 'node:assert/strict';
import { parseMirc } from '../src/parser.js';

console.log('Testing parser - aliases...');

let ast = parseMirc('alias foo { echo bar }');
assert.equal(ast.type, 'Program');
assert.equal(ast.body[0].type, 'AliasDeclaration');
assert.equal(ast.body[0].name, 'foo');
console.log('  ✓ parses simple alias');

ast = parseMirc('alias greet { echo $1 }');
assert.equal(ast.body[0].type, 'AliasDeclaration');
assert.equal(ast.body[0].body[0].args[0], '$1');
console.log('  ✓ parses alias with parameters');

ast = parseMirc(`
alias test {
  set %x 1
  echo %x
}
`);
assert.equal(ast.body[0].type, 'AliasDeclaration');
assert.equal(ast.body[0].body.length, 2);
console.log('  ✓ parses multi-line alias');

ast = parseMirc('alias simple { echo a | echo b | echo c }');
assert.equal(ast.body[0].type, 'AliasDeclaration');
console.log('  ✓ parses alias with pipe operators');

console.log('\nTesting parser - event handlers...');

ast = parseMirc('on *:TEXT:hello:#:{ echo hi }');
assert.equal(ast.body[0].type, 'EventHandler');
assert.equal(ast.body[0].event, 'TEXT');
assert.equal(ast.body[0].match, 'hello');
assert.equal(ast.body[0].target, '#');
console.log('  ✓ parses TEXT event');

ast = parseMirc('on *:MDOWN:@paint:{ set %x 1 }');
assert.equal(ast.body[0].type, 'EventHandler');
assert.equal(ast.body[0].event, 'MDOWN');
console.log('  ✓ parses MDOWN event');

ast = parseMirc('on 1:JOIN:#:{ echo joined }');
assert.equal(ast.body[0].level, '1');
assert.equal(ast.body[0].event, 'JOIN');
console.log('  ✓ parses event with level');

console.log('\nTesting parser - dialogs...');

ast = parseMirc(`
dialog test {
  title "My Dialog"
  text "Label", 1, 10, 10, 50, 20
  button "OK", 2, 10, 40, 50, 20
}
`);
assert.equal(ast.body[0].type, 'DialogDeclaration');
assert.equal(ast.body[0].name, 'test');
assert.ok(ast.body[0].controls.length >= 2);
console.log('  ✓ parses dialog definition');

console.log('\nTesting parser - edge cases...');

ast = parseMirc('');
assert.equal(ast.type, 'Program');
assert.equal(ast.body.length, 0);
console.log('  ✓ handles empty script');

ast = parseMirc('; this is a comment\nalias foo { echo bar }');
assert.equal(ast.body.length, 1);
console.log('  ✓ handles comments');

ast = parseMirc('   \n   \nalias foo { echo bar }   \n   ');
assert.equal(ast.body.length, 1);
console.log('  ✓ handles whitespace');

ast = parseMirc('alias a { echo 1 }\nalias b { echo 2 }');
assert.equal(ast.body.length, 2);
console.log('  ✓ parses multiple aliases');

ast = parseMirc('alias test { set %x "hello world" }');
assert.ok(ast.body[0].body[0].args.length >= 2);
console.log('  ✓ handles quoted strings in commands');

console.log('\n✓ All parser tests passed');
