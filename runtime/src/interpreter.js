import { parseMirc } from '../../compiler/src/parser.js';
import { tokenizeCommand, splitArgs } from '../../compiler/src/token-utils.js';
import { evaluateExpression, evaluateCondition as safeEvalCondition } from './expression-eval.js';
import { CommandError, IdentifierError, WindowError, DialogError } from './errors.js';

function stripQuotes(v) {
  return v?.startsWith('"') && v?.endsWith('"') ? v.slice(1, -1) : v;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function tokenDelimiter(v) {
  const raw = String(v ?? '');
  const n = Number(raw);
  if (raw !== '' && Number.isFinite(n)) return String.fromCharCode(n);
  return raw[0] || ' ';
}

function tokenizeByDelimiter(input, delimiter) {
  return String(input ?? '')
    .split(delimiter)
    .filter((x) => x.length > 0);
}

function parseRegexArg(patternRaw) {
  const raw = String(patternRaw ?? '').trim();
  const slash = raw.match(/^\/(.+)\/([gimsuy]*)$/);
  if (slash) {
    try {
      return new RegExp(slash[1], slash[2]);
    } catch {
      return null;
    }
  }
  try {
    return new RegExp(raw);
  } catch {
    return null;
  }
}

function resolveToken(token, ctx, args = []) {
  if (token == null) {
    ctx.errorHandler?.handle(new IdentifierError('Null token encountered', 'null', args));
    return '';
  }
  if (/^%[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) return ctx.vars.get(token) ?? '';
  if (/^\$\d+$/.test(token)) return args[Number(token.slice(1)) - 1] ?? '';
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  if (token.startsWith('$')) return evalIdentifier(token, ctx, args);
  return stripQuotes(token);
}

function evalExpression(expr, ctx, args) {
  const asNumber = Number(expr);
  if (Number.isFinite(asNumber)) return asNumber;

  const evalCtx = {
    vars: ctx.vars,
    args,
    resolveIdentifier: (name, identifierArgs) => {
      if (name.startsWith('$')) {
        return evalIdentifier(name, ctx, args);
      }
      return '';
    },
  };

  return evaluateExpression(String(expr ?? ''), evalCtx);
}

function evalIdentifier(token, ctx, args) {
  if (token === '$nick') return ctx.event?.nick ?? ctx.irc.nick;
  if (token === '$chan') return ctx.event?.chan ?? ctx.irc.chan;
  if (token === '$server') return ctx.event?.server ?? ctx.irc.server;
  if (token === '$network') return ctx.event?.network ?? ctx.irc.network;
  if (token === '$ctime') return Math.floor(Date.now() / 1000);
  if (token === '$time') return new Date().toTimeString().slice(0, 8);
  if (token === '$date') return new Date().toISOString().slice(0, 10);
  if (token === '$mouse.x') return ctx.event?.x ?? ctx.mouse?.x ?? 0;
  if (token === '$mouse.y') return ctx.event?.y ?? ctx.mouse?.y ?? 0;

  const call = token.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
  if (!call) return token;
  const name = call[1].toLowerCase();
  const rawArgs = splitArgs(call[2]).map((x) => resolveToken(x.trim(), ctx, args));

  if (name === 'calc') {
    const expr = String(rawArgs[0] ?? '');
    const evalCtx = {
      vars: ctx.vars,
      args,
    };
    return evaluateExpression(expr, evalCtx);
  }
  if (name === 'asctime') {
    const format = String(rawArgs[0] ?? '');
    const now = new Date();
    if (format === 's') return now.getSeconds();
    if (format === 'n') return now.getMinutes();
    if (format === 'H') return now.getHours();
    if (format === 'd') return now.getDate();
    if (format === 'm') return now.getMonth() + 1;
    if (format === 'yyyy') return now.getFullYear();
    if (format.includes(':')) {
      return now.toTimeString().slice(0, 8);
    }
    return now.toISOString();
  }
  if (name === 'sin') return Math.sin(toNumber(rawArgs[0]) * Math.PI / 180);
  if (name === 'cos') return Math.cos(toNumber(rawArgs[0]) * Math.PI / 180);
  if (name === 'tan') return Math.tan(toNumber(rawArgs[0]) * Math.PI / 180);
  if (name === 'sqrt') return Math.sqrt(toNumber(rawArgs[0]));
  if (name === 'abs') return Math.abs(toNumber(rawArgs[0]));
  if (name === 'int') return Math.floor(toNumber(rawArgs[0]));
  if (name === 'upper') return String(rawArgs[0] ?? '').toUpperCase();
  if (name === 'lower') return String(rawArgs[0] ?? '').toLowerCase();
  if (name === 'len') return String(rawArgs[0] ?? '').length;
  if (name === 'left') return String(rawArgs[0] ?? '').slice(0, toNumber(rawArgs[1]));
  if (name === 'right') return String(rawArgs[0] ?? '').slice(-toNumber(rawArgs[1]));
  if (name === 'mid') return String(rawArgs[0] ?? '').slice(toNumber(rawArgs[1]) - 1, toNumber(rawArgs[1]) - 1 + toNumber(rawArgs[2]));
  if (name === 'str') return String(rawArgs[0] ?? '').repeat(toNumber(rawArgs[1] ?? 1));
  if (name === 'chr') return String.fromCharCode(toNumber(rawArgs[0]));
  if (name === 'asc') return String(rawArgs[0] ?? '').charCodeAt(0) || 0;
  if (name === 'numtok') {
    const delim = tokenDelimiter(rawArgs[1]);
    return tokenizeByDelimiter(rawArgs[0], delim).length;
  }
  if (name === 'gettok') {
    const idx = Math.floor(toNumber(rawArgs[1]));
    if (idx <= 0) return '';
    const delim = tokenDelimiter(rawArgs[2]);
    const tokens = tokenizeByDelimiter(rawArgs[0], delim);
    return tokens[idx - 1] ?? '';
  }
  if (name === 'rgb') return `rgb(${rawArgs.map((x) => toNumber(x)).join(',')})`;
  if (name === 'window') return ctx.windowManager.info(rawArgs[0]);
  if (name === 'mouse') return ctx.mouse?.[rawArgs[0]] ?? 0;
  if (name === 'did') return ctx.dialogs.didText(rawArgs[0], rawArgs[1]);
  if (name === 'regex') {
    const text = String(rawArgs[0] ?? '');
    const re = parseRegexArg(rawArgs[1]);
    if (!re) {
      ctx.lastRegex = { matches: [], captures: [] };
      return 0;
    }
    if (re.global) {
      const matches = [...text.matchAll(re)];
      const first = matches[0] || null;
      ctx.lastRegex = {
        matches: matches.map((m) => m[0]),
        captures: first ? [...first] : [],
      };
      return matches.length;
    }
    const single = text.match(re);
    ctx.lastRegex = {
      matches: single ? [single[0]] : [],
      captures: single ? [...single] : [],
    };
    return single ? 1 : 0;
  }
  if (name === 'regml') {
    const idx = toNumber(rawArgs[0]);
    return ctx.lastRegex?.captures?.[idx] ?? '';
  }
  if (name === 'rand') {
    const min = Math.floor(toNumber(rawArgs[0]));
    const max = Math.floor(toNumber(rawArgs[1]));
    if (max < min) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  if (name === 'timer' && rawArgs[0] === 0) return ctx.timers.count();
  if (name === 'hget') return ctx.hash.hget(rawArgs[0], rawArgs[1]);
  if (name === 'readini') return ctx.ini.read(rawArgs[0], rawArgs[1], rawArgs[2]);
  if (name === 'fread') return ctx.files.fread(rawArgs[0]);
  if (name === 'isfile') return ctx.files.isfile(rawArgs[0]) ? 1 : 0;
  if (name === 'sock') return ctx.sockets.sock(rawArgs[0]) ?? {};

  return '';
}

function evalCondition(expr, ctx, args) {
  const evalCtx = {
    vars: ctx.vars,
    args,
    resolveIdentifier: (name, identifierArgs) => {
      if (name.startsWith('$')) {
        return evalIdentifier(name, ctx, args);
      }
      return '';
    },
  };

  const tokens = tokenizeCommand(expr);
  const resolved = tokens.map((t) => {
    if (t === '||' || t === '&&' || t === '>' || t === '<' || t === '>=' || t === '<=' || t === '==' || t === '=' || t === '!=' || t === '<>') {
      return t;
    }
    return resolveToken(t, ctx, args);
  });

  const condition = resolved.join(' ');
  return safeEvalCondition(condition, evalCtx);
}

export class NixrcInterpreter {
  constructor(ctx) {
    this.ctx = ctx;
    this.aliases = new Map();
    this.dialogs = new Map();
  }

  load(source) {
    const ast = parseMirc(source);

    for (const node of ast.body) {
      if (node.type === 'AliasDeclaration') {
        this.aliases.set(node.name.toLowerCase(), node);
      }
      if (node.type === 'DialogDeclaration') {
        const spec = this.parseDialogSpec(node);
        this.dialogs.set(node.name.toLowerCase(), spec);
      }
      if (node.type === 'EventHandler') {
        const filter = { match: node.match || '*', target: node.target || '*' };
        if (node.extra) {
          const extraParts = node.extra.split(':').filter(Boolean);
          if (extraParts[0]) filter.id = Number(extraParts[0]) || extraParts[0];
        }
        this.ctx.eventBus.on(node.event, filter, (payload) => {
          const prevEvent = this.ctx.event;
          this.ctx.event = payload || {};
          if (payload && typeof payload === 'object') {
            if (payload.x != null) this.ctx.mouse.x = toNumber(payload.x);
            if (payload.y != null) this.ctx.mouse.y = toNumber(payload.y);
            if (payload.key != null) this.ctx.mouse.key = toNumber(payload.key);
          }
          this.runStatements(node.body, payload, []);
          this.ctx.event = prevEvent;
        });
      }
    }

    return ast;
  }

  parseDialogSpec(node) {
    const spec = { title: '', controls: [] };
    for (const ctrl of node.controls || []) {
      const cleanArgs = ctrl.args.map((a) => String(a).replace(/,$/, ''));
      
      if (ctrl.name === 'title' && cleanArgs[0]) {
        spec.title = cleanArgs[0].replace(/^"|"$/g, '');
      } else if (ctrl.name === 'text') {
        const [text, id, x, y, w, h] = cleanArgs;
        spec.controls.push({
          type: 'text',
          text: text.replace(/^"|"$/g, ''),
          id: Number(id),
          x: Number(x),
          y: Number(y),
          w: Number(w),
          h: Number(h),
        });
      } else if (ctrl.name === 'button') {
        const [text, id, x, y, w, h] = cleanArgs;
        spec.controls.push({
          type: 'button',
          text: text.replace(/^"|"$/g, ''),
          id: Number(id),
          x: Number(x),
          y: Number(y),
          w: Number(w),
          h: Number(h),
        });
      } else if (ctrl.name === 'edit') {
        const [text, id, x, y, w, h, ...flags] = cleanArgs;
        spec.controls.push({
          type: 'edit',
          text: text.replace(/^"|"$/g, ''),
          id: Number(id),
          x: Number(x),
          y: Number(y),
          w: Number(w),
          h: Number(h),
          flags,
        });
      }
    }
    return spec;
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
      let valueArgs = resolved.slice(1);
      if (valueArgs[0] === '=') {
        valueArgs = valueArgs.slice(1);
      }
      this.ctx.vars.set(key, valueArgs.join(' '));
      return;
    }

    if (n.startsWith('%') && args[0] === '=') {
      this.ctx.vars.set(name, resolved.slice(1).join(' '));
      return;
    }

    if (n === 'echo') {
      const text = resolved.map((x) => String(x)).join(' ');
      this.ctx.log('echo', text);
      return;
    }

    if (n === 'inc') {
      const key = args[0];
      const current = toNumber(this.ctx.vars.get(key));
      const amount = resolved[1] ? toNumber(resolved[1]) : 1;
      this.ctx.vars.set(key, current + amount);
      return;
    }

    if (n === 'dec') {
      const key = args[0];
      const current = toNumber(this.ctx.vars.get(key));
      const amount = resolved[1] ? toNumber(resolved[1]) : 1;
      this.ctx.vars.set(key, current - amount);
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

    if (n === 'drawfill') {
      const win = this.ctx.windowManager.get(resolved[1]);
      win?.drawFill(resolved[2], resolved[3], resolved[4], resolved[5]);
      return;
    }

    if (n === 'loadpic') {
      const src = String(resolved[0] ?? '').trim();
      if (!src) return;
      this.ctx.windowManager.loadImage?.(src);
      return;
    }

    if (n === 'drawpic') {
      let idx = 0;
      const flags = { c: false, m: false, s: false };
      const flagToken = String(resolved[idx] ?? '');
      if (flagToken.startsWith('-')) {
        flags.c = flagToken.includes('c');
        flags.m = flagToken.includes('m');
        flags.s = flagToken.includes('s');
        idx += 1;
      }

      const win = this.ctx.windowManager.get(resolved[idx++]);
      if (!win || typeof win.drawPic !== 'function') return;
      const x = toNumber(resolved[idx++]);
      const y = toNumber(resolved[idx++]);
      const rest = resolved.slice(idx);
      if (rest.length === 0) return;

      let w;
      let h;
      let sx;
      let sy;
      let sw;
      let sh;
      let src;

      if (rest.length >= 7) {
        w = toNumber(rest[0]);
        h = toNumber(rest[1]);
        sx = toNumber(rest[2]);
        sy = toNumber(rest[3]);
        sw = toNumber(rest[4]);
        sh = toNumber(rest[5]);
        src = String(rest.slice(6).join(' '));
      } else if (rest.length >= 3) {
        w = toNumber(rest[0]);
        h = toNumber(rest[1]);
        src = String(rest.slice(2).join(' '));
      } else {
        src = String(rest.join(' '));
      }

      src = stripQuotes(src).trim();
      if (!src) return;
      win.drawPic({ x, y, w, h, sx, sy, sw, sh, src, flags });
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
      else {
        const spec = this.dialogs.get(String(name).toLowerCase());
        this.ctx.dialogs.defineDialog(name, spec);
        this.ctx.dialogs.open(name, mode.includes('m'));
      }
      return;
    }

    if (n === 'did') {
      const flag = String(resolved[0] || '');
      const dlg = resolved[1];
      const id = resolved[2];
      const text = resolved.slice(3).join(' ');
      if (flag.includes('ra')) this.ctx.dialogs.didReplaceAll(dlg, id, text);
      else if (flag.includes('a')) this.ctx.dialogs.didAppend(dlg, id, text);
      else if (flag.includes('r')) this.ctx.dialogs.didReset(dlg, id);
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

    this.ctx.errorHandler?.handle(
      new CommandError(`Unsupported command: ${name}`, name, args)
    );
  }
}
