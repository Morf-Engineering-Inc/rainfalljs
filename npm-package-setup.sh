#!/bin/bash

# Create the package structure
mkdir -p react-data-provider/src
mkdir -p react-data-provider/dist
mkdir -p react-data-provider/examples/nextjs

# Move into the package directory
cd react-data-provider

# Initialize npm package
npm init -y

# Install development dependencies
npm install --save-dev \
  @babel/cli \
  @babel/core \
  @babel/preset-env \
  @babel/preset-react \
  rollup \
  rollup-plugin-babel \
  rollup-plugin-commonjs \
  rollup-plugin-node-resolve \
  rollup-plugin-terser \
  rimraf \
  react \
  react-dom \
  next

# Install peer dependencies
npm install --save-peer react react-dom

# For Next.js specific functionality
npm install --save-optional next
