import { createRuntime } from '../runtime/src/index.js';
import { EXAMPLES } from './examples.js';
import { highlight } from './highlight.js';
import { updateHashWithCode, readCodeFromHash } from './url-codec.js';

const editor = document.getElementById('editor');
const hl = document.getElementById('hl');
const examples = document.getElementById('examples');
const runBtn = document.getElementById('run');
const shareBtn = document.getElementById('share');
const autorun = document.getElementById('autorun');
const consoleNode = document.getElementById('console');
const clearConsole = document.getElementById('clear-console');
const host = document.getElementById('host');

function log(level, message) {
  const now = new Date().toLocaleTimeString();
  consoleNode.textContent += `[${now}] ${level}: ${message}\n`;
  consoleNode.scrollTop = consoleNode.scrollHeight;
}

let runtime = createRuntime({ host, log });

function resetRuntime() {
  runtime.reset();
  host.innerHTML = '';
  runtime = createRuntime({ host, log });
}

function runScript() {
  try {
    resetRuntime();
    runtime.load(editor.value);
    runtime.run('start');
    log('info', 'script loaded + start executed');
  } catch (err) {
    log('error', err instanceof Error ? err.message : String(err));
  }
}

function updateHash() {
  updateHashWithCode(editor.value);
}

function syncHighlight() {
  hl.innerHTML = highlight(editor.value);
}

function loadFromHash() {
  try {
    const maybeCode = readCodeFromHash();
    if (maybeCode == null) return false;
    editor.value = maybeCode;
    syncHighlight();
    return true;
  } catch {
    return false;
  }
}

for (const name of Object.keys(EXAMPLES)) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  examples.appendChild(option);
}

examples.addEventListener('change', () => {
  editor.value = EXAMPLES[examples.value];
  syncHighlight();
  updateHash();
  runScript();
});

runBtn.addEventListener('click', runScript);
shareBtn.addEventListener('click', async () => {
  updateHash();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    log('info', 'share URL copied');
  } catch {
    log('warn', `copy failed; URL: ${url}`);
  }
});

clearConsole.addEventListener('click', () => {
  consoleNode.textContent = '';
});

let debounce;
editor.addEventListener('input', () => {
  syncHighlight();
  updateHash();
  if (!autorun.checked) return;
  clearTimeout(debounce);
  debounce = setTimeout(runScript, 500);
});

editor.addEventListener('scroll', () => {
  hl.scrollTop = editor.scrollTop;
  hl.scrollLeft = editor.scrollLeft;
});

if (!loadFromHash()) {
  const first = Object.keys(EXAMPLES)[0];
  examples.value = first;
  editor.value = EXAMPLES[first];
  syncHighlight();
  updateHash();
}

runScript();
