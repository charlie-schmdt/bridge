import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
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
