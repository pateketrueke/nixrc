export class NixrcCanvas extends HTMLElement {
  static get observedAttributes() {
    return ['width', 'height'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    this.canvas = document.createElement('canvas');
    this.canvas.width = Number(this.getAttribute('width') || 320);
    this.canvas.height = Number(this.getAttribute('height') || 240);
    this.ctx = this.canvas.getContext('2d');
    const style = document.createElement('style');
    style.textContent = `
      :host { display:block; border:1px solid var(--nixrc-border, #667); background: #0c1020; }
      canvas { display:block; width:100%; height:auto; }
    `;
    root.append(style, this.canvas);
  }

  attributeChangedCallback() {
    this.canvas.width = Number(this.getAttribute('width') || 320);
    this.canvas.height = Number(this.getAttribute('height') || 240);
  }

  drawRect({ color = '#fff', x = 0, y = 0, w = 20, h = 20, filled = false } = {}) {
    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, w, h);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x, y, w, h);
    }
  }

  drawLine({ color = '#fff', width = 1, x1 = 0, y1 = 0, x2 = 10, y2 = 10 } = {}) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  drawText({ color = '#fff', font = 'monospace', size = 14, x = 10, y = 20, text = '' } = {}) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px ${font}`;
    this.ctx.fillText(text, x, y);
  }

  drawDot({ color = '#fff', x = 10, y = 10, size = 2 } = {}) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

customElements.define('nixrc-canvas', NixrcCanvas);
