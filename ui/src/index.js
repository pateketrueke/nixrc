import { MirxCanvas } from './mirx-canvas.js';
import { MirxDialogElement } from './mirx-dialog.js';

const registry = new Map();

export function defineDialog(name, spec) {
  registry.set(name, spec);
}

export function mountDialog(name, host = document.body) {
  const spec = registry.get(name);
  if (!spec) throw new Error(`Dialog not defined: ${name}`);
  const el = document.createElement('mirx-dialog');
  el.setAttribute('name', name);
  host.appendChild(el);
  el.render(spec);
  return el;
}

export class Dialog {
  constructor(name, options = {}) {
    this.name = name;
    this.spec = {
      title: options.title || name,
      controls: [],
    };
  }

  add(...controls) {
    this.spec.controls.push(...controls.map((c) => c.toSpec()));
    return this;
  }

  open(host = document.body) {
    defineDialog(this.name, this.spec);
    return mountDialog(this.name, host);
  }
}

export class Button {
  constructor({ id, text, x, y, w, h }) {
    this.id = id;
    this.text = text;
    this.rect = [x, y, w, h];
  }

  toSpec() {
    return { type: 'button', id: this.id, text: this.text, rect: this.rect };
  }
}

export class TextLabel {
  constructor({ id, text, x, y, w, h }) {
    this.id = id;
    this.text = text;
    this.rect = [x, y, w, h];
  }

  toSpec() {
    return { type: 'text', id: this.id, text: this.text, rect: this.rect };
  }
}

export { MirxCanvas, MirxDialogElement };
