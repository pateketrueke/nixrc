export class LoopGuard {
  constructor(config = {}) {
    this.maxIterations = config.maxIterations || 10000;
    this.maxTime = config.maxTime || 5000;
    this.checkInterval = config.checkInterval || 100;
    this.onLimit = config.onLimit || null;
    
    this.iterations = 0;
    this.startTime = Date.now();
    this.lastCheck = 0;
  }

  check() {
    this.iterations += 1;
    
    if (this.iterations >= this.maxIterations) {
      const info = {
        reason: 'max_iterations',
        iterations: this.iterations,
        elapsed: Date.now() - this.startTime,
        limit: this.maxIterations,
      };
      if (this.onLimit) this.onLimit(info);
      return { ok: false, ...info };
    }
    
    const now = Date.now();
    if (now - this.lastCheck >= this.checkInterval) {
      this.lastCheck = now;
      
      if (now - this.startTime >= this.maxTime) {
        const info = {
          reason: 'max_time',
          iterations: this.iterations,
          elapsed: now - this.startTime,
          limit: this.maxTime,
        };
        if (this.onLimit) this.onLimit(info);
        return { ok: false, ...info };
      }
    }
    
    return { ok: true };
  }

  reset() {
    this.iterations = 0;
    this.startTime = Date.now();
    this.lastCheck = 0;
  }

  getStats() {
    return {
      iterations: this.iterations,
      elapsed: Date.now() - this.startTime,
      maxIterations: this.maxIterations,
      maxTime: this.maxTime,
    };
  }
}

export function createLoopGuard(config = {}) {
  return new LoopGuard(config);
}
