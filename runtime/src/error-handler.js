import { NixrcError } from './errors.js';

export class ErrorHandler {
  constructor(opts = {}) {
    this.mode = opts.mode || 'log';
    this.errors = [];
    this.maxErrors = opts.maxErrors || 100;
    this.hooks = new Map();
    this.onLimitReached = opts.onLimitReached || null;
  }

  handle(error) {
    if (!(error instanceof NixrcError)) {
      error = new NixrcError(
        error.message || 'Unknown error',
        'RUNTIME_ERROR',
        { original: error }
      );
    }

    this.errors.push(error);

    if (this.hooks.has(error.code)) {
      try {
        this.hooks.get(error.code)(error);
      } catch (hookError) {
        console.error('Error hook failed:', hookError);
      }
    }

    if (this.errors.length >= this.maxErrors) {
      if (this.onLimitReached) {
        this.onLimitReached(this.errors.length, this.maxErrors);
      }
    }

    switch (this.mode) {
      case 'throw':
        throw error;
      case 'log':
        this.logError(error);
        return null;
      case 'silent':
        return null;
      default:
        return null;
    }
  }

  logError(error) {
    const prefix = `[nixrc:${error.code}]`;
    const context = Object.keys(error.context).length > 0
      ? ` ${JSON.stringify(error.context)}`
      : '';
    console.error(`${prefix} ${error.message}${context}`);
  }

  on(code, hook) {
    this.hooks.set(code, hook);
    return this;
  }

  off(code) {
    this.hooks.delete(code);
    return this;
  }

  getErrors() {
    return [...this.errors];
  }

  getErrorsByCode(code) {
    return this.errors.filter(e => e.code === code);
  }

  getLastErrors(n = 10) {
    return this.errors.slice(-n);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  count() {
    return this.errors.length;
  }

  clear() {
    this.errors = [];
    return this;
  }

  setMode(mode) {
    if (['throw', 'log', 'silent'].includes(mode)) {
      this.mode = mode;
    }
    return this;
  }

  wrap(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        error.context = { ...error.context, ...context, args };
        return this.handle(error);
      }
    };
  }

  async wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        error.context = { ...error.context, ...context, args };
        return this.handle(error);
      }
    };
  }
}

export function createErrorHandler(opts = {}) {
  return new ErrorHandler(opts);
}
