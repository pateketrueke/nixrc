import { parseExpression } from '../../compiler/src/expression-parser.js';

function toNumber(v) {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toBoolean(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0 && v !== '0' && v.toLowerCase() !== 'false';
  return Boolean(v);
}

function applyBinaryOp(op, left, right) {
  const l = toNumber(left);
  const r = toNumber(right);

  switch (op) {
    case '+': {
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left) + String(right);
      }
      return l + r;
    }
    case '-': return l - r;
    case '*': return l * r;
    case '/': return r !== 0 ? l / r : 0;
    case '%': return r !== 0 ? l % r : 0;
    case '^': return Math.pow(l, r);
    case '=': return left === right;
    case '<>': return left !== right;
    case '<': return l < r;
    case '>': return l > r;
    case '<=': return l <= r;
    case '>=': return l >= r;
    case '&&': return toBoolean(left) && toBoolean(right);
    case '||': return toBoolean(left) || toBoolean(right);
    default: return 0;
  }
}

function applyUnaryOp(op, operand) {
  switch (op) {
    case '-': return -toNumber(operand);
    case '!': return !toBoolean(operand);
    default: return operand;
  }
}

export function evaluateAST(ast, ctx) {
  if (!ast || typeof ast !== 'object') {
    return '';
  }

  switch (ast.type) {
    case 'Literal':
      return ast.value;

    case 'Variable': {
      const name = ast.name;
      if (ctx.vars) {
        return ctx.vars.get(name) ?? '';
      }
      return '';
    }

    case 'Identifier': {
      const name = ast.name;
      if (ctx.identifiers && typeof ctx.identifiers[name] === 'function') {
        return ctx.identifiers[name]([]);
      }
      if (ctx.resolveIdentifier) {
        return ctx.resolveIdentifier(name, []);
      }
      return name;
    }

    case 'BinaryOp': {
      const left = evaluateAST(ast.left, ctx);
      const right = evaluateAST(ast.right, ctx);
      return applyBinaryOp(ast.op, left, right);
    }

    case 'UnaryOp': {
      const operand = evaluateAST(ast.operand, ctx);
      return applyUnaryOp(ast.op, operand);
    }

    case 'Call': {
      const name = ast.name;
      const args = ast.args.map(arg => evaluateAST(arg, ctx));
      
      if (ctx.identifiers && typeof ctx.identifiers[name] === 'function') {
        return ctx.identifiers[name](args);
      }
      if (ctx.resolveIdentifier) {
        return ctx.resolveIdentifier(name, args);
      }
      return '';
    }

    default:
      return '';
  }
}

const astCache = new Map();
const MAX_CACHE_SIZE = 1000;

export function evaluateExpression(source, ctx) {
  if (!source || typeof source !== 'string') {
    return '';
  }

  const trimmed = source.trim();
  if (!trimmed) {
    return '';
  }

  let ast = astCache.get(trimmed);
  if (!ast) {
    ast = parseExpression(trimmed);
    if (astCache.size >= MAX_CACHE_SIZE) {
      const firstKey = astCache.keys().next().value;
      astCache.delete(firstKey);
    }
    astCache.set(trimmed, ast);
  }

  return evaluateAST(ast, ctx);
}

export function evaluateCondition(source, ctx) {
  const result = evaluateExpression(source, ctx);
  return toBoolean(result);
}

export function clearExpressionCache() {
  astCache.clear();
}

export function getExpressionCacheStats() {
  return {
    size: astCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
