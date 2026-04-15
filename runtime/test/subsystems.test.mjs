import assert from 'node:assert/strict';
import { HashStore, IniStore, FileStore, SocketShim, IrcShim } from '../src/subsystems.js';
import { EventBus } from '../src/event-bus.js';

console.log('Testing HashStore...');

const hash = new HashStore();
hash.hmake('mytable');
assert.ok(hash.tables.has('mytable'));
console.log('  ✓ creates table');

hash.hadd('mytable', 'key1', 'value1');
assert.equal(hash.hget('mytable', 'key1'), 'value1');
console.log('  ✓ adds and gets entries');

hash.hadd('mytable', 'key2', 'value2');
assert.equal(hash.hget('mytable', 'key2'), 'value2');
console.log('  ✓ handles multiple entries');

hash.hdel('mytable', 'key1');
assert.equal(hash.hget('mytable', 'key1'), '');
console.log('  ✓ deletes entries');

hash.hfree('mytable');
assert.ok(!hash.tables.has('mytable'));
console.log('  ✓ frees table');

hash.hadd('autocreate', 'key', 'value');
assert.ok(hash.tables.has('autocreate'));
console.log('  ✓ auto-creates table on hadd');

console.log('\nTesting IniStore...');

const ini = new IniStore();
ini.write('config.ini', 'section1', 'key1', 'value1');
assert.equal(ini.read('config.ini', 'section1', 'key1'), 'value1');
console.log('  ✓ writes and reads entries');

ini.write('config.ini', 'section1', 'key2', 'value2');
assert.equal(ini.read('config.ini', 'section1', 'key2'), 'value2');
console.log('  ✓ handles multiple keys');

ini.write('config.ini', 'section2', 'key1', 'value3');
assert.equal(ini.read('config.ini', 'section2', 'key1'), 'value3');
console.log('  ✓ handles multiple sections');

ini.remove('config.ini', 'section1', 'key1');
assert.equal(ini.read('config.ini', 'section1', 'key1'), '');
console.log('  ✓ removes key');

ini.remove('config.ini', 'section1');
assert.equal(ini.read('config.ini', 'section1', 'key2'), '');
console.log('  ✓ removes section');

console.log('\nTesting FileStore...');

const files = new FileStore();
files.fopen('fh1', 'test.txt');
assert.ok(files.handles.has('fh1'));
console.log('  ✓ opens file handle');

files.fwrite('fh1', 'line1');
files.fwrite('fh1', 'line2');
assert.equal(files.fread('fh1'), 'line1');
assert.equal(files.fread('fh1'), 'line2');
console.log('  ✓ writes and reads lines');

files.fclose('fh1');
assert.ok(!files.handles.has('fh1'));
console.log('  ✓ closes handle');

files.fopen('fh2', 'new.txt');
assert.ok(files.isfile('new.txt'));
console.log('  ✓ checks if file exists');

console.log('\nTesting SocketShim...');

const events = [];
const eventBus = {
  emit: (type, payload) => events.push({ type, payload }),
};
const sockets = new SocketShim(eventBus);

sockets.sockopen('mysock', 'example.com', 80);
assert.ok(sockets.sockets.has('mysock'));
assert.equal(events[0].type, 'SOCKOPEN');
console.log('  ✓ opens socket');

sockets.sockwrite('mysock', 'hello');
assert.equal(events[1].type, 'SOCKREAD');
console.log('  ✓ writes to socket');

const sockInfo = sockets.sock('mysock');
assert.equal(sockInfo.host, 'example.com');
assert.equal(sockInfo.port, 80);
console.log('  ✓ gets socket info');

sockets.sockclose('mysock');
assert.ok(!sockets.sockets.has('mysock'));
assert.equal(events[2].type, 'SOCKCLOSE');
console.log('  ✓ closes socket');

console.log('\nTesting IrcShim...');

const ircEvents = [];
const ircEventBus = {
  emit: (type, payload) => ircEvents.push({ type, payload }),
};
const irc = new IrcShim(ircEventBus);

assert.equal(irc.nick, 'nixrc');
assert.equal(irc.server, 'mock.server');
console.log('  ✓ has default values');

irc.connect('irc.example.com');
assert.equal(irc.server, 'irc.example.com');
assert.equal(ircEvents[0].type, 'CONNECT');
console.log('  ✓ connects to server');

irc.join('#test');
assert.equal(irc.chan, '#test');
assert.equal(ircEvents[1].type, 'JOIN');
console.log('  ✓ joins channel');

irc.msg('#test', 'hello');
assert.equal(ircEvents[2].type, 'TEXT');
console.log('  ✓ sends message');

irc.part('#test');
assert.equal(ircEvents[3].type, 'PART');
console.log('  ✓ parts channel');

console.log('\n✓ All subsystem tests passed');
