'use strict'
const Webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const env = 'development';

const devConfig = merge(baseWebpackConfig, {
  mode: env,
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    inline: true, // 使用内联模式
    clientLogLevel: 'warning', //控制台消息提示
    open: true, //自动打开浏览器
    contentBase: './dist', // 服务器静态文件目录
    compress: true, //gzip 压缩
    disableHostCheck: true,
    host: "0.0.0.0",
    port: 1080,
    useLocalIp: true, //用自己的ip
    hot: true, //启动热更新
    overlay: { //出现错误时在浏览器中显示
      warnings: false,
      errors: true
    },
    proxy: {
      // https://github.com/chimurai/http-proxy-middleware
      "/api": {
        target: "http://localhost:3000",
        // pathRewrite: {"^/api" : ""},  //改写请求地址,/api/xxx直接写成/xxx
        // secure: false,  // 支持https
      }
    },
    watchOptions: {
      poll: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],  // loader是从右向左运行的，运行的结果会传给下一个loader
      }
    ]
  },
  plugins: [
    new Webpack.DefinePlugin({
      'process.env': env, // 在js中可直接使用的全局变量
    }),
    new Webpack.HotModuleReplacementPlugin(),
    new Webpack.NamedModulesPlugin(), // HMR 时显示模块相对路径
  ]
})
module.exports = devConfig;
