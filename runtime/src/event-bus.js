export class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  on(event, filter, handler) {
    const key = String(event).toUpperCase();
    if (!this.handlers.has(key)) this.handlers.set(key, []);
    const entry = { filter: filter || {}, handler };
    this.handlers.get(key).push(entry);
    return () => {
      const arr = this.handlers.get(key) || [];
      this.handlers.set(
        key,
        arr.filter((x) => x !== entry)
      );
    };
  }

  emit(event, payload = {}) {
    const key = String(event).toUpperCase();
    const list = this.handlers.get(key) || [];
    for (const { filter, handler } of list) {
      if (!matchesFilter(filter, payload)) continue;
      handler(payload);
    }
  }
}

function matchesFilter(filter, payload) {
  for (const [k, v] of Object.entries(filter || {})) {
    if (v === '*' || v === '') continue;
    const pv = payload[k];
    if (pv === undefined || pv === '') {
      if (v !== '*' && v !== '') return false;
      continue;
    }
    if (String(pv) !== String(v)) return false;
  }
  return true;
}
