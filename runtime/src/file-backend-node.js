import { open, readFile, writeFile, access, unlink, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { FileBackend } from './file-backend.js';

export class NodeFileBackend extends FileBackend {
  constructor() {
    super();
    this.handles = new Map();
    this.handleCounter = 0;
  }

  async open(path, mode = 'r') {
    const flags = mode === 'w' ? 'w' : 'r';
    try {
      const handle = await open(path, flags);
      const id = `fh${++this.handleCounter}`;
      this.handles.set(id, { handle, path, mode, pos: 0 });
      return id;
    } catch (e) {
      throw new Error(`Failed to open ${path}: ${e.message}`);
    }
  }

  async read(id) {
    const h = this.handles.get(id);
    if (!h) return '';
    
    try {
      const buffer = Buffer.alloc(4096);
      const { bytesRead } = await h.handle.read(buffer, 0, 4096, h.pos);
      h.pos += bytesRead;
      
      const content = buffer.toString('utf8', 0, bytesRead);
      const lines = content.split('\n');
      return lines[0] || '';
    } catch {
      return '';
    }
  }

  async write(id, data) {
    const h = this.handles.get(id);
    if (!h) return;
    
    try {
      const buf = Buffer.from(data + '\n');
      await h.handle.write(buf, 0, buf.length, h.pos);
      h.pos += buf.length;
    } catch (e) {
      throw new Error(`Failed to write: ${e.message}`);
    }
  }

  async close(id) {
    const h = this.handles.get(id);
    if (!h) return;
    
    try {
      await h.handle.close();
    } catch {}
    
    this.handles.delete(id);
  }

  async exists(path) {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async delete(path) {
    try {
      await unlink(path);
    } catch (e) {
      throw new Error(`Failed to delete ${path}: ${e.message}`);
    }
  }

  async readAll(path) {
    try {
      const content = await readFile(path, 'utf8');
      return content;
    } catch {
      return '';
    }
  }

  async writeAll(path, data) {
    try {
      await writeFile(path, data, 'utf8');
    } catch (e) {
      throw new Error(`Failed to write ${path}: ${e.message}`);
    }
  }

  async size(path) {
    try {
      const s = await stat(path);
      return s.size;
    } catch {
      return 0;
    }
  }
}
