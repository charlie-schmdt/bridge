# Source Layout

### `src/main`:

- This is what is run by Electron with `pnpm start`

### `src/renderer`:

- This is the React source code, which is bundled by Rsbuild with `pnpm build`
- The output of Rsbuild will end up in a directory `/dist` in the root of the project. `pnpm start` will then trigger Electron to run `src/main/main.js`, which serves up the contents of `dist` in the Electron's browser runtime
