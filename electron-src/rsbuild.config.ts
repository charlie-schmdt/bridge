import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const { publicVars } = loadEnv();
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: publicVars,
    alias: {
      '@assets': './src/assets',
    },
    entry: {
      index: './src/renderer/Main.tsx',
    }, 
  },
  output: {
    assetPrefix: './',
  },
});
