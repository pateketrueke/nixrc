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
  constructor() {
    this.files = new Map();
    this.handles = new Map();
  }

  fopen(name, file) {
    if (!this.files.has(file)) this.files.set(file, '');
    this.handles.set(name, { file, pos: 0 });
  }

  fclose(name) {
    this.handles.delete(name);
  }

  fwrite(name, line) {
    const h = this.handles.get(name);
    if (!h) return;
    const current = this.files.get(h.file) || '';
    this.files.set(h.file, `${current}${line}\n`);
  }

  fread(name) {
    const h = this.handles.get(name);
    if (!h) return '';
    const content = this.files.get(h.file) || '';
    const lines = content.split('\n');
    const line = lines[h.pos] || '';
    h.pos += 1;
    return line;
  }

  isfile(file) {
    return this.files.has(file);
  }
}

export class SocketShim {
  constructor(eventBus) {
    this.sockets = new Map();
    this.eventBus = eventBus;
  }

  sockopen(name, host, port) {
    this.sockets.set(name, { host, port, sent: 0, rcvd: 0 });
    this.eventBus.emit('SOCKOPEN', { name, host, port });
  }

  sockwrite(name, text) {
    const s = this.sockets.get(name);
    if (!s) return;
    s.sent += String(text).length;
    this.eventBus.emit('SOCKREAD', { name, data: `echo:${text}` });
  }

  sockclose(name) {
    this.sockets.delete(name);
    this.eventBus.emit('SOCKCLOSE', { name });
  }

  sock(name) {
    return this.sockets.get(name) || null;
  }
}

export class IrcShim {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.network = 'mocknet';
    this.server = 'mock.server';
    this.nick = 'mirx';
    this.chan = '#mirx';
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
