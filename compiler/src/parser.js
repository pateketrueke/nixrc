import { tokenizeCommand, splitByPipe } from './token-utils.js';

function stripComment(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith(';')) return '';
  return line;
}

function parseCommand(line) {
  const tokens = tokenizeCommand(line);
  if (!tokens.length) return null;
  return {
    type: 'CommandStatement',
    name: tokens[0].toLowerCase(),
    args: tokens.slice(1),
    raw: line,
  };
}

function parseBlock(lines, startIdx) {
  const body = [];
  let i = startIdx;

  while (i < lines.length) {
    const raw = stripComment(lines[i]).trim();
    i += 1;

    if (!raw) continue;
    if (raw === '}') break;

    const statement = parseStatement(raw, lines, i - 1);
    if (statement.node) {
      body.push(statement.node);
      i = statement.nextIndex;
    }
  }

  return { body, nextIndex: i };
}

function parseOnHeader(line) {
  if (!/^on\s+/i.test(line) || !line.endsWith('{')) return null;
  const payload = line.replace(/^on\s+/i, '').slice(0, -1).trim();
  const rawParts = payload.split(':');
  while (rawParts.length && rawParts[rawParts.length - 1] === '') rawParts.pop();
  if (rawParts.length < 2) return null;

  const [level, event, match = '', target = '', ...rest] = rawParts;
  return {
    level,
    event: event.toUpperCase(),
    match,
    target,
    extra: rest.join(':'),
  };
}

function parseStatement(raw, lines, index) {
  if (raw === '}') {
    return { node: null, nextIndex: index + 1 };
  }

  const ifMatch = raw.match(/^if\s*\((.+)\)\s*\{$/i);
  if (ifMatch) {
    const block = parseBlock(lines, index + 1);
    return {
      node: {
        type: 'IfStatement',
        condition: ifMatch[1],
        body: block.body,
      },
      nextIndex: block.nextIndex,
    };
  }

  const whileMatch = raw.match(/^while\s*\((.+)\)\s*\{$/i);
  if (whileMatch) {
    const block = parseBlock(lines, index + 1);
    return {
      node: {
        type: 'WhileStatement',
        condition: whileMatch[1],
        body: block.body,
      },
      nextIndex: block.nextIndex,
    };
  }

  const aliasMatch = raw.match(/^alias\s+([^\s{]+)\s*\{$/i);
  if (aliasMatch) {
    const block = parseBlock(lines, index + 1);
    return {
      node: {
        type: 'AliasDeclaration',
        name: aliasMatch[1],
        body: block.body,
      },
      nextIndex: block.nextIndex,
    };
  }

  const onHeader = parseOnHeader(raw);
  if (onHeader) {
    const block = parseBlock(lines, index + 1);
    return {
      node: {
        type: 'EventHandler',
        event: onHeader.event,
        level: onHeader.level,
        match: onHeader.match,
        target: onHeader.target,
        extra: onHeader.extra,
        body: block.body,
      },
      nextIndex: block.nextIndex,
    };
  }

  const inlineOn = raw.match(/^on\s+(.+):\{\s*(.+?)\s*\}$/i);
  if (inlineOn) {
    const payloadParts = inlineOn[1].split(':').filter((part) => part !== '');
    const [level = '*', event = '', match = '', target = '', ...rest] = payloadParts;
    return {
      node: {
        type: 'EventHandler',
        event: event.toUpperCase(),
        level,
        match,
        target,
        extra: rest.join(':'),
        body: splitByPipe(inlineOn[2]).map(parseCommand).filter(Boolean),
      },
      nextIndex: index + 1,
    };
  }

  const piped = splitByPipe(raw);
  if (piped.length > 1) {
    return {
      node: {
        type: 'SequenceStatement',
        body: piped.map(parseCommand).filter(Boolean),
      },
      nextIndex: index + 1,
    };
  }

  return {
    node: parseCommand(raw),
    nextIndex: index + 1,
  };
}

export function parseMirc(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const body = [];
  let i = 0;

  while (i < lines.length) {
    const raw = stripComment(lines[i]).trim();
    if (!raw) {
      i += 1;
      continue;
    }
    if (raw === '}') {
      i += 1;
      continue;
    }

    const statement = parseStatement(raw, lines, i);
    if (statement.node) body.push(statement.node);
    i = statement.nextIndex;
  }

  return {
    type: 'Program',
    body,
  };
}

export { tokenizeCommand, splitByPipe };
