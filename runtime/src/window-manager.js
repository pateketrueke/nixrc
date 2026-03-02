function rgbToCss(color) {
  if (typeof color !== 'string') return '#fff';
  if (color.startsWith('rgb(')) return color;
  return color;
}

class PictureWindow {
  constructor(name, host, opts = {}, onPointerEvent = null) {
    this.name = name;
    this.host = host;
    this.opts = opts;
    this.onPointerEvent = onPointerEvent;
    this.meta = { x: opts.x || 0, y: opts.y || 0, w: opts.w || 320, h: opts.h || 240 };

    this.root = document.createElement('section');
    this.root.className = 'nixrc-picture-window';
    this.root.dataset.name = name;

    this.header = document.createElement('header');
    this.header.textContent = name;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.meta.w;
    this.canvas.height = this.meta.h;
    this.ctx = this.canvas.getContext('2d');

    this.root.append(this.header, this.canvas);
    host.appendChild(this.root);
    this.bindPointerEvents();
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

  drawFill(fillColor, borderColor, x, y) {
    const sx = Math.floor(Number(x));
    const sy = Math.floor(Number(y));
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) return;
    if (sx < 0 || sy < 0 || sx >= this.canvas.width || sy >= this.canvas.height) return;

    const image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = image.data;
    const target = getPixel(data, this.canvas.width, sx, sy);
    const border = parseColorToRgba(borderColor);
    const fill = parseColorToRgba(fillColor);

    if (sameColor(target, fill) || sameColor(target, border)) return;

    const stack = [[sx, sy]];
    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= this.canvas.width || cy >= this.canvas.height) continue;
      const px = getPixel(data, this.canvas.width, cx, cy);
      if (!sameColor(px, target)) continue;
      if (sameColor(px, border)) continue;
      setPixel(data, this.canvas.width, cx, cy, fill);
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    this.ctx.putImageData(image, 0, 0);
  }

  bindPointerEvents() {
    if (typeof this.onPointerEvent !== 'function') return;

    const mapEvent = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor(event.clientX - rect.left);
      const y = Math.floor(event.clientY - rect.top);
      return { x, y, button: Number(event.button) + 1, key: event.buttons ? 1 : 0 };
    };

    this.canvas.addEventListener('mousedown', (event) => {
      this.onPointerEvent('MDOWN', this.name, mapEvent(event));
    });
    this.canvas.addEventListener('mouseup', (event) => {
      this.onPointerEvent('MUP', this.name, mapEvent(event));
    });
    this.canvas.addEventListener('mousemove', (event) => {
      this.onPointerEvent('MMOVE', this.name, mapEvent(event));
    });
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
    this.root.className = 'nixrc-text-window';
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
  constructor(host, onPointerEvent = null) {
    this.host = host;
    this.onPointerEvent = onPointerEvent;
    this.pictureWindows = new Map();
    this.textWindows = new Map();
    this.active = null;
  }

  openPicture(name, opts = {}) {
    const key = normalizeName(name);
    const existing = this.pictureWindows.get(key);
    if (existing) return existing;
    const w = new PictureWindow(key, this.host, opts, this.onPointerEvent);
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

function parseColorToRgba(input) {
  const color = rgbToCss(input);
  if (!color) return [0, 0, 0, 255];
  const rgb = String(color).match(/^rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)$/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), 255];
  if (color.startsWith('#') && color.length === 7) {
    return [
      Number.parseInt(color.slice(1, 3), 16),
      Number.parseInt(color.slice(3, 5), 16),
      Number.parseInt(color.slice(5, 7), 16),
      255,
    ];
  }
  return [0, 0, 0, 255];
}

function getPixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function setPixel(data, width, x, y, color) {
  const i = (y * width + x) * 4;
  data[i] = color[0];
  data[i + 1] = color[1];
  data[i + 2] = color[2];
  data[i + 3] = color[3];
}

function sameColor(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
