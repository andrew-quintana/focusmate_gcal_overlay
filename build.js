#!/usr/bin/env node

const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: {
    'background': 'src/background/background.ts',
    'content': 'src/content/content.ts',
    'options': 'src/options/options.ts',
  },
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
  external: ['chrome'],
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(baseConfig);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(baseConfig);
      console.log('Build completed successfully');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();

