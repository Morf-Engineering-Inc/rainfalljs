import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Treat these as external dependencies and don't bundle them
const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  'react/jsx-runtime',
  /@babel\/runtime/
];

// Base configuration for all builds
const baseConfig = {
  input: 'src/index.js',
  plugins: [
    // Resolve node_modules
    resolve({ extensions }),
    // Transpile with Babel
    babel({
      extensions,
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      presets: [
        '@babel/preset-env',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }),
    // Convert CommonJS modules to ES6
    commonjs({
      include: 'node_modules/**',
      // React specific configuration
      transformMixedEsModules: true
    })
  ],
  external
};

export default [
  // CommonJS build (for Node)
  {
    ...baseConfig,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
  },
  // ES module build (for bundlers)
  {
    ...baseConfig,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  },
  // Minified UMD build (for browsers)
  {
    ...baseConfig,
    output: {
      name: 'RainfallJS',
      file: 'dist/index.umd.js',
      format: 'umd',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        next: 'Next',
      },
      sourcemap: true,
    },
    plugins: [
      ...baseConfig.plugins,
      terser(), // Minify the bundle
    ],
  },
];