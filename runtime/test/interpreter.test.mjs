import assert from 'node:assert/strict';
import { EventBus } from '../src/event-bus.js';
import { NixrcInterpreter } from '../src/interpreter.js';
import { HashStore, IniStore, FileStore } from '../src/subsystems.js';

const logs = [];
const events = new EventBus();

const ctx = {
  vars: new Map(),
  eventBus: events,
  log: (level, msg) => logs.push(`${level}:${msg}`),
  windowManager: {
    info: () => ({ x: 0, y: 0, w: 10, h: 10 }),
    get: () => null,
    openPicture: () => null,
    openText: () => ({ append: () => {}, insert: () => {}, delete: () => {}, replace: () => {}, clear: () => {} }),
  },
  dialogs: { didText: () => '', open: () => {}, close: () => {}, didReplaceAll: () => {}, didAppend: () => {}, didReset: () => {} },
  timers: {
    count: () => 0,
    start: (_name, _reps, _interval, fn) => {
      fn();
    },
  },
  hash: new HashStore(),
  ini: new IniStore(),
  files: new FileStore(),
  sockets: { sock: () => null, sockopen: () => {}, sockwrite: () => {}, sockclose: () => {} },
  irc: {
    nick: 'tester',
    chan: '#room',
    server: 'irc.local',
    network: 'localnet',
    connect: () => {},
    join: () => {},
    part: () => {},
    msg: (target, text) => {
      events.emit('TEXT', { match: text, target, chan: target, nick: 'tester', text });
    },
  },
  mouse: { x: 0, y: 0, key: 0 },
};

const script = `
alias ping {
  echo -a pong
}

alias start {
  set %x 5
  echo -a one | echo -a two
  .timerx 1 1 ping
  hmake store
  hadd store key value
  writeini cfg section key value
  msg # hello
}

alias regexdemo {
  set %rx $regex("hello nixrc world","/nixrc/")
  set %cap $regml(0)
  set %r $rand(1,3)
}

on *:TEXT:hello:#:{
  echo -a event-fired
}

on *:MDOWN:@paint {
  set %mx $mouse.x
  set %my $mouse.y
}
`;

const i = new NixrcInterpreter(ctx);
i.load(script);
i.call('start');
i.call('regexdemo');
events.emit('MDOWN', { match: '@paint', target: '@paint', x: 12, y: 34 });

assert.equal(ctx.vars.get('%x'), '5');
assert.equal(ctx.hash.hget('store', 'key'), 'value');
assert.equal(ctx.ini.read('cfg', 'section', 'key'), 'value');
assert.equal(ctx.vars.get('%rx'), '1');
assert.equal(ctx.vars.get('%cap'), 'nixrc');
assert.ok(Number(ctx.vars.get('%r')) >= 1 && Number(ctx.vars.get('%r')) <= 3);
assert.equal(ctx.vars.get('%mx'), '12');
assert.equal(ctx.vars.get('%my'), '34');
assert.ok(logs.some((x) => x.includes('one')));
assert.ok(logs.some((x) => x.includes('two')));
assert.ok(logs.some((x) => x.includes('pong')));
assert.ok(logs.some((x) => x.includes('event-fired')));

console.log('runtime interpreter test passed');
