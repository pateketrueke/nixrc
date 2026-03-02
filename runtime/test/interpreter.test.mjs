import assert from 'node:assert/strict';
import { EventBus } from '../src/event-bus.js';
import { NixrcInterpreter } from '../src/interpreter.js';
import { HashStore, IniStore, FileStore } from '../src/subsystems.js';

const logs = [];
const events = new EventBus();
const drawPicCalls = [];
const loadPicCalls = [];

const pictureWindow = {
  drawPic: (opts) => drawPicCalls.push(opts),
};

const ctx = {
  vars: new Map(),
  eventBus: events,
  log: (level, msg) => logs.push(`${level}:${msg}`),
  windowManager: {
    info: () => ({ x: 0, y: 0, w: 10, h: 10 }),
    get: () => pictureWindow,
    openPicture: () => pictureWindow,
    openText: () => ({ append: () => {}, insert: () => {}, delete: () => {}, replace: () => {}, clear: () => {} }),
    loadImage: (src) => {
      loadPicCalls.push(src);
      return Promise.resolve(null);
    },
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

alias tokdemo {
  set %nt1 $numtok("BTN1 BTN2 CHK1",32)
  set %tk1 $gettok("BTN1 BTN2 CHK1",2,32)
  set %nt2 $numtok("a,b,c",44)
  set %tk2 $gettok("a,b,c",3,44)
}

alias picdemo {
  loadpic tiles.png
  drawpic @paint 10 20 icon.png
  drawpic -c @paint 100 120 32 32 avatar.png
  drawpic -m @paint 0 0 64 64 0 0 16 16 tiles.png
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
i.call('tokdemo');
i.call('picdemo');
events.emit('MDOWN', { match: '@paint', target: '@paint', x: 12, y: 34 });

assert.equal(ctx.vars.get('%x'), '5');
assert.equal(ctx.hash.hget('store', 'key'), 'value');
assert.equal(ctx.ini.read('cfg', 'section', 'key'), 'value');
assert.equal(ctx.vars.get('%rx'), '1');
assert.equal(ctx.vars.get('%cap'), 'nixrc');
assert.ok(Number(ctx.vars.get('%r')) >= 1 && Number(ctx.vars.get('%r')) <= 3);
assert.equal(ctx.vars.get('%nt1'), '3');
assert.equal(ctx.vars.get('%tk1'), 'BTN2');
assert.equal(ctx.vars.get('%nt2'), '3');
assert.equal(ctx.vars.get('%tk2'), 'c');
assert.equal(ctx.vars.get('%mx'), '12');
assert.equal(ctx.vars.get('%my'), '34');
assert.deepEqual(loadPicCalls, ['tiles.png']);
assert.equal(drawPicCalls.length, 3);
assert.equal(drawPicCalls[0].src, 'icon.png');
assert.deepEqual(drawPicCalls[0].flags, { c: false, m: false, s: false });
assert.equal(drawPicCalls[1].src, 'avatar.png');
assert.equal(drawPicCalls[1].flags.c, true);
assert.equal(drawPicCalls[2].sw, 16);
assert.equal(drawPicCalls[2].sh, 16);
assert.equal(drawPicCalls[2].flags.m, true);
assert.ok(logs.some((x) => x.includes('one')));
assert.ok(logs.some((x) => x.includes('two')));
assert.ok(logs.some((x) => x.includes('pong')));
assert.ok(logs.some((x) => x.includes('event-fired')));

console.log('runtime interpreter test passed');
