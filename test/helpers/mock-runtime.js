import { HashStore, IniStore, FileStore } from '../../runtime/src/subsystems.js';

export function createMockContext(overrides = {}) {
  const logs = [];
  const events = [];
  
  const eventBus = {
    emit: (type, payload) => events.push({ type, payload }),
    on: () => {},
  };

  const pictureWindow = {
    drawRect: () => {},
    drawLine: () => {},
    drawText: () => {},
    drawDot: () => {},
    drawFill: () => {},
    drawPic: () => {},
    clear: () => {},
  };

  const textWindow = {
    append: () => {},
    insert: () => {},
    delete: () => {},
    replace: () => {},
    clear: () => {},
  };

  const ctx = {
    vars: new Map(),
    eventBus,
    log: (level, msg) => logs.push({ level, msg }),
    windowManager: {
      info: () => ({ x: 0, y: 0, w: 10, h: 10 }),
      get: () => pictureWindow,
      openPicture: () => pictureWindow,
      openText: () => textWindow,
      loadImage: () => Promise.resolve(null),
      clearAll: () => {},
    },
    dialogs: {
      didText: () => '',
      open: () => {},
      close: () => {},
      defineDialog: () => {},
      didReplaceAll: () => {},
      didAppend: () => {},
      didReset: () => {},
    },
    timers: {
      count: () => 0,
      start: (_name, _reps, _interval, fn) => fn?.(),
      stopAll: () => {},
    },
    hash: new HashStore(),
    ini: new IniStore(),
    files: new FileStore(),
    sockets: {
      sock: () => null,
      sockopen: () => {},
      sockwrite: () => {},
      sockclose: () => {},
    },
    irc: {
      nick: 'tester',
      chan: '#room',
      server: 'irc.local',
      network: 'localnet',
      connect: () => {},
      join: () => {},
      part: () => {},
      msg: () => {},
    },
    mouse: { x: 0, y: 0, key: 0 },
    lastRegex: { matches: [], captures: [] },
    event: {},
    errorHandler: {
      handle: (err) => { logs.push({ level: 'error', msg: err.message }); return null; },
      hasErrors: () => false,
      getErrors: () => [],
      clear: () => {},
    },
    ...overrides,
  };

  return { ctx, logs, events };
}

export function createMockDom() {
  const elements = [];
  
  const createElement = (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      style: {},
      dataset: {},
      children: [],
      appendChild: (child) => { el.children.push(child); return child; },
      addEventListener: () => {},
      remove: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    };
    elements.push(el);
    return el;
  };

  const canvas = createElement('canvas');
  canvas.getContext = () => ({
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    fill: () => {},
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(400), width: 10, height: 10 }),
    putImageData: () => {},
  });

  return {
    createElement,
    elements,
    canvas,
    body: createElement('div'),
  };
}

export function assertContains(arr, predicate) {
  const found = arr.find(predicate);
  if (!found) {
    throw new Error(`Expected to find element matching predicate in ${JSON.stringify(arr)}`);
  }
  return found;
}
