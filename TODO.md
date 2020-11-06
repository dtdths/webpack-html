<!-- extract-text-webpack-plugin -> mini-css-extract-plugin -->

{merge}

htmlPluginA: chunksSortMode


rules: [
  // 'transform-runtime' 插件告诉 babel 要引用 runtime 来代替注入。
  {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: ['@babel/transform-runtime'] //
      }
    }
  }
]

image-webpack-loader

babel

autoprefixer : Change `browserslist` option to `overrideBrowserslist