import { EventBus } from './event-bus.js';
import { WindowManager } from './window-manager.js';
import { DialogManager } from './dialog-manager.js';
import { TimerManager } from './timer-manager.js';
import { HashStore, IniStore, FileStore, SocketShim, IrcShim } from './subsystems.js';
import { MirxInterpreter } from './interpreter.js';

export function createRuntime(options = {}) {
  const host = options.host || document.body;
  const logger = options.log || (() => {});

  const eventBus = new EventBus();
  const windowManager = new WindowManager(host);
  const dialogs = new DialogManager(host, eventBus);
  const timers = new TimerManager((x) => logger('timer', JSON.stringify(x)));
  const hash = new HashStore();
  const ini = new IniStore();
  const files = new FileStore();
  const sockets = new SocketShim(eventBus);
  const irc = new IrcShim(eventBus);

  const ctx = {
    vars: new Map(),
    eventBus,
    windowManager,
    dialogs,
    timers,
    hash,
    ini,
    files,
    sockets,
    irc,
    mouse: { x: 0, y: 0, key: 0 },
    log: logger,
  };

  const interpreter = new MirxInterpreter(ctx);

  function reset() {
    timers.stopAll();
    windowManager.clearAll();
    for (const dlg of dialogs.opened.keys()) dialogs.close(dlg);
    ctx.vars.clear();
  }

  function load(source) {
    return interpreter.load(source);
  }

  function run(alias = 'start', args = []) {
    interpreter.call(alias, args);
  }

  function emit(event, payload) {
    eventBus.emit(event, payload);
  }

  return {
    ctx,
    load,
    run,
    emit,
    reset,
    defineDialog: (name, spec) => dialogs.defineDialog(name, spec),
  };
}

export { EventBus, WindowManager, DialogManager, TimerManager, MirxInterpreter };
