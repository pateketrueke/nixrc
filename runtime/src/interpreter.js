import { parseMirc } from '../../compiler/src/parser.js';
import { tokenizeCommand, splitArgs } from '../../compiler/src/token-utils.js';

function stripQuotes(v) {
  return v?.startsWith('"') && v?.endsWith('"') ? v.slice(1, -1) : v;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function resolveToken(token, ctx, args = []) {
  if (token == null) return '';
  if (/^%[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) return ctx.vars.get(token) ?? '';
  if (/^\$\d+$/.test(token)) return args[Number(token.slice(1)) - 1] ?? '';
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  if (token.startsWith('$')) return evalIdentifier(token, ctx, args);
  return stripQuotes(token);
}

function evalIdentifier(token, ctx, args) {
  if (token === '$nick') return ctx.irc.nick;
  if (token === '$chan') return ctx.irc.chan;
  if (token === '$server') return ctx.irc.server;
  if (token === '$network') return ctx.irc.network;

  const call = token.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
  if (!call) return token;
  const name = call[1].toLowerCase();
  const rawArgs = splitArgs(call[2]).map((x) => resolveToken(x.trim(), ctx, args));

  if (name === 'calc') {
    const expr = String(rawArgs[0] ?? '')
      .replace(/%([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, n) => ctx.vars.get(`%${n}`) ?? 0);
    try {
      return Function(`"use strict"; return (${expr});`)();
    } catch {
      return 0;
    }
  }
  if (name === 'upper') return String(rawArgs[0] ?? '').toUpperCase();
  if (name === 'lower') return String(rawArgs[0] ?? '').toLowerCase();
  if (name === 'len') return String(rawArgs[0] ?? '').length;
  if (name === 'left') return String(rawArgs[0] ?? '').slice(0, toNumber(rawArgs[1]));
  if (name === 'right') return String(rawArgs[0] ?? '').slice(-toNumber(rawArgs[1]));
  if (name === 'mid') return String(rawArgs[0] ?? '').slice(toNumber(rawArgs[1]) - 1, toNumber(rawArgs[1]) - 1 + toNumber(rawArgs[2]));
  if (name === 'str') return String(rawArgs[0] ?? '').repeat(toNumber(rawArgs[1] ?? 1));
  if (name === 'chr') return String.fromCharCode(toNumber(rawArgs[0]));
  if (name === 'asc') return String(rawArgs[0] ?? '').charCodeAt(0) || 0;
  if (name === 'rgb') return `rgb(${rawArgs.map((x) => toNumber(x)).join(',')})`;
  if (name === 'window') return ctx.windowManager.info(rawArgs[0]);
  if (name === 'mouse') return ctx.mouse?.[rawArgs[0]] ?? 0;
  if (name === 'did') return ctx.dialogs.didText(rawArgs[0], rawArgs[1]);
  if (name === 'timer' && rawArgs[0] === 0) return ctx.timers.count();
  if (name === 'hget') return ctx.hash.hget(rawArgs[0], rawArgs[1]);
  if (name === 'readini') return ctx.ini.read(rawArgs[0], rawArgs[1], rawArgs[2]);
  if (name === 'fread') return ctx.files.fread(rawArgs[0]);
  if (name === 'isfile') return ctx.files.isfile(rawArgs[0]) ? 1 : 0;
  if (name === 'sock') return ctx.sockets.sock(rawArgs[0]) ?? {};

  return '';
}

function evalCondition(expr, ctx, args) {
  const tokens = tokenizeCommand(expr);
  const replaced = tokens.map((t) => {
    if (t === '||' || t === '&&' || t === '>' || t === '<' || t === '>=' || t === '<=' || t === '==' || t === '=' || t === '!=') return t === '=' ? '==' : t;
    const v = resolveToken(t, ctx, args);
    return typeof v === 'string' ? JSON.stringify(v) : String(v);
  });

  try {
    return Boolean(Function(`"use strict"; return (${replaced.join(' ')});`)());
  } catch {
    return false;
  }
}

export class MirxInterpreter {
  constructor(ctx) {
    this.ctx = ctx;
    this.aliases = new Map();
  }

  load(source) {
    const ast = parseMirc(source);

    for (const node of ast.body) {
      if (node.type === 'AliasDeclaration') {
        this.aliases.set(node.name.toLowerCase(), node);
      }
      if (node.type === 'EventHandler') {
        this.ctx.eventBus.on(node.event, { match: node.match || '*', target: node.target || '*' }, (payload) => {
          this.runStatements(node.body, payload, []);
        });
      }
    }

    return ast;
  }

  call(alias, args = []) {
    const node = this.aliases.get(String(alias).toLowerCase());
    if (!node) return;
    this.runStatements(node.body, {}, args);
  }

  runStatements(statements, payload = {}, args = []) {
    for (const stmt of statements) {
      if (!stmt) continue;
      if (stmt.type === 'CommandStatement') this.runCommand(stmt.name, stmt.args, payload, args);
      if (stmt.type === 'IfStatement') {
        if (evalCondition(stmt.condition, this.ctx, args)) {
          this.runStatements(stmt.body, payload, args);
        } else if (stmt.alternate) {
          this.runAlternate(stmt.alternate, payload, args);
        }
      }
      if (stmt.type === 'WhileStatement') {
        let guard = 0;
        while (guard < 200 && evalCondition(stmt.condition, this.ctx, args)) {
          this.runStatements(stmt.body, payload, args);
          guard += 1;
        }
      }
      if (stmt.type === 'SequenceStatement') this.runStatements(stmt.body, payload, args);
    }
  }

  runAlternate(alternate, payload, args) {
    if (alternate.type === 'ElseStatement') {
      this.runStatements(alternate.body, payload, args);
    } else if (alternate.type === 'ElseifStatement') {
      if (evalCondition(alternate.condition, this.ctx, args)) {
        this.runStatements(alternate.body, payload, args);
      } else if (alternate.alternate) {
        this.runAlternate(alternate.alternate, payload, args);
      }
    }
  }

  runCommand(name, args, payload, aliasArgs) {
    const n = String(name).toLowerCase();
    const resolved = args.map((a) => resolveToken(a, this.ctx, aliasArgs));

    if (n === 'set' || n === 'var') {
      const key = args[0];
      this.ctx.vars.set(key, resolved.slice(1).join(' '));
      return;
    }

    if (n.startsWith('%') && args[0] === '=') {
      this.ctx.vars.set(name, resolved.slice(1).join(' '));
      return;
    }

    if (n === 'echo') {
      const text = resolved.filter((x) => typeof x === 'string').join(' ');
      this.ctx.log('echo', text);
      return;
    }

    if (n === 'window') {
      const target = resolved.find((x) => String(x).startsWith('@')) || '@window';
      const isPicture = args.some((x) => String(x).includes('-p'));
      if (isPicture) this.ctx.windowManager.openPicture(target, { w: toNumber(resolved.at(-2)), h: toNumber(resolved.at(-1)) });
      else this.ctx.windowManager.openText(target);
      return;
    }

    if (n === 'drawrect') {
      const filled = args.some((x) => String(x).includes('f'));
      const win = this.ctx.windowManager.get(resolved[1]);
      win?.drawRect(resolved[2], resolved[3], resolved[4], resolved[5], resolved[6], filled);
      return;
    }

    if (n === 'drawline') {
      const win = this.ctx.windowManager.get(resolved[1]);
      win?.drawLine(resolved[2], resolved[3], resolved[4], resolved[5], resolved[6], resolved[7]);
      return;
    }

    if (n === 'drawtext') {
      const win = this.ctx.windowManager.get(resolved[0]);
      win?.drawText(resolved[1], resolved[2], resolved[3], resolved[4], resolved[5], resolved.slice(6).join(' '));
      return;
    }

    if (n === 'drawdot') {
      const win = this.ctx.windowManager.get(resolved[1]);
      win?.drawDot(resolved[2], resolved[3], resolved[4], resolved[5]);
      return;
    }

    if (n === 'cls') {
      const win = this.ctx.windowManager.get(resolved[0]);
      win?.clear('#000');
      return;
    }

    if (n === 'aline') {
      const win = this.ctx.windowManager.openText(resolved[0]);
      win.append(resolved.slice(1).join(' '));
      return;
    }

    if (n === 'iline') {
      const win = this.ctx.windowManager.openText(resolved[0]);
      win.insert(toNumber(resolved[1]), resolved.slice(2).join(' '));
      return;
    }

    if (n === 'dline') {
      const win = this.ctx.windowManager.openText(resolved[0]);
      win.delete(toNumber(resolved[1]));
      return;
    }

    if (n === 'rline') {
      const win = this.ctx.windowManager.openText(resolved[0]);
      win.replace(toNumber(resolved[1]), resolved.slice(2).join(' '));
      return;
    }

    if (n === 'clear') {
      const win = this.ctx.windowManager.openText(resolved[0]);
      win.clear();
      return;
    }

    if (n === 'dialog') {
      const mode = String(resolved[0] || '');
      const name = resolved[1];
      if (mode.includes('k')) this.ctx.dialogs.close(name);
      else this.ctx.dialogs.open(name, mode.includes('m'));
      return;
    }

    if (n === 'did') {
      const flag = String(resolved[0] || '');
      const dlg = resolved[1];
      const id = resolved[2];
      const text = resolved.slice(3).join(' ');
      if (flag.includes('ra')) this.ctx.dialogs.didReplaceAll(dlg, id, text);
      if (flag.includes('a')) this.ctx.dialogs.didAppend(dlg, id, text);
      if (flag.includes('r')) this.ctx.dialogs.didReset(dlg, id);
      return;
    }

    if (n.startsWith('.timer') || n === 'timer') {
      const [reps, interval, command] = resolved;
      const timerName = n.startsWith('.timer') && n.length > 6 ? n.slice(6) : null;
      this.ctx.timers.start(timerName, toNumber(reps), toNumber(interval), () => {
        if (typeof command === 'string' && this.aliases.has(command.toLowerCase())) this.call(command, []);
      });
      return;
    }

    if (n === 'hmake') return void this.ctx.hash.hmake(resolved[0]);
    if (n === 'hadd') return void this.ctx.hash.hadd(resolved[0], resolved[1], resolved.slice(2).join(' '));
    if (n === 'hdel') return void this.ctx.hash.hdel(resolved[0], resolved[1]);
    if (n === 'hfree') return void this.ctx.hash.hfree(resolved[0]);

    if (n === 'writeini') return void this.ctx.ini.write(resolved[0], resolved[1], resolved[2], resolved.slice(3).join(' '));
    if (n === 'remini') return void this.ctx.ini.remove(resolved[0], resolved[1], resolved[2]);

    if (n === 'fopen') return void this.ctx.files.fopen(resolved[0], resolved[1]);
    if (n === 'fclose') return void this.ctx.files.fclose(resolved[0]);
    if (n === 'fwrite') return void this.ctx.files.fwrite(resolved[0], resolved.slice(1).join(' '));

    if (n === 'sockopen') return void this.ctx.sockets.sockopen(resolved[0], resolved[1], resolved[2]);
    if (n === 'sockwrite') return void this.ctx.sockets.sockwrite(resolved[0], resolved.slice(1).join(' '));
    if (n === 'sockclose') return void this.ctx.sockets.sockclose(resolved[0]);

    if (n === 'server') return void this.ctx.irc.connect(resolved[0]);
    if (n === 'join') return void this.ctx.irc.join(resolved[0]);
    if (n === 'part') return void this.ctx.irc.part(resolved[0]);
    if (n === 'msg') return void this.ctx.irc.msg(resolved[0], resolved.slice(1).join(' '));

    if (this.aliases.has(n)) {
      this.call(n, resolved);
      return;
    }

    this.ctx.log('warn', `Unsupported command: ${name} ${args.join(' ')}`);
  }
}
