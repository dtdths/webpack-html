'use strict'
const rm = require('rimraf')
const path = require("path");
const Webpack = require('webpack');
const resolve = (dir) => path.join(__dirname, '..', dir);
const webpackConfig = require('./webpack.prod.conf')
rm(resolve('dist'), err => {
  if (err) throw err
  Webpack(webpackConfig, (err, stats) => {
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false, // If you are using ts-loader, setting this to true will make TypeScript errors show up during build.
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log('  Build failed with errors.\n')
      process.exit(1)
    }

    console.log('  Build complete.\n')
  })
})