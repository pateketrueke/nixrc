const DBU_X = 4;
const DBU_Y = 8;

function toPxRect(rect) {
  const [x, y, w, h] = rect || [0, 0, 20, 10];
  return {
    x: Number(x) * DBU_X,
    y: Number(y) * DBU_Y,
    w: Number(w) * DBU_X,
    h: Number(h) * DBU_Y,
  };
}

function stylePos(node, rect) {
  node.style.position = 'absolute';
  node.style.left = `${rect.x}px`;
  node.style.top = `${rect.y}px`;
  node.style.width = `${rect.w}px`;
  node.style.height = `${rect.h}px`;
}

function renderControl(control) {
  const type = String(control.type || '').toLowerCase();
  let el;

  if (type === 'text') {
    el = document.createElement('label');
    el.textContent = control.text || '';
  } else if (type === 'edit') {
    el = control.flags?.includes('multi') ? document.createElement('textarea') : document.createElement('input');
    if ('value' in el) el.value = control.text || '';
  } else if (type === 'button') {
    el = document.createElement('button');
    el.textContent = control.text || 'Button';
  } else if (type === 'check') {
    const wrap = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    wrap.append(box, document.createTextNode(control.text || ''));
    el = wrap;
  } else if (type === 'list' || type === 'combo') {
    el = document.createElement('select');
  } else {
    el = document.createElement('div');
    el.textContent = `${type} unsupported`;
  }

  el.dataset.id = String(control.id || 0);
  stylePos(el, toPxRect(control.rect));
  return el;
}

export class MirxDialogElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.controls = new Map();
    this.spec = null;
  }

  connectedCallback() {
    if (!this.spec) this.render({ title: this.getAttribute('name') || 'dialog', controls: [] });
  }

  render(spec) {
    this.spec = spec;
    this.controls.clear();
    this.shadowRoot.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display:block;
        border:1px solid var(--mirx-border, #8a8a8a);
        background: var(--mirx-bg, #f0f0f0);
        color: #111;
        width: max-content;
        min-width: 240px;
      }
      .chrome { padding: 8px; font: 13px var(--mirx-font, "Segoe UI", sans-serif); }
      .title { font-weight: 600; margin-bottom: 6px; }
      .stage { position:relative; min-height: 150px; min-width: 220px; background: #fff; border:1px solid #bbb; }
      button { cursor: pointer; }
      textarea,input,select { box-sizing: border-box; }
    `;

    const chrome = document.createElement('div');
    chrome.className = 'chrome';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = spec.title || 'Dialog';

    const stage = document.createElement('div');
    stage.className = 'stage';

    for (const control of spec.controls || []) {
      const node = renderControl(control);
      this.controls.set(Number(control.id), node);
      stage.appendChild(node);
      node.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('sclick', { detail: { id: Number(control.id) } }));
      });
      if ('value' in node) {
        node.addEventListener('input', () => {
          this.dispatchEvent(new CustomEvent('edit', { detail: { id: Number(control.id), value: node.value } }));
        });
      }
    }

    chrome.append(title, stage);
    this.shadowRoot.append(style, chrome);
  }

  did(id) {
    return this.controls.get(Number(id)) || null;
  }

  didReplaceAll(id, text) {
    const el = this.did(id);
    if (!el) return;
    if ('value' in el) el.value = String(text);
    else el.textContent = String(text);
  }
}

customElements.define('mirx-dialog', MirxDialogElement);
