import { splitArgs } from './token-utils.js';

function isQuoted(value) {
  return value.startsWith('"') && value.endsWith('"');
}

function sanitizeVar(token) {
  return `_${token.slice(1).replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function parseIdentifierCall(token, ctx) {
  const match = token.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
  if (!match) return null;

  const name = match[1];
  const argsRaw = match[2].trim();
  const args = argsRaw ? splitArgs(argsRaw).map((arg) => lowerExpression(arg.trim(), ctx)) : [];

  if (name === 'iif' && args.length >= 3) {
    return {
      name,
      code: `(${args[0]} ? ${args[1]} : ${args[2]})`,
    };
  }

  if (name === 'calc' && args.length >= 1) {
    ctx.imports.add('calc');
    return {
      name,
      code: `calc(${args[0]})`,
    };
  }

  ctx.imports.add(name);
  return {
    name,
    code: `${name}(${args.join(', ')})`,
  };
}

function lowerToken(token, ctx) {
  if (/^%[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
    return sanitizeVar(token);
  }

  if (/^\$[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
    const runtimeName = token.slice(1);
    ctx.imports.add(runtimeName);
    return runtimeName;
  }

  if (/^\$\d+$/.test(token)) {
    const idx = Number(token.slice(1)) - 1;
    return `args[${idx}]`;
  }

  const call = parseIdentifierCall(token, ctx);
  if (call) return call.code;

  if (/^-?\d+(\.\d+)?$/.test(token)) return token;
  if (isQuoted(token)) return JSON.stringify(token.slice(1, -1));

  return JSON.stringify(token);
}

function lowerExpression(expr, ctx) {
  if (!expr || !expr.trim()) return '""';
  const trimmed = expr.trim();
  const call = parseIdentifierCall(trimmed, ctx);
  if (call) return call.code;

  return trimmed
    .replace(/%([a-zA-Z_][a-zA-Z0-9_]*)/g, '_$1')
    .replace(/\$(\d+)/g, (_m, n) => `args[${Number(n) - 1}]`)
    .replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, name) => {
      ctx.imports.add(name);
      return name;
    })
    .replace(/\s=\s/g, ' === ')
    .replace(/\s<>\s/g, ' !== ')
    .replace(/\s!=\s/g, ' !== ')
    .replace(/\s&&\s/g, ' && ')
    .replace(/\s\|\|\s/g, ' || ');
}

function joinTextTokens(tokens, ctx) {
  if (!tokens.length) return '""';

  const groups = [];
  let current = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '$+') continue;

    current.push(lowerToken(token, ctx));
    const next = tokens[i + 1];
    if (next !== '$+') {
      groups.push(current.join(' + '));
      current = [];
    }
  }

  return groups.join(' + " " + ');
}

function mapRuntimeName(name) {
  const jsKeywords = new Set([
    'if', 'else', 'while', 'for', 'switch', 'case', 'default', 'return', 'break', 'continue',
    'function', 'class', 'var', 'let', 'const', 'new', 'delete', 'try', 'catch', 'finally',
    'throw', 'do', 'import', 'export', 'in', 'instanceof', 'typeof', 'void', 'with', 'yield',
    'await', 'alias', 'on',
  ]);

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return null;
  if (jsKeywords.has(name)) return null;

  const table = {
    drawrect: 'drawRect',
    drawline: 'drawLine',
    drawtext: 'drawText',
    window: 'openWindow',
    cls: 'clearWindow',
  };

  return table[name] || name;
}

function emitCommand(node, ctx) {
  const name = node.name;
  const args = node.args;

  if (/^%[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && args[0] === '=') {
    return `let ${sanitizeVar(name)} = ${lowerExpression(args.slice(1).join(' '), ctx)};`;
  }

  if (name === 'set' || name === 'var') {
    const [target, ...valueTokens] = args;
    if (!target || !target.startsWith('%')) return `// unsupported: ${node.raw}`;
    return `let ${sanitizeVar(target)} = ${joinTextTokens(valueTokens, ctx)};`;
  }

  if (name === 'echo') {
    ctx.imports.add('echo');
    let flags = '""';
    let textTokens = args;
    if (args[0] && args[0].startsWith('-')) {
      flags = JSON.stringify(args[0]);
      textTokens = args.slice(1);
    }
    return `echo({ flags: ${flags}, text: ${joinTextTokens(textTokens, ctx)} });`;
  }

  if (name === 'msg') {
    ctx.imports.add('msg');
    const [target, ...text] = args;
    return `msg(${lowerToken(target || '""', ctx)}, ${joinTextTokens(text, ctx)});`;
  }

  if (name === 'timer') {
    ctx.imports.add('timer');
    return `timer(${args.map((a) => lowerToken(a, ctx)).join(', ')});`;
  }

  if (name === 'return') {
    return `return ${joinTextTokens(args, ctx)};`;
  }

  if (name === 'if' || name === 'while' || name === 'else') {
    return `// unsupported inline control flow: ${node.raw}`;
  }

  const runtimeName = mapRuntimeName(name);
  if (!runtimeName) return `// unsupported command: ${node.raw}`;

  ctx.imports.add(runtimeName);
  return `${runtimeName}(${args.map((a) => lowerToken(a, ctx)).join(', ')});`;
}

function emitIfStatement(node, ctx, indent) {
  const body = emitStatements(node.body, ctx, `${indent}  `);
  let code = `${indent}if (${lowerExpression(node.condition, ctx)}) {\n${body}\n${indent}}`;

  if (node.alternate) {
    if (node.alternate.type === 'ElseStatement') {
      const elseBody = emitStatements(node.alternate.body, ctx, `${indent}  `);
      code += ` else {\n${elseBody}\n${indent}}`;
    } else if (node.alternate.type === 'ElseifStatement') {
      const elseifNode = node.alternate;
      const elseifBody = emitStatements(elseifNode.body, ctx, `${indent}  `);
      code += ` else if (${lowerExpression(elseifNode.condition, ctx)}) {\n${elseifBody}\n${indent}}`;

      let current = elseifNode.alternate;
      while (current) {
        if (current.type === 'ElseStatement') {
          const elseBody = emitStatements(current.body, ctx, `${indent}  `);
          code += ` else {\n${elseBody}\n${indent}}`;
          break;
        } else if (current.type === 'ElseifStatement') {
          const body = emitStatements(current.body, ctx, `${indent}  `);
          code += ` else if (${lowerExpression(current.condition, ctx)}) {\n${body}\n${indent}}`;
          current = current.alternate;
        } else {
          break;
        }
      }
    }
  }

  return code;
}

function emitStatements(statements, ctx, indent = '  ') {
  return statements
    .map((node) => {
      if (!node) return '';

      if (node.type === 'CommandStatement') {
        return `${indent}${emitCommand(node, ctx)}`;
      }

      if (node.type === 'SequenceStatement') {
        return emitStatements(node.body, ctx, indent);
      }

      if (node.type === 'IfStatement') {
        return emitIfStatement(node, ctx, indent);
      }

      if (node.type === 'WhileStatement') {
        const body = emitStatements(node.body, ctx, `${indent}  `);
        return `${indent}while (${lowerExpression(node.condition, ctx)}) {\n${body}\n${indent}}`;
      }

      return `${indent}// unsupported node: ${node.type}`;
    })
    .filter(Boolean)
    .join('\n');
}

function emitAlias(node, ctx) {
  ctx.aliases.push(node.name);
  const body = emitStatements(node.body, ctx, '  ');
  return `export function ${node.name}(...args) {\n${body}\n}`;
}

function emitEvent(node, ctx) {
  ctx.imports.add('on');
  const filters = [];
  if (node.match) filters.push(`match: ${JSON.stringify(node.match)}`);
  if (node.target) filters.push(`target: ${JSON.stringify(node.target)}`);
  if (node.level) filters.push(`level: ${JSON.stringify(node.level)}`);
  const filterCode = filters.length ? `{ ${filters.join(', ')} }` : '{}';
  const body = emitStatements(node.body, ctx, '  ');
  return `on(${JSON.stringify(node.event)}, ${filterCode}, (ctx) => {\n${body}\n});`;
}

function buildSimpleSourceMap(fileName, sourceName, code) {
  const lineCount = code.split('\n').length;
  return {
    version: 3,
    file: fileName,
    sources: [sourceName],
    names: [],
    mappings: ';'.repeat(Math.max(0, lineCount - 1)),
  };
}

export function generate(program, opts = {}) {
  const ctx = { imports: new Set(), aliases: [] };
  const chunks = [];

  for (const node of program.body) {
    if (node.type === 'AliasDeclaration') {
      chunks.push(emitAlias(node, ctx));
      continue;
    }

    if (node.type === 'EventHandler') {
      chunks.push(emitEvent(node, ctx));
      continue;
    }

    if (node.type === 'CommandStatement' || node.type === 'SequenceStatement') {
      chunks.push(emitStatements([node], ctx, ''));
      continue;
    }

    if (node.type === 'IfStatement' || node.type === 'WhileStatement') {
      chunks.push(emitStatements([node], ctx, ''));
      continue;
    }
  }

  const importList = [...ctx.imports].sort();
  const importLine = importList.length
    ? `import { ${importList.join(', ')} } from \"mirx/runtime\";\n\n`
    : '';

  const banner = opts.banner ? `// ${opts.banner}\n` : '';
  const body = chunks.filter(Boolean).join('\n\n');
  const code = `${banner}${importLine}${body}\n`;

  const sourceName = opts.sourceName || 'input.mrc';
  const fileName = opts.fileName || 'output.ts';
  const map = buildSimpleSourceMap(fileName, sourceName, code);

  return {
    code,
    map,
    exports: ctx.aliases,
  };
}
