function escapeHtml(text) {
  return text.replace(/[&<>]/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    return "&gt;";
  });
}

function collectRanges(text, tokens) {
  const used = new Uint8Array(text.length);
  const ranges = [];

  for (const [pattern, cls] of tokens) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match = re.exec(text);
    while (match) {
      const start = match.index;
      const end = start + match[0].length;
      let overlaps = false;

      for (let i = start; i < end; i += 1) {
        if (used[i]) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps && end > start) {
        for (let i = start; i < end; i += 1) used[i] = 1;
        ranges.push({ start, end, cls });
      }
      match = re.exec(text);
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

function paint(text, tokens, appendTrailingNewline = true) {
  if (!text) return appendTrailingNewline ? "\n" : "";

  const ranges = collectRanges(text, tokens);
  let out = "";
  let cursor = 0;

  for (const range of ranges) {
    if (cursor < range.start) {
      out += escapeHtml(text.slice(cursor, range.start));
    }
    out += `<span class="${range.cls}">${escapeHtml(text.slice(range.start, range.end))}</span>`;
    cursor = range.end;
  }

  if (cursor < text.length) {
    out += escapeHtml(text.slice(cursor));
  }

  if (appendTrailingNewline) return `${out}\n`;
  return out;
}

const TOKENS_MIRC = [
  [/;[^\n]*/g, "hl-comment"],
  [/\$[A-Za-z_][A-Za-z0-9_.]*/g, "hl-ident"],
  [/%[A-Za-z_][A-Za-z0-9_.]*/g, "hl-var"],
  [/\b(alias|on|var|set|if|elseif|else|while|return|halt|timer|dialog|inc|dec)\b/gi, "hl-kw"],
  [/\b\d+(\.\d+)?\b/g, "hl-num"],
];

const TOKENS_SH = [
  [/#.*/g, "hl-comment"],
  [/^[ \t]*[A-Za-z_][\w-]*/gm, "hl-ident"],
  [/--[\w-]+/g, "hl-kw"],
];

const TOKENS_TS = [
  [/\/\/[^\n]*/g, "hl-comment"],
  [/"[^"\n]*"|'[^'\n]*'/g, "hl-str"],
  [/\b(import|from|const|new|let|var|return|export)\b/g, "hl-kw"],
  [/\b[A-Z][A-Za-z0-9_]*\b/g, "hl-ident"],
  [/\b\d+(\.\d+)?\b/g, "hl-num"],
];

export function highlightMirc(text, appendTrailingNewline = true) {
  return paint(text, TOKENS_MIRC, appendTrailingNewline);
}

export function highlightSh(text, appendTrailingNewline = true) {
  return paint(text, TOKENS_SH, appendTrailingNewline);
}

export function highlightTs(text, appendTrailingNewline = true) {
  return paint(text, TOKENS_TS, appendTrailingNewline);
}
