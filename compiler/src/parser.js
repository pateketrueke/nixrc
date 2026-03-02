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

      if (statement.node.type === 'IfStatement') {
        i = parseAndAttachElseChain(statement.node, lines, i);
      }
    }
  }

  return { body, nextIndex: i };
}

function parseAndAttachElseChain(ifNode, lines, startIdx) {
  let currentIdx = startIdx;
  let current = ifNode;

  while (currentIdx < lines.length) {
    const raw = stripComment(lines[currentIdx]).trim();
    
    const elseifMatch = raw.match(/^elseif\s*\((.+?)\)\s*\{/i);
    if (elseifMatch) {
      const fullMatch = elseifMatch[0];
      const remaining = raw.slice(fullMatch.length).trim();
      
      let elseifNode;
      if (remaining.endsWith('}')) {
        const bodyRaw = remaining.slice(0, -1).trim();
        elseifNode = {
          type: 'ElseifStatement',
          condition: elseifMatch[1],
          body: splitByPipe(bodyRaw).map(parseCommand).filter(Boolean),
        };
        currentIdx += 1;
      } else if (remaining === '') {
        const block = parseBlock(lines, currentIdx + 1);
        elseifNode = {
          type: 'ElseifStatement',
          condition: elseifMatch[1],
          body: block.body,
        };
        currentIdx = block.nextIndex;
      } else {
        break;
      }
      
      current.alternate = elseifNode;
      current = elseifNode;
      continue;
    }
    
    const elseMatch = raw.match(/^else\s*\{/i);
    if (elseMatch) {
      const fullMatch = elseMatch[0];
      const remaining = raw.slice(fullMatch.length).trim();
      
      let elseNode;
      if (remaining.endsWith('}')) {
        const bodyRaw = remaining.slice(0, -1).trim();
        elseNode = {
          type: 'ElseStatement',
          body: splitByPipe(bodyRaw).map(parseCommand).filter(Boolean),
        };
        currentIdx += 1;
      } else if (remaining === '') {
        const block = parseBlock(lines, currentIdx + 1);
        elseNode = {
          type: 'ElseStatement',
          body: block.body,
        };
        currentIdx = block.nextIndex;
      } else {
        break;
      }
      
      current.alternate = elseNode;
      break;
    }
    
    break;
  }
  
  return currentIdx;
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

function findMatchingBrace(str, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < str.length; i += 1) {
    if (str[i] === '{') depth += 1;
    else if (str[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingParen(str, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < str.length; i += 1) {
    if (str[i] === '(') depth += 1;
    else if (str[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseLeadingCondition(raw, keyword) {
  const k = String(keyword || '').toLowerCase();
  const source = raw.trimStart();
  if (!source.toLowerCase().startsWith(k)) return null;
  const afterKeyword = source.slice(k.length).trimStart();
  if (!afterKeyword.startsWith('(')) return null;
  const closeIdx = findMatchingParen(afterKeyword, 0);
  if (closeIdx === -1) return null;
  return {
    condition: afterKeyword.slice(1, closeIdx),
    rest: afterKeyword.slice(closeIdx + 1),
  };
}

function parseInlineIfElse(restOfLine, condition) {
  const trimmed = restOfLine.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith('{')) {
    return null;
  }

  const closeIdx = findMatchingBrace(trimmed, 0);
  if (closeIdx === -1) return null;

  const bodyRaw = trimmed.slice(1, closeIdx).trim();
  const afterBody = trimmed.slice(closeIdx + 1).trim();
  const body = splitByPipe(bodyRaw).map(parseCommand).filter(Boolean);

  const node = {
    type: 'IfStatement',
    condition,
    body,
  };

  if (afterBody.startsWith('else') && (afterBody.length === 4 || afterBody[4] === ' ' || afterBody[4] === '{')) {
    const elseContent = afterBody.replace(/^else\s*/, '').trim();
    if (elseContent.startsWith('{')) {
      const elseCloseIdx = findMatchingBrace(elseContent, 0);
      if (elseCloseIdx !== -1) {
        const elseBodyRaw = elseContent.slice(1, elseCloseIdx).trim();
        node.alternate = {
          type: 'ElseStatement',
          body: splitByPipe(elseBodyRaw).map(parseCommand).filter(Boolean),
        };
      }
    }
  } else if (afterBody.startsWith('elseif')) {
    const elseifLead = parseLeadingCondition(afterBody, 'elseif');
    if (elseifLead) {
      const elseifRest = elseifLead.rest;
      const elseifResult = parseInlineIfElse(elseifRest, elseifLead.condition);
      if (elseifResult) {
        node.alternate = {
          type: 'ElseifStatement',
          condition: elseifLead.condition,
          body: elseifResult.node.body,
          alternate: elseifResult.node.alternate,
        };
      }
    }
  }

  return { node };
}

function parseStatement(raw, lines, index) {
  if (raw === '}') {
    return { node: null, nextIndex: index + 1 };
  }

  const ifLead = parseLeadingCondition(raw, 'if');
  if (ifLead) {
    const condition = ifLead.condition;
    const afterCond = ifLead.rest;
    const afterCondTrimmed = afterCond.trim();

    if (afterCondTrimmed.startsWith('{')) {
      const inlineResult = parseInlineIfElse(afterCond, condition);
      if (inlineResult) {
        return {
          node: inlineResult.node,
          nextIndex: index + 1,
        };
      }

      if (afterCondTrimmed === '{') {
        const block = parseBlock(lines, index + 1);
        return {
          node: {
            type: 'IfStatement',
            condition,
            body: block.body,
          },
          nextIndex: block.nextIndex,
        };
      }
    } else if (afterCondTrimmed) {
      const body = splitByPipe(afterCondTrimmed).map(parseCommand).filter(Boolean);
      return {
        node: {
          type: 'IfStatement',
          condition,
          body,
        },
        nextIndex: index + 1,
      };
    }
  }

  const whileLead = parseLeadingCondition(raw, 'while');
  if (whileLead) {
    const restOfLine = whileLead.rest;
    const trimmed = restOfLine.trim();

    if (trimmed === '{') {
      const block = parseBlock(lines, index + 1);
      return {
        node: {
          type: 'WhileStatement',
          condition: whileLead.condition,
          body: block.body,
        },
        nextIndex: block.nextIndex,
      };
    }

    if (trimmed.startsWith('{')) {
      const closeIdx = findMatchingBrace(trimmed, 0);
      if (closeIdx !== -1) {
        const bodyRaw = trimmed.slice(1, closeIdx).trim();
        const body = splitByPipe(bodyRaw).map(parseCommand).filter(Boolean);
        return {
          node: {
            type: 'WhileStatement',
            condition: whileLead.condition,
            body,
          },
          nextIndex: index + 1,
        };
      }
    }

    if (trimmed === '') {
      const block = parseBlock(lines, index + 1);
      return {
        node: {
          type: 'WhileStatement',
          condition: whileLead.condition,
          body: block.body,
        },
        nextIndex: block.nextIndex,
      };
    }
  }

  const aliasMatch = raw.match(/^alias\s+([^\s{]+)\s*\{/i);
  if (aliasMatch) {
    const name = aliasMatch[1];
    const afterAlias = raw.slice(aliasMatch[0].length).trim();
    
    if (afterAlias.endsWith('}')) {
      const bodyRaw = afterAlias.slice(0, -1).trim();
      const body = splitByPipe(bodyRaw).map(parseCommand).filter(Boolean);
      return {
        node: {
          type: 'AliasDeclaration',
          name,
          body,
        },
        nextIndex: index + 1,
      };
    }
    
    if (afterAlias === '') {
      const block = parseBlock(lines, index + 1);
      return {
        node: {
          type: 'AliasDeclaration',
          name,
          body: block.body,
        },
        nextIndex: block.nextIndex,
      };
    }
  }

  const dialogMatch = raw.match(/^dialog\s+([^\s{]+)\s*\{/i);
  if (dialogMatch) {
    const name = dialogMatch[1];
    const block = parseBlock(lines, index + 1);
    return {
      node: {
        type: 'DialogDeclaration',
        name,
        controls: block.body.filter((n) => n && n.type === 'CommandStatement'),
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
  const lines = source
    .replace(/\r\n/g, '\n')
    .replace(/\}\s*(else(?:if)?)\b/gi, '}\n$1')
    .split('\n');
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
    if (statement.node) {
      body.push(statement.node);
      i = statement.nextIndex;

      if (statement.node.type === 'IfStatement') {
        i = parseAndAttachElseChain(statement.node, lines, i);
      }
    } else {
      i += 1;
    }
  }

  return {
    type: 'Program',
    body,
  };
}

export { tokenizeCommand, splitByPipe };
