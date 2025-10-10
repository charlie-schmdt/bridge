# Source Layout

### `src/main`:
- This is what is run by Electron with `pnpm start`

### `src/renderer`:
- This is the React source code, which is bundled by Rsbuild with `pnpm build`
- The output of Rsbuild will end up in a directory `/dist` in the root of the project. `pnpm start` will then trigger Electron to run `src/main/main.js`, which serves up the contents of `dist` in the Electron's browser runtime



# React Version Setup

This project uses React 18.2.0 to ensure compatibility with the stream-chat API.

## How to Install

Run the following command:

pnpm install

## Troubleshooting

If you encounter issues:

pnpm store prune  
rm -rf node_modules  
pnpm up react@18.2.0 react-dom@18.2.0
pnpm install