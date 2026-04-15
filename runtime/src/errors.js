export class NixrcError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'NixrcError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

export class ParseError extends NixrcError {
  constructor(message, location = {}, source = '') {
    super(message, 'PARSE_ERROR', { location, source: source.slice(0, 100) });
    this.name = 'ParseError';
  }
}

export class RuntimeError extends NixrcError {
  constructor(message, operation = '', state = {}) {
    super(message, 'RUNTIME_ERROR', { operation, state });
    this.name = 'RuntimeError';
  }
}

export class CommandError extends NixrcError {
  constructor(message, command = '', args = []) {
    super(message, 'COMMAND_ERROR', { command, args: args.slice(0, 10) });
    this.name = 'CommandError';
  }
}

export class IdentifierError extends NixrcError {
  constructor(message, identifier = '', args = []) {
    super(message, 'IDENTIFIER_ERROR', { identifier, args: args.slice(0, 10) });
    this.name = 'IdentifierError';
  }
}

export class WindowError extends NixrcError {
  constructor(message, window = '', operation = '') {
    super(message, 'WINDOW_ERROR', { window, operation });
    this.name = 'WindowError';
  }
}

export class DialogError extends NixrcError {
  constructor(message, dialog = '', operation = '') {
    super(message, 'DIALOG_ERROR', { dialog, operation });
    this.name = 'DialogError';
  }
}

export class SocketError extends NixrcError {
  constructor(message, socket = '', operation = '') {
    super(message, 'SOCKET_ERROR', { socket, operation });
    this.name = 'SocketError';
  }
}

export class FileError extends NixrcError {
  constructor(message, file = '', operation = '') {
    super(message, 'FILE_ERROR', { file, operation });
    this.name = 'FileError';
  }
}

export class TimeoutError extends NixrcError {
  constructor(message, operation = '', limit = 0) {
    super(message, 'TIMEOUT_ERROR', { operation, limit });
    this.name = 'TimeoutError';
  }
}

export class LoopLimitError extends NixrcError {
  constructor(message, iterations = 0, limit = 0) {
    super(message, 'LOOP_LIMIT', { iterations, limit });
    this.name = 'LoopLimitError';
  }
}

export const ERROR_CODES = {
  PARSE_ERROR: 'PARSE_ERROR',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  COMMAND_ERROR: 'COMMAND_ERROR',
  IDENTIFIER_ERROR: 'IDENTIFIER_ERROR',
  WINDOW_ERROR: 'WINDOW_ERROR',
  DIALOG_ERROR: 'DIALOG_ERROR',
  SOCKET_ERROR: 'SOCKET_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  LOOP_LIMIT: 'LOOP_LIMIT',
};
