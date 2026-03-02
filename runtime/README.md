# mirx/runtime (MVP)

Browser runtime for mIRC-style scripts.

## Includes

- Core event bus
- Window manager (picture + text windows)
- Dialog manager + `did` helpers
- Timer manager
- Subsystem shims: sockets, IRC, file, ini, hash tables
- Interpreter over parsed `.mrc` aliases/events

## Entry point

- `runtime/src/index.js` via `createRuntime({ host, log })`
