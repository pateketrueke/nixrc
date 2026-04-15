export class FileBackend {
  async open(path, mode = 'r') {
    throw new Error('FileBackend.open not implemented');
  }

  async read(handle) {
    throw new Error('FileBackend.read not implemented');
  }

  async write(handle, data) {
    throw new Error('FileBackend.write not implemented');
  }

  async close(handle) {
    throw new Error('FileBackend.close not implemented');
  }

  async exists(path) {
    throw new Error('FileBackend.exists not implemented');
  }

  async delete(path) {
    throw new Error('FileBackend.delete not implemented');
  }

  async readAll(path) {
    throw new Error('FileBackend.readAll not implemented');
  }

  async writeAll(path, data) {
    throw new Error('FileBackend.writeAll not implemented');
  }
}

export class MemoryFileBackend extends FileBackend {
  constructor() {
    super();
    this.files = new Map();
    this.handles = new Map();
    this.handleCounter = 0;
  }

  async open(path, mode = 'r') {
    if (!this.files.has(path)) {
      this.files.set(path, '');
    }
    const id = `fh${++this.handleCounter}`;
    this.handles.set(id, { path, mode, pos: 0 });
    return id;
  }

  async read(id) {
    const h = this.handles.get(id);
    if (!h) return '';
    const content = this.files.get(h.path) || '';
    const lines = content.split('\n');
    const line = lines[h.pos] || '';
    h.pos += 1;
    return line;
  }

  async write(id, data) {
    const h = this.handles.get(id);
    if (!h) return;
    const current = this.files.get(h.path) || '';
    this.files.set(h.path, current + data + '\n');
  }

  async close(id) {
    this.handles.delete(id);
  }

  async exists(path) {
    return this.files.has(path);
  }

  async delete(path) {
    this.files.delete(path);
  }

  async readAll(path) {
    return this.files.get(path) || '';
  }

  async writeAll(path, data) {
    this.files.set(path, data);
  }
}

export function createFileBackend() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const { NodeFileBackend } = require('./file-backend-node.js');
      return new NodeFileBackend();
    } catch {
      return new MemoryFileBackend();
    }
  }
  return new MemoryFileBackend();
}
