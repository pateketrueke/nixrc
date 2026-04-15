const TOKEN_TYPES = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  VARIABLE: 'VARIABLE',
  IDENTIFIER: 'IDENTIFIER',
  OPERATOR: 'OPERATOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA',
  EOF: 'EOF',
};

const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '^',
  '=', '<>', '<', '>', '<=', '>=',
  '&&', '||', '!',
]);

const PRECEDENCE = {
  '||': 1,
  '&&': 2,
  '=': 3, '<>': 3, '<': 3, '>': 3, '<=': 3, '>=': 3,
  '+': 4, '-': 4,
  '*': 5, '/': 5, '%': 5,
  '^': 6,
  '!': 7,
};

const RIGHT_ASSOC = new Set(['^', '!']);

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isAlnum(ch) {
  return isDigit(ch) || isAlpha(ch);
}

function tokenize(source) {
  const tokens = [];
  let i = 0;
  const len = source.length;

  while (i < len) {
    const ch = source[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: TOKEN_TYPES.LPAREN, value: '(', pos: i });
      i += 1;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: TOKEN_TYPES.RPAREN, value: ')', pos: i });
      i += 1;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: TOKEN_TYPES.COMMA, value: ',', pos: i });
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i += 1;
      let value = '';
      while (i < len && source[i] !== quote) {
        if (source[i] === '\\' && i + 1 < len) {
          i += 1;
          const escaped = source[i];
          if (escaped === 'n') value += '\n';
          else if (escaped === 't') value += '\t';
          else if (escaped === 'r') value += '\r';
          else value += escaped;
        } else {
          value += source[i];
        }
        i += 1;
      }
      if (i < len) i += 1;
      tokens.push({ type: TOKEN_TYPES.STRING, value, pos: start });
      continue;
    }

    if (ch === '%' && i + 1 < len && isAlpha(source[i + 1])) {
      const start = i;
      i += 1;
      let name = '';
      while (i < len && isAlnum(source[i])) {
        name += source[i];
        i += 1;
      }
      tokens.push({ type: TOKEN_TYPES.VARIABLE, value: `%${name}`, pos: start });
      continue;
    }

    if (ch === '$') {
      const start = i;
      i += 1;
      
      if (i < len && isDigit(source[i])) {
        let num = '';
        while (i < len && isDigit(source[i])) {
          num += source[i];
          i += 1;
        }
        tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value: `$${num}`, pos: start });
        continue;
      }

      if (i < len && isAlpha(source[i])) {
        let name = '';
        while (i < len && isAlnum(source[i])) {
          name += source[i];
          i += 1;
        }
        if (i < len && source[i] === '(') {
          tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value: `$${name}`, pos: start });
        } else {
          tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value: `$${name}`, pos: start });
        }
        continue;
      }

      tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value: '$', pos: start });
      continue;
    }

    if (isDigit(ch) || (ch === '-' && i + 1 < len && isDigit(source[i + 1]))) {
      const start = i;
      let num = '';
      if (ch === '-') {
        num = '-';
        i += 1;
      }
      while (i < len && isDigit(source[i])) {
        num += source[i];
        i += 1;
      }
      if (i < len && source[i] === '.') {
        num += '.';
        i += 1;
        while (i < len && isDigit(source[i])) {
          num += source[i];
          i += 1;
        }
      }
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: num, pos: start });
      continue;
    }

    const twoChar = source.slice(i, i + 2);
    if (OPERATORS.has(twoChar)) {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: twoChar, pos: i });
      i += 2;
      continue;
    }

    if (OPERATORS.has(ch)) {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: ch, pos: i });
      i += 1;
      continue;
    }

    if (isAlpha(ch)) {
      const start = i;
      let word = '';
      while (i < len && isAlnum(source[i])) {
        word += source[i];
        i += 1;
      }
      tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value: word, pos: start });
      continue;
    }

    tokens.push({ type: TOKEN_TYPES.OPERATOR, value: ch, pos: i });
    i += 1;
  }

  tokens.push({ type: TOKEN_TYPES.EOF, value: '', pos: i });
  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  current() {
    return this.tokens[this.pos] || { type: TOKEN_TYPES.EOF, value: '' };
  }

  peek(offset = 1) {
    return this.tokens[this.pos + offset] || { type: TOKEN_TYPES.EOF, value: '' };
  }

  advance() {
    const token = this.current();
    this.pos += 1;
    return token;
  }

  expect(type, value = null) {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at position ${token.pos}`);
    }
    if (value !== null && token.value !== value) {
      throw new Error(`Expected ${value} but got ${token.value} at position ${token.pos}`);
    }
    return this.advance();
  }

  parse() {
    return this.parseExpression(0);
  }

  parseExpression(minPrec) {
    let left = this.parsePrimary();

    while (true) {
      const token = this.current();
      
      if (token.type !== TOKEN_TYPES.OPERATOR) break;
      
      const prec = PRECEDENCE[token.value];
      if (prec === undefined) break;
      if (prec < minPrec) break;

      const op = this.advance().value;
      const nextMinPrec = RIGHT_ASSOC.has(op) ? prec : prec + 1;
      const right = this.parseExpression(nextMinPrec);

      left = {
        type: 'BinaryOp',
        op,
        left,
        right,
      };
    }

    return left;
  }

  parsePrimary() {
    const token = this.current();

    if (token.type === TOKEN_TYPES.NUMBER) {
      this.advance();
      const num = Number(token.value);
      return { type: 'Literal', value: num };
    }

    if (token.type === TOKEN_TYPES.STRING) {
      this.advance();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === TOKEN_TYPES.VARIABLE) {
      this.advance();
      return { type: 'Variable', name: token.value };
    }

    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      this.advance();
      
      if (this.current().type === TOKEN_TYPES.LPAREN) {
        this.advance();
        const args = this.parseArgs();
        this.expect(TOKEN_TYPES.RPAREN);
        return { type: 'Call', name: token.value, args };
      }

      return { type: 'Identifier', name: token.value };
    }

    if (token.type === TOKEN_TYPES.OPERATOR && token.value === '!') {
      this.advance();
      const operand = this.parsePrimary();
      return { type: 'UnaryOp', op: '!', operand };
    }

    if (token.type === TOKEN_TYPES.OPERATOR && token.value === '-') {
      this.advance();
      const operand = this.parsePrimary();
      return { type: 'UnaryOp', op: '-', operand };
    }

    if (token.type === TOKEN_TYPES.LPAREN) {
      this.advance();
      const expr = this.parseExpression(0);
      this.expect(TOKEN_TYPES.RPAREN);
      return expr;
    }

    throw new Error(`Unexpected token: ${token.type} (${token.value}) at position ${token.pos}`);
  }

  parseArgs() {
    const args = [];

    if (this.current().type === TOKEN_TYPES.RPAREN) {
      return args;
    }

    args.push(this.parseExpression(0));

    while (this.current().type === TOKEN_TYPES.COMMA) {
      this.advance();
      args.push(this.parseExpression(0));
    }

    return args;
  }
}

export function parseExpression(source) {
  if (!source || typeof source !== 'string') {
    return { type: 'Literal', value: '' };
  }

  const trimmed = source.trim();
  if (!trimmed) {
    return { type: 'Literal', value: '' };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    return parser.parse();
  } catch (e) {
    return { type: 'Literal', value: '' };
  }
}

export { tokenize, TOKEN_TYPES, PRECEDENCE };
