# @nixrc/compiler (MVP)

Minimal mIRC-to-TypeScript transpiler.

## CLI

```bash
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --stdout
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --out dist
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --out dist --emit-dts
node ./compiler/cli.js compile scripts/reference/regx-0.2.mrc --out dist --watch
```

## Supported subset

- `alias name { ... }` blocks to exported JS functions
- `on *:EVENT:match:target:{ ... }` handlers to `on("EVENT", filters, fn)`
- Commands: `set`, `var`, `echo`, `msg`, `timer`, and passthrough runtime calls
- `%vars` to JS locals (`_name`)
- `$ident(...)` mapped to runtime identifier calls
- Pipe command splitting (`cmd1 | cmd2`) to sequential JS statements
- Source map sidecar generation (`.ts.map`)
- Optional declaration output (`--emit-dts`)

This is intentionally partial and designed as the foundation for full Plan 02 coverage.
