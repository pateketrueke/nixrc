import assert from 'node:assert/strict';

if (typeof globalThis.btoa !== 'function') {
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

const { encodeCode, decodeCode, updateHashWithCode, readCodeFromHash } = await import('../url-codec.js');

const src = 'alias start { echo -a "hola 🚀" }';
const enc = encodeCode(src);
const dec = decodeCode(enc);
assert.equal(dec, src);

const fakeLocation = { hash: '' };
updateHashWithCode(src, fakeLocation);
assert.ok(fakeLocation.hash.startsWith('code='));

const fakeLocation2 = { hash: `#${fakeLocation.hash}` };
assert.equal(readCodeFromHash(fakeLocation2), src);
assert.equal(readCodeFromHash({ hash: '#other=x' }), null);

console.log('playground url codec test passed');
