function rgbToCss(color) {
  if (typeof color !== 'string') return '#fff';
  if (color.startsWith('rgb(')) return color;
  return color;
}

class PictureWindow {
  constructor(name, host, opts = {}, onPointerEvent = null, manager = null) {
    this.name = name;
    this.host = host;
    this.opts = opts;
    this.onPointerEvent = onPointerEvent;
    this._manager = manager;
    this._moveRafPending = false;
    this._lastMovePayload = null;
    this._drawPicQueue = new Map();
    this._drawPicLoading = new Set();
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

  drawPic(opts = {}) {
    const src = String(opts.src ?? '').trim();
    if (!src) return;

    const draw = (image, drawOpts = opts) => {
      if (!image) return;
      const iw = Number(image.naturalWidth || image.width || 0);
      const ih = Number(image.naturalHeight || image.height || 0);
      if (iw <= 0 || ih <= 0) return;

      const x = Number(drawOpts.x) || 0;
      const y = Number(drawOpts.y) || 0;
      const w = Number(drawOpts.w);
      const h = Number(drawOpts.h);
      const dw = Number.isFinite(w) && w > 0 ? w : iw;
      const dh = Number.isFinite(h) && h > 0 ? h : ih;
      const flags = drawOpts.flags || {};
      const dx = flags.c ? x - dw / 2 : x;
      const dy = flags.c ? y - dh / 2 : y;

      if (flags.m) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(dx, dy, dw, dh);
        this.ctx.clip();
        for (let tx = dx; tx < dx + dw; tx += iw) {
          for (let ty = dy; ty < dy + dh; ty += ih) {
            this.ctx.drawImage(image, tx, ty);
          }
        }
        this.ctx.restore();
        return;
      }

      const sx = Number(drawOpts.sx);
      const sy = Number(drawOpts.sy);
      const sw = Number(drawOpts.sw);
      const sh = Number(drawOpts.sh);
      const hasCrop = [sx, sy, sw, sh].every((n) => Number.isFinite(n));
      if (hasCrop) {
        this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        return;
      }

      this.ctx.drawImage(image, dx, dy, dw, dh);
    };

    const cached = this._manager?.imageCache?.get(src);
    if (cached) {
      draw(cached);
      return;
    }

    const queue = this._drawPicQueue.get(src) || [];
    queue.push({ ...opts });
    this._drawPicQueue.set(src, queue);
    if (this._drawPicLoading.has(src)) return;
    this._drawPicLoading.add(src);
    this._manager?.loadImage?.(src).then((image) => {
      const pending = this._drawPicQueue.get(src) || [];
      this._drawPicQueue.delete(src);
      if (!image) return;
      for (const queued of pending) {
        draw(image, queued);
      }
    }).finally(() => {
      this._drawPicLoading.delete(src);
    });
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
      this._lastMovePayload = mapEvent(event);
      if (this._moveRafPending) return;
      this._moveRafPending = true;
      const flush = () => {
        this._moveRafPending = false;
        if (!this._lastMovePayload) return;
        this.onPointerEvent('MMOVE', this.name, this._lastMovePayload);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
      else setTimeout(flush, 16);
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
    this.imageCache = new Map();
    this.imageLoads = new Map();
    this.active = null;
  }

  openPicture(name, opts = {}) {
    const key = normalizeName(name);
    const existing = this.pictureWindows.get(key);
    if (existing) return existing;
    const w = new PictureWindow(key, this.host, opts, this.onPointerEvent, this);
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

  loadImage(src) {
    const key = String(src ?? '').trim();
    if (!key) return Promise.resolve(null);
    if (this.imageCache.has(key)) return Promise.resolve(this.imageCache.get(key));
    if (this.imageLoads.has(key)) return this.imageLoads.get(key);
    if (typeof Image !== 'function') return Promise.resolve(null);

    const loading = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(key, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = key;
    }).finally(() => {
      this.imageLoads.delete(key);
    });

    this.imageLoads.set(key, loading);
    return loading;
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
