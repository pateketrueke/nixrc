import { EventBus } from './event-bus.js';
import { WindowManager } from './window-manager.js';
import { DialogManager } from './dialog-manager.js';
import { TimerManager } from './timer-manager.js';
import { HashStore, IniStore, FileStore, SocketShim, IrcShim } from './subsystems.js';
import { NixrcInterpreter } from './interpreter.js';
import { ErrorHandler, createErrorHandler } from './error-handler.js';

export function createRuntime(options = {}) {
  const host = options.host || document.body;
  const logger = options.log || (() => {});
  const errorHandler = createErrorHandler({
    mode: options.errorMode || 'log',
    maxErrors: options.maxErrors || 100,
    onLimitReached: options.onErrorLimit || null,
  });

  if (options.onError) {
    errorHandler.on('RUNTIME_ERROR', options.onError);
    errorHandler.on('COMMAND_ERROR', options.onError);
    errorHandler.on('IDENTIFIER_ERROR', options.onError);
  }

  const eventBus = new EventBus();
  const mouse = { x: 0, y: 0, key: 0 };
  const windowManager = new WindowManager(host, (event, name, payload) => {
    mouse.x = Number(payload?.x) || 0;
    mouse.y = Number(payload?.y) || 0;
    mouse.key = Number(payload?.key) || 0;
    eventBus.emit(event, { ...payload, match: name, target: name, window: name });
  });
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
    mouse,
    lastRegex: { matches: [], captures: [] },
    event: {},
    log: logger,
    errorHandler,
  };

  const interpreter = new NixrcInterpreter(ctx);

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
    errorHandler,
    getErrors: () => errorHandler.getErrors(),
    clearErrors: () => errorHandler.clear(),
  };
}

export { EventBus, WindowManager, DialogManager, TimerManager, NixrcInterpreter, ErrorHandler };
export * from './errors.js';
