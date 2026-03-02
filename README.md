# nixrc

A universal mIRC scripting runtime for the modern web platform.

Run mIRC scripts anywhere — bots on Bun, file servers on Node, picture windows in the browser.

## What this is

mIRC's scripting language is a surprisingly expressive event-driven system with a declarative UI model (dialogs), a rich 2D drawing API (picture windows), and deep IRC integration. The name carries a double meaning: *nix run-commands (`.bashrc`, `.vimrc`) meet mIRC's `.mrc` scripts — two worlds, one runtime.

- **Runtime** — interpret `.mrc` scripts in the browser or any web-platform compatible runtime (Bun, Node.js, Deno)
- **Transpiler** — compile `.mrc` to tree-shakeable TypeScript/JavaScript (`nixrc compile script.mrc`)
- **Subsystems** — full coverage: dialogs, text windows, timers, sockets, IRC events, file I/O
- **Server-side** — bots, file servers (`fserve`), IRC gateways and bridges
- **UI framework** — `<nixrc-dialog>` and `<nixrc-canvas>` web components with a native JS/TS API
- **Playground** — live editor with URL sharing, a la CodePen ([nixrc.dev](https://nixrc.dev))

## Status

Planning phase. See [`TASKS.md`](./TASKS.md) for the roadmap.
