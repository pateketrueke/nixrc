export class TimerManager {
  constructor(onFire = null) {
    this.timers = new Map();
    this.onFire = onFire;
  }

  start(name, reps, interval, fn) {
    const key = name || `timer${this.timers.size + 1}`;
    this.stop(key);

    let left = Number(reps);
    const ms = Math.max(1, Number(interval) || 1000);

    const tick = () => {
      if (left === 0) {
        fn();
      } else if (left > 0) {
        fn();
        left -= 1;
        if (left <= 0) {
          this.stop(key);
          return;
        }
      }
      this.onFire?.({ name: key, reps: left, interval: ms });
    };

    const id = setInterval(tick, ms);
    this.timers.set(key, { id, reps: left, interval: ms, fn });
    return key;
  }

  stop(name) {
    const timer = this.timers.get(name);
    if (!timer) return;
    clearInterval(timer.id);
    this.timers.delete(name);
  }

  stopAll() {
    for (const key of this.timers.keys()) this.stop(key);
  }

  count() {
    return this.timers.size;
  }
}
