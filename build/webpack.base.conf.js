'use strict'
const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

const resolve = (dir) => path.join(__dirname, '..', dir);

const pagesDir = resolve('src/pages');


const entries = ()=>{
  const entryFiles = glob.sync(pagesDir + '/**/*.{js,ts}');
  const reg = /\/src\/pages\/([^/]+).?\/index\.js|ts$/i
  return entryFiles.reduce((pv,cv)=>Object.assign(pv,reg.test(cv)?{[RegExp.$1]:cv}:null),{});
}

const htmlPluginArr = ()=>{
  const templateFiles = glob.sync(pagesDir + '/**/*.{html,ejs}');
  const reg = /\/src\/pages\/([^/]+).?\/index\.html|ejs$/i
  return templateFiles.filter((filePath)=>reg.test(filePath)).map(filePath => {
    reg.test(filePath)
    const filename = RegExp.$1;
    const baseOption = {
      filename: `${filename}.html`, //目标文件
      template: filePath,
      chunks: [filename, 'vendor', 'commons', 'manifest','styles'], // chunks: ['a', 'vendor', 'common'],
      inject: true,  // script 插入body底部
      minify: { //压缩
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency',  //按照依赖顺序引入script
      favicon: 'favicon.ico'
    }
    return new HtmlWebpackPlugin(baseOption);
  })
}

module.exports = {
  entry: {
    ...entries(),
    // vendor: Object.keys(packagejson.dependencies),  //公共模块单独打包 ['jquery']
  },
  output: {
    path: resolve('dist'),
    publicPath: '/',
    filename: 'static/js/[name].[hash:7].min.js',
  },
  plugins: [
    ...htmlPluginArr(),
    new CopyWebpackPlugin([
      {
        from: resolve('./static'),
        to: 'static',
        ignore: ['.*']
      }
    ]),
  ],
  module: {
    rules: [
      {
        enforce: 'pre', // 预加载
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter'),
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.((woff2?|svg)(\?v=[0-9]\.[0-9]\.[0-9]))|(woff2?|svg|jpe?g|png|gif|ico)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10240,   // 大于10kb将解析成base64
              name: 'static/images/[name].[hash:7].[ext]' //输出目录及文件名
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              // https://github.com/tcoopman/image-webpack-loader
              mozjpeg: {  //压缩jpeg
                progressive: true,
                quality: 65
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: '65-90',
                speed: 4
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75
              }
            }
          }
        ]
      },
      {
        test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: 'static/fonts/[name].[hash:7].[ext]'
            }
          }
        ]
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': resolve('./src')
    }
  },
}