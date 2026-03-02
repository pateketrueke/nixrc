export function encodeCode(value) {
  const utf8 = encodeURIComponent(value);
  const b64 = btoa(unescape(utf8));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 ? '='.repeat(4 - (normalized.length % 4)) : '';
  const text = atob(normalized + pad);
  return decodeURIComponent(escape(text));
}

export function updateHashWithCode(code, locationObj = location) {
  locationObj.hash = `code=${encodeCode(code)}`;
}

export function readCodeFromHash(locationObj = location) {
  const hash = locationObj.hash.replace(/^#/, '');
  if (!hash.startsWith('code=')) return null;
  return decodeCode(hash.slice(5));
}
