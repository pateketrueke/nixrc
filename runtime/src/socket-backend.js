export class SocketBackend {
  async open(name, host, port, opts = {}) {
    throw new Error('SocketBackend.open not implemented');
  }

  async write(name, data) {
    throw new Error('SocketBackend.write not implemented');
  }

  async close(name) {
    throw new Error('SocketBackend.close not implemented');
  }

  getState(name) {
    return 'closed';
  }

  getInfo(name) {
    return null;
  }
}

export class MockSocketBackend extends SocketBackend {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
    this.sockets = new Map();
  }

  async open(name, host, port, opts = {}) {
    this.sockets.set(name, { host, port, state: 'open', sent: 0, rcvd: 0 });
    this.eventBus.emit('SOCKOPEN', { name, host, port });
  }

  async write(name, data) {
    const s = this.sockets.get(name);
    if (!s) return;
    s.sent += String(data).length;
    this.eventBus.emit('SOCKREAD', { name, data: `echo:${data}` });
  }

  async close(name) {
    this.sockets.delete(name);
    this.eventBus.emit('SOCKCLOSE', { name });
  }

  getState(name) {
    return this.sockets.get(name)?.state || 'closed';
  }

  getInfo(name) {
    return this.sockets.get(name) || null;
  }
}

export class WebSocketBackend extends SocketBackend {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
    this.sockets = new Map();
  }

  async open(name, url, _port, opts = {}) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        this.sockets.set(name, { ws, url, state: 'open', sent: 0, rcvd: 0 });
        this.eventBus.emit('SOCKOPEN', { name, url });
        resolve();
      };
      
      ws.onmessage = (event) => {
        const s = this.sockets.get(name);
        if (s) s.rcvd += event.data.length;
        this.eventBus.emit('SOCKREAD', { name, data: event.data });
      };
      
      ws.onerror = (error) => {
        this.eventBus.emit('SOCKERROR', { name, error });
        reject(error);
      };
      
      ws.onclose = () => {
        this.sockets.delete(name);
        this.eventBus.emit('SOCKCLOSE', { name });
      };
    });
  }

  async write(name, data) {
    const s = this.sockets.get(name);
    if (!s || s.state !== 'open') return;
    s.ws.send(data);
    s.sent += data.length;
  }

  async close(name) {
    const s = this.sockets.get(name);
    if (!s) return;
    s.ws.close();
    this.sockets.delete(name);
  }

  getState(name) {
    return this.sockets.get(name)?.state || 'closed';
  }

  getInfo(name) {
    const s = this.sockets.get(name);
    if (!s) return null;
    return { url: s.url, sent: s.sent, rcvd: s.rcvd, state: s.state };
  }
}

export function createSocketBackend(eventBus) {
  if (typeof WebSocket !== 'undefined') {
    return new WebSocketBackend(eventBus);
  }
  return new MockSocketBackend(eventBus);
}
