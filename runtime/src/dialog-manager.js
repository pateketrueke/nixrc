export class DialogManager {
  constructor(host, eventBus) {
    this.host = host;
    this.eventBus = eventBus;
    this.defs = new Map();
    this.opened = new Map();
  }

  defineDialog(name, spec) {
    this.defs.set(name, spec);
  }

  open(name, modal = false) {
    const spec = this.defs.get(name);
    if (!spec) return null;

    const root = document.createElement(modal ? 'dialog' : 'section');
    root.className = 'mirx-dialog';
    root.dataset.name = name;

    const title = document.createElement('h3');
    title.textContent = spec.title || name;
    root.appendChild(title);

    const controls = new Map();
    for (const c of spec.controls || []) {
      const el = renderControl(c);
      if (el) {
        controls.set(Number(c.id), el);
        root.appendChild(el);
      }
    }

    this.host.appendChild(root);
    this.opened.set(name, { root, controls, spec });
    this.eventBus.emit('DIALOG', { name, event: 'init' });
    return root;
  }

  close(name) {
    const dlg = this.opened.get(name);
    if (!dlg) return;
    dlg.root.remove();
    this.opened.delete(name);
    this.eventBus.emit('DIALOG', { name, event: 'close' });
  }

  did(name, id) {
    const dlg = this.opened.get(name);
    return dlg?.controls.get(Number(id)) || null;
  }

  didReplaceAll(name, id, text) {
    const el = this.did(name, id);
    if (!el) return;
    if ('value' in el) el.value = String(text);
    else el.textContent = String(text);
  }

  didAppend(name, id, text) {
    const el = this.did(name, id);
    if (!el) return;
    if ('value' in el) {
      el.value = `${el.value || ''}${text}`;
      return;
    }
    el.textContent = `${el.textContent || ''}${text}`;
  }

  didReset(name, id) {
    const el = this.did(name, id);
    if (!el) return;
    if ('value' in el) el.value = '';
    else el.textContent = '';
  }

  didState(name, id) {
    const el = this.did(name, id);
    if (!el) return 0;
    if ('checked' in el) return el.checked ? 1 : 0;
    return 0;
  }

  didText(name, id) {
    const el = this.did(name, id);
    if (!el) return '';
    if ('value' in el) return el.value || '';
    return el.textContent || '';
  }
}

function renderControl(control) {
  const type = String(control.type || '').toLowerCase();
  const id = Number(control.id || 0);
  if (!id) return null;

  if (type === 'text') {
    const el = document.createElement('label');
    el.dataset.id = String(id);
    el.textContent = control.text || '';
    return el;
  }

  if (type === 'edit') {
    const el = document.createElement(control.flags?.includes('multi') ? 'textarea' : 'input');
    el.dataset.id = String(id);
    el.value = control.text || '';
    return el;
  }

  if (type === 'button') {
    const el = document.createElement('button');
    el.dataset.id = String(id);
    el.textContent = control.text || 'Button';
    return el;
  }

  if (type === 'check') {
    const wrap = document.createElement('label');
    wrap.dataset.id = String(id);
    const box = document.createElement('input');
    box.type = 'checkbox';
    const txt = document.createElement('span');
    txt.textContent = control.text || '';
    wrap.append(box, txt);
    return wrap;
  }

  if (type === 'list' || type === 'combo') {
    const el = document.createElement('select');
    el.dataset.id = String(id);
    return el;
  }

  const fallback = document.createElement('div');
  fallback.dataset.id = String(id);
  fallback.textContent = `${type} not implemented`;
  return fallback;
}
