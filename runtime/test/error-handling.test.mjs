import assert from 'node:assert/strict';
import { 
  NixrcError, 
  ParseError, 
  RuntimeError, 
  CommandError, 
  IdentifierError,
  WindowError,
  DialogError,
  SocketError,
  FileError,
  TimeoutError,
  LoopLimitError,
  ERROR_CODES 
} from '../src/errors.js';
import { ErrorHandler, createErrorHandler } from '../src/error-handler.js';

console.log('Testing error classes...');

const err = new NixrcError('test message', 'TEST_CODE', { foo: 'bar' });
assert.equal(err.name, 'NixrcError');
assert.equal(err.message, 'test message');
assert.equal(err.code, 'TEST_CODE');
assert.deepEqual(err.context, { foo: 'bar' });
assert.ok(err.timestamp > 0);
console.log('  ✓ NixrcError works');

const parseErr = new ParseError('unexpected token', { line: 5, col: 10 }, 'source code');
assert.equal(parseErr.name, 'ParseError');
assert.equal(parseErr.code, ERROR_CODES.PARSE_ERROR);
assert.equal(parseErr.context.location.line, 5);
console.log('  ✓ ParseError works');

const cmdErr = new CommandError('unknown command', 'foo', ['arg1', 'arg2']);
assert.equal(cmdErr.name, 'CommandError');
assert.equal(cmdErr.code, ERROR_CODES.COMMAND_ERROR);
assert.equal(cmdErr.context.command, 'foo');
console.log('  ✓ CommandError works');

const identErr = new IdentifierError('unknown identifier', '$foo', ['arg']);
assert.equal(identErr.name, 'IdentifierError');
assert.equal(identErr.code, ERROR_CODES.IDENTIFIER_ERROR);
console.log('  ✓ IdentifierError works');

const winErr = new WindowError('window not found', '@test', 'draw');
assert.equal(winErr.name, 'WindowError');
assert.equal(winErr.code, ERROR_CODES.WINDOW_ERROR);
console.log('  ✓ WindowError works');

const dlgErr = new DialogError('dialog failed', 'myDialog', 'open');
assert.equal(dlgErr.name, 'DialogError');
assert.equal(dlgErr.code, ERROR_CODES.DIALOG_ERROR);
console.log('  ✓ DialogError works');

const sockErr = new SocketError('connection failed', 'mySock', 'open');
assert.equal(sockErr.name, 'SocketError');
assert.equal(sockErr.code, ERROR_CODES.SOCKET_ERROR);
console.log('  ✓ SocketError works');

const fileErr = new FileError('file not found', '/path/to/file', 'read');
assert.equal(fileErr.name, 'FileError');
assert.equal(fileErr.code, ERROR_CODES.FILE_ERROR);
console.log('  ✓ FileError works');

const timeoutErr = new TimeoutError('operation timed out', 'draw', 5000);
assert.equal(timeoutErr.name, 'TimeoutError');
assert.equal(timeoutErr.code, ERROR_CODES.TIMEOUT_ERROR);
console.log('  ✓ TimeoutError works');

const loopErr = new LoopLimitError('loop limit reached', 200, 200);
assert.equal(loopErr.name, 'LoopLimitError');
assert.equal(loopErr.code, ERROR_CODES.LOOP_LIMIT);
console.log('  ✓ LoopLimitError works');

console.log('\nTesting ErrorHandler...');

const handler = createErrorHandler({ mode: 'silent' });
assert.equal(handler.mode, 'silent');
assert.equal(handler.hasErrors(), false);
console.log('  ✓ creates handler with options');

const result = handler.handle(new CommandError('test', 'cmd', []));
assert.equal(result, null);
assert.equal(handler.hasErrors(), true);
assert.equal(handler.count(), 1);
console.log('  ✓ handles errors in silent mode');

handler.clear();
assert.equal(handler.hasErrors(), false);
assert.equal(handler.count(), 0);
console.log('  ✓ clears errors');

handler.handle(new CommandError('err1', 'cmd1', []));
handler.handle(new CommandError('err2', 'cmd2', []));
handler.handle(new IdentifierError('err3', '$id', []));
assert.equal(handler.count(), 3);
console.log('  ✓ tracks multiple errors');

const cmdErrors = handler.getErrorsByCode(ERROR_CODES.COMMAND_ERROR);
assert.equal(cmdErrors.length, 2);
console.log('  ✓ filters errors by code');

const last = handler.getLastErrors(2);
assert.equal(last.length, 2);
assert.equal(last[1].code, ERROR_CODES.IDENTIFIER_ERROR);
console.log('  ✓ gets last N errors');

handler.setMode('log');
assert.equal(handler.mode, 'log');
console.log('  ✓ sets mode');

let hookCalled = false;
handler.on(ERROR_CODES.COMMAND_ERROR, (err) => {
  hookCalled = true;
});
handler.handle(new CommandError('hook test', 'cmd', []));
assert.equal(hookCalled, true);
console.log('  ✓ calls hooks');

handler.off(ERROR_CODES.COMMAND_ERROR);
handler.clear();
assert.equal(handler.hooks.has(ERROR_CODES.COMMAND_ERROR), false);
console.log('  ✓ removes hooks');

console.log('\nTesting ErrorHandler throw mode...');

const throwHandler = createErrorHandler({ mode: 'throw' });
try {
  throwHandler.handle(new CommandError('should throw', 'cmd', []));
  assert.fail('should have thrown');
} catch (e) {
  assert.equal(e.code, ERROR_CODES.COMMAND_ERROR);
  console.log('  ✓ throws in throw mode');
}

console.log('\nTesting ErrorHandler wrap...');

const wrapHandler = createErrorHandler({ mode: 'silent' });
const wrappedFn = wrapHandler.wrap(
  () => { throw new Error('wrapped error'); },
  { operation: 'test' }
);
const wrapResult = wrappedFn();
assert.equal(wrapResult, null);
assert.equal(wrapHandler.hasErrors(), true);
console.log('  ✓ wraps functions');

console.log('\nTesting error toJSON...');

const jsonErr = new CommandError('json test', 'cmd', ['arg']);
const json = jsonErr.toJSON();
assert.equal(json.name, 'CommandError');
assert.equal(json.message, 'json test');
assert.equal(json.code, ERROR_CODES.COMMAND_ERROR);
assert.ok(json.timestamp > 0);
console.log('  ✓ serializes to JSON');

console.log('\n✓ All error handling tests passed');
