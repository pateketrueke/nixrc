import { createFileBackend } from './file-backend.js';
import { createSocketBackend } from './socket-backend.js';

export class HashStore {
  constructor() {
    this.tables = new Map();
  }

  hmake(name) {
    this.tables.set(name, new Map());
  }

  hadd(name, key, value) {
    if (!this.tables.has(name)) this.hmake(name);
    this.tables.get(name).set(key, value);
  }

  hget(name, key) {
    return this.tables.get(name)?.get(key) ?? '';
  }

  hdel(name, key) {
    this.tables.get(name)?.delete(key);
  }

  hfree(name) {
    this.tables.delete(name);
  }
}

export class IniStore {
  constructor() {
    this.data = new Map();
  }

  write(file, section, key, value) {
    const full = `${file}:${section}`;
    if (!this.data.has(full)) this.data.set(full, new Map());
    this.data.get(full).set(key, value);
  }

  read(file, section, key) {
    return this.data.get(`${file}:${section}`)?.get(key) ?? '';
  }

  remove(file, section, key) {
    const bucket = this.data.get(`${file}:${section}`);
    if (!bucket) return;
    if (key) bucket.delete(key);
    else this.data.delete(`${file}:${section}`);
  }
}

export class FileStore {
  constructor(backend = null) {
    this.backend = backend || createFileBackend();
    this.handles = new Map();
  }

  async fopen(name, file) {
    const id = await this.backend.open(file, 'r+');
    this.handles.set(name, { id, file });
  }

  async fclose(name) {
    const h = this.handles.get(name);
    if (!h) return;
    await this.backend.close(h.id);
    this.handles.delete(name);
  }

  async fwrite(name, line) {
    const h = this.handles.get(name);
    if (!h) return;
    await this.backend.write(h.id, line);
  }

  async fread(name) {
    const h = this.handles.get(name);
    if (!h) return '';
    return this.backend.read(h.id);
  }

  async isfile(file) {
    return this.backend.exists(file);
  }

  async readAll(file) {
    return this.backend.readAll(file);
  }

  async writeAll(file, data) {
    return this.backend.writeAll(file, data);
  }

  async delete(file) {
    return this.backend.delete(file);
  }
}

export class SocketShim {
  constructor(eventBus, backend = null) {
    this.eventBus = eventBus;
    this.backend = backend || createSocketBackend(eventBus);
    this.sockets = new Map();
  }

  async sockopen(name, host, port, opts = {}) {
    await this.backend.open(name, host, port, opts);
    this.sockets.set(name, { host, port });
  }

  async sockwrite(name, data) {
    await this.backend.write(name, data);
  }

  async sockclose(name) {
    await this.backend.close(name);
    this.sockets.delete(name);
  }

  sock(name) {
    return this.backend.getInfo(name) || this.sockets.get(name) || null;
  }

  state(name) {
    return this.backend.getState(name);
  }
}

export class IrcShim {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.network = 'mocknet';
    this.server = 'mock.server';
    this.nick = 'nixrc';
    this.chan = '#nixrc';
  }

  connect(server) {
    this.server = server;
    this.eventBus.emit('CONNECT', { server });
  }

  msg(target, text) {
    this.eventBus.emit('TEXT', { chan: target, nick: this.nick, text, target });
  }

  join(chan) {
    this.chan = chan;
    this.eventBus.emit('JOIN', { chan, nick: this.nick });
  }

  part(chan) {
    this.eventBus.emit('PART', { chan, nick: this.nick });
  }
}
