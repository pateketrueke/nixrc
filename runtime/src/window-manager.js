function rgbToCss(color) {
  if (typeof color !== 'string') return '#fff';
  if (color.startsWith('rgb(')) return color;
  return color;
}

class PictureWindow {
  constructor(name, host, opts = {}) {
    this.name = name;
    this.host = host;
    this.opts = opts;
    this.meta = { x: opts.x || 0, y: opts.y || 0, w: opts.w || 320, h: opts.h || 240 };

    this.root = document.createElement('section');
    this.root.className = 'mirx-picture-window';
    this.root.dataset.name = name;

    this.header = document.createElement('header');
    this.header.textContent = name;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.meta.w;
    this.canvas.height = this.meta.h;
    this.ctx = this.canvas.getContext('2d');

    this.root.append(this.header, this.canvas);
    host.appendChild(this.root);
  }

  clear(color = '#000') {
    this.ctx.fillStyle = rgbToCss(color);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLine(color, width, x1, y1, x2, y2) {
    this.ctx.strokeStyle = rgbToCss(color);
    this.ctx.lineWidth = Number(width) || 1;
    this.ctx.beginPath();
    this.ctx.moveTo(Number(x1), Number(y1));
    this.ctx.lineTo(Number(x2), Number(y2));
    this.ctx.stroke();
  }

  drawRect(color, x, y, w, h, filled = false) {
    if (filled) {
      this.ctx.fillStyle = rgbToCss(color);
      this.ctx.fillRect(Number(x), Number(y), Number(w), Number(h));
      return;
    }
    this.ctx.strokeStyle = rgbToCss(color);
    this.ctx.strokeRect(Number(x), Number(y), Number(w), Number(h));
  }

  drawDot(color, size, x, y) {
    this.ctx.fillStyle = rgbToCss(color);
    const s = Number(size) || 2;
    this.ctx.beginPath();
    this.ctx.arc(Number(x), Number(y), s, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawText(color, font, size, x, y, text) {
    this.ctx.fillStyle = rgbToCss(color);
    this.ctx.font = `${Number(size) || 14}px ${font || 'monospace'}`;
    this.ctx.fillText(String(text || ''), Number(x), Number(y));
  }

  info() {
    return { ...this.meta, bw: this.canvas.width, bh: this.canvas.height };
  }
}

class TextWindow {
  constructor(name, host) {
    this.name = name;
    this.lines = [];
    this.root = document.createElement('section');
    this.root.className = 'mirx-text-window';
    this.root.dataset.name = name;
    this.header = document.createElement('header');
    this.header.textContent = name;
    this.body = document.createElement('pre');
    this.root.append(this.header, this.body);
    host.appendChild(this.root);
  }

  render() {
    this.body.textContent = this.lines.join('\n');
  }

  append(text) {
    this.lines.push(String(text));
    this.render();
  }

  insert(index, text) {
    this.lines.splice(Math.max(0, index - 1), 0, String(text));
    this.render();
  }

  delete(index) {
    this.lines.splice(Math.max(0, index - 1), 1);
    this.render();
  }

  replace(index, text) {
    this.lines[Math.max(0, index - 1)] = String(text);
    this.render();
  }

  clear() {
    this.lines = [];
    this.render();
  }

  line(index) {
    if (index === 0) return this.lines.length;
    return this.lines[Math.max(0, index - 1)] || '';
  }
}

export class WindowManager {
  constructor(host) {
    this.host = host;
    this.pictureWindows = new Map();
    this.textWindows = new Map();
    this.active = null;
  }

  openPicture(name, opts = {}) {
    const key = normalizeName(name);
    const existing = this.pictureWindows.get(key);
    if (existing) return existing;
    const w = new PictureWindow(key, this.host, opts);
    this.pictureWindows.set(key, w);
    this.active = key;
    return w;
  }

  openText(name) {
    const key = normalizeName(name);
    const existing = this.textWindows.get(key);
    if (existing) return existing;
    const w = new TextWindow(key, this.host);
    this.textWindows.set(key, w);
    this.active = key;
    return w;
  }

  get(name) {
    const key = normalizeName(name);
    return this.pictureWindows.get(key) || this.textWindows.get(key) || null;
  }

  info(name) {
    const target = this.get(name);
    if (!target) return null;
    return target.info ? target.info() : { w: 0, h: 0, x: 0, y: 0 };
  }

  clearAll() {
    for (const w of this.pictureWindows.values()) w.root.remove();
    for (const w of this.textWindows.values()) w.root.remove();
    this.pictureWindows.clear();
    this.textWindows.clear();
  }
}

function normalizeName(name) {
  const raw = String(name || '').trim();
  return raw.startsWith('@') ? raw : `@${raw}`;
}
