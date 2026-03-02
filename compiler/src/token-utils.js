export function tokenizeCommand(input) {
  const tokens = [];
  let current = '';
  let inQuote = false;
  let depth = 0;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (ch === '"') {
      current += ch;
      inQuote = !inQuote;
      continue;
    }

    if (!inQuote) {
      if (ch === '(') {
        depth += 1;
        current += ch;
        continue;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        current += ch;
        continue;
      }
      if (/\s/.test(ch) && depth === 0) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }
    }

    current += ch;
  }

  if (current) tokens.push(current);
  return tokens;
}

export function splitByPipe(input) {
  const segments = [];
  let current = '';
  let inQuote = false;
  let depth = 0;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
      continue;
    }

    if (!inQuote) {
      if (ch === '(') {
        depth += 1;
        current += ch;
        continue;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        current += ch;
        continue;
      }
      if (ch === '|' && depth === 0) {
        const part = current.trim();
        if (part) segments.push(part);
        current = '';
        continue;
      }
    }

    current += ch;
  }

  const trailing = current.trim();
  if (trailing) segments.push(trailing);
  return segments;
}

export function splitArgs(raw) {
  const out = [];
  let current = '';
  let inQuote = false;
  let depth = 0;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
      continue;
    }

    if (!inQuote) {
      if (ch === '(') {
        depth += 1;
        current += ch;
        continue;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        current += ch;
        continue;
      }
      if (ch === ',' && depth === 0) {
        out.push(current);
        current = '';
        continue;
      }
    }

    current += ch;
  }

  if (current) out.push(current);
  return out;
}
