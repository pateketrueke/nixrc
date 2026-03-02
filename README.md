# nixrc

A universal mIRC scripting runtime for the modern web platform.

Run mIRC scripts anywhere — bots on Bun, file servers on Node, picture windows in the browser.

## What this is

mIRC's scripting language is a surprisingly expressive event-driven system with a declarative UI model (dialogs), a rich 2D drawing API (picture windows), and deep IRC integration. The name carries a double meaning: *nix run-commands (`.bashrc`, `.vimrc`) meet mIRC's `.mrc` scripts — two worlds, one runtime.

- **Runtime** — interpret `.mrc` scripts in the browser or any web-platform compatible runtime
- **Transpiler** — compile `.mrc` to tree-shakeable TypeScript/JavaScript (`nixrc compile script.mrc`)
- **Subsystems** — dialogs, text windows, timers, sockets, IRC events, file I/O (MVP shims included)
- **UI framework** — `<mirx-dialog>` and `<mirx-canvas>` web components + native JS API
- **Playground** — live editor shell with URL sharing in `playground/`

## Implemented Modules

- `compiler/` — transpiler CLI and AST codegen
- `runtime/` — browser interpreter/runtime + subsystem shims
- `ui/` — web components and JS UI API
- `playground/` — static playground app
- `site/` — landing page / pitch site

## Transpiler CLI

```bash
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --stdout
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --out dist --emit-dts
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --out dist --watch
node ./compiler/test/transpiler.test.mjs
```
