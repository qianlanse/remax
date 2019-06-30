import { RollupOptions, RollupWarning } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import progress from 'rollup-plugin-progress';
import clear from 'rollup-plugin-clear';
import pxToUnits from 'postcss-px2units';
import getEntries from './getEntries';
import template from './plugins/template';
import components from './plugins/components';
import page from './plugins/page';
import removeSrc from './plugins/removeSrc';
import rename from './plugins/rename';
import * as React from 'react';
import * as scheduler from 'scheduler';
import getConfig from './getConfig';

export default function rollupConfig({ dev }: { dev: boolean }) {
  const entries = getEntries();
  const projectConfig = getConfig();

  const plugins = [
    progress(),
    commonjs({
      include: /node_modules/,
      namedExports: {
        'node_modules/react/index.js': Object.keys(React).filter(k => k !== 'default'),
        'node_modules/@remax/core/node_modules/scheduler/index.js': Object.keys(scheduler).filter(k => k !== 'default'),
      },
    }),
    babel({
      babelrc: false,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      plugins: [components, require.resolve('@babel/plugin-proposal-class-properties')],
      presets: [
        require.resolve('@babel/preset-typescript'),
        [require.resolve('@babel/preset-env')],
        [require.resolve('@babel/preset-react')],
      ],
    }),
    babel({
      include: entries,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      plugins: [page],
    }),
    postcss({
      extract: true,
      modules: projectConfig.cssModules,
      plugins: [pxToUnits()],
    }),
    resolve({
      dedupe: ['react'],
    }),
    rename({
      include: 'src/**',
      map: input => {
        return (
          input &&
          input
            .replace(/^demo\/src\//, '')
            .replace(/\.less$/, '.js')
            .replace(/\.css$/, '.acss')
            .replace(/\.ts$/, '.js')
            .replace(/\.tsx$/, '.js')
        );
      },
    }),
    removeSrc({}),
    template(),
  ];

  if (!dev) {
    plugins.unshift(
      clear({
        targets: ['dist'],
      }),
    );
  }

  const config: RollupOptions = {
    input: entries,
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
    },
    preserveModules: true,
    preserveSymlinks: true,
    onwarn(warning, warn) {
      if ((warning as RollupWarning).code === 'THIS_IS_UNDEFINED') return;
      warn(warning);
    },
    plugins,
  };

  return config;
}