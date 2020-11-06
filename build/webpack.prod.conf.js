'use strict'
const Webpack = require('webpack');
const { merge } = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const env = 'production';

const proConfig = merge(baseWebpackConfig, {
  mode: env,
  // devtool: '#source-map',
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ] // loader是从右向左运行的，运行的结果会传给下一个loader
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: `static/style/[name].[contenthash].css`,
      chunkFilename: `static/style/[name].[contenthash].css'}`,
    }),
    // new OptimizeCSSAssetsPlugin({
    //   // https://my.oschina.net/itlangz/blog/2986976
    //   assetNameRegExp: /\.css$/g,
    //   cssProcessor: require('cssnano'),
    //   cssProcessorPluginOptions: {
    //     preset: ['default', {
    //       discardComments: {
    //         removeAll: true,
    //       },
    //       normalizeUnicode: false
    //     }]
    //   },
    //   canPrint: true
    // }),
    new Webpack.DefinePlugin({
      'process.env': env,
    }),
  ],
  optimization: {
    runtimeChunk: {
      name: "manifest"
    },
    splitChunks: {  //新版替换webpack.optimize.CommonsChunkPlugin，提取公共模块
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: "initial",
          minChunks: 2, // 公共代码的判断标准：某个js模块被多少个chunk加载了才算是公共代码
          enforce: true
        },
        styles: {
          name: 'styles',
          test: module => module.nameForCondition &&
            /\.(css|s[ac]ss)$/.test(module.nameForCondition()) &&
            !/^javascript/.test(module.type),
          chunks: 'all',
          enforce: true,
        },
        vendor: {
          name: 'vendor',
          test: chunk => (
            chunk.resource &&
            /\.js$/.test(chunk.resource) &&
            /node_modules/.test(chunk.resource)
          ),
          chunks: 'initial',
        },
      }
    },
    // minimize: true  //新版替换webpack.optimize.UglifyJsPlugin 压缩代码,production 默认开启
  },
});
// return;
module.exports = proConfig;