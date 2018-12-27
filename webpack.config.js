const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin')

const devMode = process.env.NODE_ENV !== 'production';

const pagesDir = path.resolve(__dirname, 'src/pages');

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
      chunks: [filename, 'commons', 'manifest','styles'], // chunks: ['a', 'vendor', 'common'],
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
  mode: devMode ? 'development' : 'production',
  entry: {
    ...entries(),
    // vendor: Object.keys(packagejson.dependencies),  //公共模块单独打包 ['jquery']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'static/js/[name].[hash:7].min.js',
  },
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
    // proxy: {
    //   // https://github.com/chimurai/http-proxy-middleware
    //   "/api": {
    //     target: "http://localhost:3000",
    //     // pathRewrite: {"^/api" : ""},  //改写请求地址,/api/xxx直接写成/xxx
    //     // secure: false,  // 支持https
    //   }
    // }
  },
  plugins: [
    new Webpack.HotModuleReplacementPlugin(),
    ...htmlPluginArr(),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: `static/style/${devMode ? '[name].css' : '[name].[hash].css'}`,
      chunkFilename: `static/style/${devMode ? '[name].css' : '[name].[hash].css'}`,
    }),
    new OptimizeCSSAssetsPlugin({
      // https://my.oschina.net/itlangz/blog/2986976
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeUnicode: false
        }]
      },
      canPrint: true
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './static'),
        to: 'static',
        ignore: ['.*']
      }
    ]),
    new webpack.DefinePlugin({ //在js中可直接使用的全局变量
      'process.env.NODE_ENV': devMode ? 'development' : 'production',
    }),
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
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],  // loader是从右向左运行的，运行的结果会传给下一个loader
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimization: {
    runtimeChunk: {
      name: "manifest"
    },
    splitChunks: {  //新版替换webpack.optimize.CommonsChunkPlugin，提取公共模块
      cacheGroups: {
        commons: {
          name: 'commons', // 重复代码打包到commons，和库放在一起
          chunks: 'initial',
          minChunks: 2
        },
        styles: {            
          name: 'styles',
          test: /\.scss|css$/,
          chunks: 'all',    // merge all the css chunk to one file
          enforce: true
        }
      }
    },
    // minimize: true  //新版替换webpack.optimize.UglifyJsPlugin 压缩代码
  },
}