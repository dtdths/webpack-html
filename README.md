##  一.前言
webpack配置较为繁杂，大部分教程开篇就从基本术语开始讲起，容易让人望而生畏。so，我已实用为目的写了这篇文章。

##  二.目标
 >* <input type="checkbox" checked disabled>支持热替换
 >* <input type="checkbox" checked disabled>支持scss，自动添加前缀
 >* <input type="checkbox" checked disabled>支持eslint
 >* <input type="checkbox" checked disabled>支持babel
 >* <input type="checkbox" checked disabled>支持图片压缩
 >* <input type="checkbox" checked disabled>支持多js入口，多html模板


##  三.搭建环境
1. 创建 package.json 文件
```bash
npm init -y
```
2. 首先，安装 webpack，webpack-cli 和 cross-env
``` bash
npm install --save-dev webpack webpack-cli cross-env
```
其中 cross-env 主要是用于比较方便的跨平台设置 process.env.NODE_ENV ,用于区分开发环境和生产环境。

3. 新建目录src，目录下创建index.js文件。
4. package.json 下 scripts 中加人 build 命令，更方便的运行 webpack
```json
"scripts": {
  "build": "cross-env NODE_ENV=production webpack"
},
启动 webpack ,并通过 cross-env 设置当前 process.env.NODE_ENV 为 production ，方便启用相应优化
```
此时在次目录终端下
```bash
npm run build
```
就可以将src/index.js打包到dist中。
##  四.基本配置
此时的webpack运行的是默认配置，只能打包js文件。
要实现其他功能，需要在根目录下创建 webpack.config.js 文件进行配置。

### 1.entry 和 mode
首先，我们需要配置入口 entry。因为 webpack 是从某一 js 文件开始，打包其中引入的其他文件。为了构建多页面应用程序，我们需要传入一个 js 入口文件组成的对象。为此，我按如下定义 src 目录:

```
|-- src
    |-- public
        |-- index.js  // 公共模块
    |-- pages
        |-- home
            |-- index.html  // home页
            |-- index.js  // home页js
            |-- index.scss  // home页js
        |-- user
            |-- index.html  // user页
            |-- index.js
            |-- index.scss
```
为了方便读取 src 目录，使用了 glob
```bash
npm install --save-dev glob
```

同时，进行如下配置
```js
const path = require("path");
const glob = require("glob");

const devMode = process.env.NODE_ENV !== 'production';  // 获取 cross-env 设置的 NODE_ENV

const entries = ()=>{
  const pagesDir = path.resolve(__dirname, 'src/pages');  // pages目录
  const entryFiles = glob.sync(pagesDir + '/**/*.{js,ts}'); // glob寻找js文件路径
  const reg = /\/src\/pages\/([^/]+).?\/index\.((js)|(ts))/i;
  return entryFiles.reduce((pv,cv)=>Object.assign(pv,reg.test(cv)?{[RegExp.$1]:cv}:null),{}); // 以pages下目录名为key构成对象
}

module.exports = {
  mode: devMode ? 'development' : 'production', // mode 是 4.x 新增的配置，可以选择 "development","production","none" 是三种值,可以区分开发环境和生产环境。
  entry: {
    ...entries(), // 解构对象
  },
}
```

### 2.output
有了入口，就要有出口。output配置了关于打包后的js输出。
```js
module.exports = {
  // ...
  output: {
    path: path.resolve(__dirname, 'dist'),  // 打包后目录
    publicPath: '/',  // 静态文件目录
    filename: 'static/js/[name].[hash:7].min.js',  // 定义输出的目录和文件名
  },
}
```
再次运行build命令，会打包出如下目录结构
```
|-- dist
    |-- static
        |-- js
          |-- home.xxxxx.js  // home/index.js打包，并加入了hsah
          |-- user.xxxxx.js
```

### 3.使用 html-webpack-plugin 对 html 进行配置
此时 webpack 只打包了js，为了对html进行分别配置，使用 html-webpack-plugin 。此外，还能对 html 进行压缩等优化。
```bash
npm install --save-dev html-webpack-plugin
```
同时增加配置
```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
// ...
const htmlPluginArr = ()=>{
  const htmlDir = path.resolve(__dirname, 'src/pages');
  const templateFiles = glob.sync(htmlDir + '/**/*.{html,ejs}');
  const reg = /\/src\/pages\/([^/]+).?\/index\.((html)|(ejs))/i
  return templateFiles.filter((filePath)=>reg.test(filePath)).map(filePath => {
    reg.test(filePath)
    const filename = RegExp.$1;
    const baseOption = {
      filename: `${filename}.html`, //目标文件
      template: filePath,
      chunks: [filename], // 包含的与html同名的chunks代码块
      inject: true,  // script 插入body底部
      minify: { //压缩
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // 更多配置
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency',  //按照依赖顺序引入script
    }
    return new HtmlWebpackPlugin(baseOption);
  })
}
// ...
module.exports = {
  // ...
  plugins: [
    ...htmlPluginArr()
  ],
  // ...
}
```
再次运行build命令，会打包出如下目录结构
```
|-- dist
    |-- static
        |-- js
          |-- home.xxxxx.js  // home/index.js打包，并加入了hsah
          |-- user.xxxxx.js
    |-- home.html // 通过 html-webpack-plugin 自动引入了 home 的 chunk
    |-- user.html
```

### 4.devServer
进行完如上配置后，再次打包已经能分别打包出不同的 html，并引入相应的 js 了。为了继续优化配置并验证打包的 js ，我们急需启用支持热更新的本地服务。
```bash
npm install --save-dev webpack-dev-server
```

```js
const webpack = require('webpack');
// ...
devServer: {
  inline: true, // 使用内联模式
  clientLogLevel: 'warning', //控制台消息提示
  open: true, //自动打开浏览器
  //contentBase: false, // 服务器静态文件目录，禁用，使用CopyWebpackPlugin
  compress: true, // gzip 压缩
  disableHostCheck: true,
  host: "0.0.0.0",
  port: 8080,
  useLocalIp: true, // 用本地的ip
  hot: true,  // 启动热更新
  overlay: {  // 出现错误时在浏览器中显示
    warnings: false,
    errors: true
  },
  proxy: {  // 代理配置
    // https://github.com/chimurai/http-proxy-middleware
    "/api": {
      target: "http://localhost:3000",
      // pathRewrite: {"^/api" : ""},  //改写请求地址,/api/xxx直接写成/xxx
      // secure: false,  // 支持https
    }
  }
},
plugins: [
  //...
  new webpack.HotModuleReplacementPlugin(),
],
```
增加配置后，我们需要在 package.json 里增加 dev 命令
```bash
"scripts": {
  "dev": "cross-env NODE_ENV=development webpack-dev-server --progress",
    "build": "cross-env NODE_ENV=production webpack"
},
```
其中 --progress 代表将运行进度输出到控制台。
配置完成后，执行 npm run dev 命令，就会自动开启本地服务，并打开浏览器。此时，我们就可以进入我们的 html 页面，来实时查看更改。

<!-- ### 5.optimization
如果每个页面的入口都引入了同一 js 如 jq ，运行 build 命令，就会将 jq 分别打包进入入口文件，这样极大的增加了 js 的体积，这肯定不是我们所希望的。

webpack 的一大功能就是优化代码，包括提取重复代码，压缩等。这也是 4.x 与之前版本配置差别较大的地方
```js
optimization: {   //新版替换webpack.optimize.CommonsChunkPlugin，提取公共模块
  splitChunks: {
    cacheGroups: {
      commons: {
        name: 'commons', // 重复代码打包到vender，和库放在一起
        chunks: 'all',
        minChunks: 2
      }
    }
  },
  minimize: true  //新版替换webpack.optimize.UglifyJsPlugin 压缩代码
}
```
这样再次 build，会将重复代码打包入 commons.js 文件中。同时，我们需要修改 html-webpack-plugin 的配置，在 chunk 中除了引入当前入口 js ，还要增加 commons

再次 build，dist/js 中会增加 commons.js ,且文件夹的总体积明显减小。同时，打包出的html也需要引入了本身的入口和 commons。

```js
const htmlPluginArr = ()=>{
  //...
  const baseOption = {
    //...
    chunks: [filename,'commons'],
  }
}
``` -->
### 5.css相关
html 和 js 已经基本配置完成，现在需要对 css 进行配置。
这一部分按照的包会比较多，但是配置都较为简单。
```bash
 npm install --save-dev node-sass sass-loader css-loader style-loader postcss-loader autoprefixer postcss-import  postcss-url mini-css-extract-plugin
```
注意: mini-css-extract-plugin 用于 css 文件的提取。在 4.x 之前的版本一般使用 extract-text-webpack-plugin ，在4.x后如果要继续使用需要安装最新板 extract-text-webpack-plugin@next

其中每一个包的功能会在文章最后简单描述
```js
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// ...
module.exports = {
  // ...
  plugins: [
    // ...
    new MiniCssExtractPlugin({
      filename: `static/style/${devMode ? '[name].css' : '[name].[hash].css'}`,
      chunkFilename: `static/style/${devMode ? '[name].css' : '[name].[hash].css'}`,
    })
  ],
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      }
    ]
  },
}
```
这里有必要提一下 loader。rules 中 使用 use 数组来声明加载满足 test 正则的文件。其中 loader 是从右向左运行的，运行的结果会传给下一个 loader。

所以上面配置的意思就是读取 .sass/scss/css 文件，顺序是 sass-loader -> postcss-loader -> css-loader。

由于 mini-css-extract-plugin 提取 css 文件只能用于生产环境，所以最后依据当前环境来判断是使用 style-loader 还是 MiniCssExtractPlugin.loader.

由于使用了 postcss ，我们必须要对其进行配置，来满足 css 的浏览器兼容性。
postcss 也是可以通过配置文件的形式进行配置的。

在根目录新建 .postcssrc.js 文件
```js
// .postcssrc.js
module.exports = {
  // https://github.com/michael-ciniawsky/postcss-load-config
  "plugins": {
    "postcss-import": {},
    "postcss-url": {},
    // to edit target browsers: use "browserslist" field in package.json
    "autoprefixer": {}
  }
}
```
具体配置可以查看 postcss 的文档。

在每个入口 js 文件中引入同一目录下的 scss 文件，再次build
```
|-- dist
    |-- static
        |-- js
          |-- home.xxxxx.js  // home/index.js打包，并加入了hsah
          |-- user.xxxxx.js
        |-- style
          |-- home.xxxxx.css // home/index.scss打包，并加入了hsah
          |-- user.xxxxx.css
    |-- home.html
    |-- user.html
```
### 5.其他loader
webpack 本身只能打包 js 文件。所以，如上面的 css/scss 文件等其他文件，就需要对应的 loader 去加载使其资源转化。除了 css 文件，我们还需要对字体文件，图片等资源进行加载。并且，为了代码的质量，我们需要使用 eslint 对代码进行规范;为了使用 es6 开发，需要 babel 对代码进行兼容处理。这两个需求都需要用 loader 加载并处理 js 文件。

#### babel
关于[babel配置](https://babel.docschina.org/setup#installation)，官网非常的详细。

在 7.x 版本中所有 stage-x presets 已弃用，所有就不在使用次类规范了。
```bash
npm install --save-dev babel-loader @babel/core @babel/preset-env
// 如果需要 polyfill
npm install --save @babel/polyfill
```

```js
module: {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader"
    }
  ]
}
```
关于配置的详细描述的一篇文章 [《你真的会用 Babel 吗?》](https://segmentfault.com/a/1190000011155061)
```js
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": { // 配支持的环境
          "browsers": ["> 1%", "last 2 versions", "not ie <= 8"],
          "node": "current"
        },
        "modules": false,  //设置ES6 模块转译的模块格式 默认是 commonjs
        "debug": false, // debug，编译的时候 console
        "useBuiltIns": "entry", // 是否开启自动支持 polyfill
        "include": [], // 总是启用哪些 plugins
        "exclude": []  // 强制不启用哪些 plugins，用来防止某些插件被启用
      }
    ],
  ],
}
```

#### eslint
以 airbnb 标准为例。
```bash
npm install --save-dev eslint eslint-config-airbnb-base eslint-loader eslint-plugin-import eslint-friendly-formatter babel-eslint eslint-plugin-html
```

```js
module: {
    rules: [
      // ...
      {
        enforce: 'pre', // 先使用此 loader 加载 js
        test: /\.js$/,
        exclude: /node_modules/,  // 第三方库中的代码不进行规范检测
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter'),  // 在终端上显示错误
        }
      },
    ]
  },
```
与 postcss 类似, eslint 也需要单独的配置。

.eslintignore 文件声明了不进行规范检测的部分
```
/build/
/config/
/dist/
/*.js
```

.eslintrc.js 文件定义了检测的规范。

```js
module.exports = {
	root: true,
  parserOptions: {
    parser: 'babel-eslint'  // babel 处理后的代码的eslint处理
  },
  env: {
    browser: true,
  },
	extends: 'airbnb-base',   // 所用的规范
	globals: {    // 可以使用的为在当前 js 内声明的变量
		document: true,
		navigator: true,
		window:true,
		node:true
	},
	plugins: [  // 对 html 文件的规则处理
		'html'
	],
	rules: {    // 除了规预设范外的自定义规则
		'import/extensions': ['error', 'always', {
				js: 'never',
		}],
		'max-len': ['error', {
			code: 9999,
			tabWidth: 2
		}]
	}
};
```
由于 devServer.overlay 的设置，使得 eslint-friendly-formatter 在终端上显示的 error 级别错误出现在了浏览器上，warning 级别错误出现在了浏览器的控制台里，这样更明显的提示了代码的不规范。

#### 图片字体等资源
对图片，字体等资源进行处理，包括图片压缩，小图片转 base64

```bash
npm install --save-dev url-loader file-loader image-webpack-loader
```

```js
modules: {
  rules: [
    // ...
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
}
```
运行 build ，小图片字体会直接转成 bsae64 ，其他的则分别进入 dist/static 下的 images 或 fonts 下

### 6. resolve
有时引入其他路径下的文件时，相对路径比较复杂。resolve 配置直接解决了这点，让我们更方便的引入。
```js
module.exports = {
  //...
  resolve: {
    extensions: ['.js', '.json'], // 引入时可以省略相应的扩展名
    alias: {
      '@': path.resolve(__dirname, './src') // 使用 @ 代替了 src 文件夹
    }
  },
}
```
如果使用了 eslint ，此配置会和 eslint 相冲突。为了解决这个问题，我们需要安装 eslint 的一个插件
```bash
npm install --save-dev eslint-import-resolver-webpack
```
然后在 .eslintrc.js 文件中增加 settings
```js
module.exports = {
	// ...
	plugins: [
		'html'
	],
	settings: {
    'import/resolver': {
      webpack: { config: 'webpack.config.js' } // 含有resolve的配置文件所在位置
		}
  },
	rules: {
		//...
	}
};
```
这样，我们在引入 src 下的文件时，就可以使用 @ 代替一部分相对路径
```js
// old
import '../../public/aaa.js'
// new
import '@/public/aaa'
```
### 7.常用插件
很多时候我们需要一个静态目录，目录中的内容不经过 webpack 处理。使用 copy-webpack-plugin 将静态文件中的内容完全复制到我们的 dist 下。
```bash
npm install --save-dev copy-webpack-plugin
```

```js
plugins: [
  //...
  new CopyWebpackPlugin([
    {
      from: path.resolve(__dirname, './static'),
      to: 'static',
      ignore: ['.*']
    }
  ]),
  new webpack.DefinePlugin({ // 在js中可直接使用的全局变量
    'process.env.NODE_ENV': devMode ? 'development' : 'production',
  }),
]
```
配置基本完成，build 和 dev 基本功能有了。

##  四.optimization (优化)
webpack 最重要的功能就是对代码就行优化。4.x 版本新增加了 optimization 配置，以前很多需要插件完成的事现在 webpack 独立就能完成。

### 1.css 优化
每个入口都引入了当前页面的 css 和公用 css (入 reset.css)。如果按照当前配置 build ，会出现多个 css 文件，并且每个 css 中都包含了 reset.css。

所以，我们需要 1.css 文件合并；2.提取公共 css。

需要使用 optimize-css-assets-webpack-plugin 和 cssnano，来完成 压缩，合并，去重。
```bash
npm install --save-dev optimize-css-assets-webpack-plugin cssnano
```
首选，我们通过 optimization 的 splitChunks 提取公共模块。然后使用 optimize-css-assets-webpack-plugin 和 cssnano 对 css 进行优化。
```js
module.exports = {
  plugins: [
    new OptimizeCSSAssetsPlugin({
      // 参考 https://my.oschina.net/itlangz/blog/2986976
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
  ]
  // ...
  optimization: {
    splitChunks: {  //新版替换webpack.optimize.CommonsChunkPlugin，提取公共模块
      cacheGroups: {
        styles: {            
          name: 'styles',
          test: /\.scss|css$/,
          chunks: 'all',    // merge all the css chunk to one file
          enforce: true
        }
      }
    },
  },
}
```
最后，我们需要在 html-webpack-plugin 配置的需要引入的 chunk 数组中增加我们生成的 styles 的 chunk,这样打包后的 html 文件才会正常引入 styles。
```js
const htmlPluginArr = ()=>{
  const baseOption = {
    filename: `${filename}.html`, //目标文件
    template: filePath,
    chunks: [filename,'styles'],
  }
}
```
再次 build ，会将 css 打包成单个 styles.xxxx.css 文件。

### 2. js优化
js 代码出去每个入口独有的业务代码之外，还可以大致分为三部分：
1. manifest

* >webpack 的 runtime

```js
optimization: {
  runtimeChunk: {
    name: "manifest"
  },
},
```
将每个打包出来的js文件中的 webpack 相关代码提取成 mainfest 。

2. commons

* >公共代码

```js
optimization: {
  runtimeChunk: {
    name: "manifest"
  },
  splitChunks: {
    cacheGroups: {
      commons: {
        name: 'commons', // 重复代码打包到commons，和库放在一起
        chunks: 'initial',
        minChunks: 2,
        enforce:true
      },
      styles: {            
        name: 'styles',
        test: /\.scss|css$/,
        chunks: 'all',
        enforce: true
      }
    }
  },
},
```
将重复代码打包为 commons 。

3. vendor

* >node_modules 包
```js
optimization: {
  runtimeChunk: {
    name: "manifest"
  },
  splitChunks: {
    // ...
    vendors: {
      name: 'vendors',
      test: chunk => (
        chunk.resource &&
        /\.js$/.test(chunk.resource) &&
        /node_modules/.test(chunk.resource)
      ),
      chunks: 'initial',
    },
  },
},
```
## 五.分离开发配置与生产配置.
新建配置目录，将配置文件进行细分，删掉根目录下的 webpack.config.js
```
|-- rootDir
    |-- build
        |-- build.js  // 打包时删除 dist 目录
        |-- webpack.base.conf.js  // 公共配置
        |-- webpack.dev.conf.js   // 开发配置
        |-- webpack.prod.conf.js  // 生产配置
    |-- src
```
提取公共配置到 base 配置中，使用 webpack-merge 进行合并。

并在 build 开始前使用 rimraf 清空旧 dist 目录。

同时修改 npm 命令
```json
 "scripts": {
    "dev": "cross-env NODE_ENV=development webpack-dev-server --progress  --config build/webpack.dev.conf.js",
    "build": "cross-env NODE_ENV=production node build/build.js"
  },
```




##  六.常用npm包和其作用

<table>
  <caption>webpack基本</caption>
  <tbody>
    <tr>
      <td>webpack</td>
      <td></td>
    </tr>
    <tr>
      <td>webpack-cli</td>
      <td>可以通过cli使用webpack</td>
    </tr>
    <tr>
      <td>webpack-dev-server</td>
      <td>用于开启本地服务，代理，热更新</td>
    </tr>
    <tr>
      <td>webpack-dev-server</td>
      <td>用于合并 webpack 配置</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>文件相关</caption>
  <tbody>
    <tr>
      <td>file-loader</td>
      <td>加载目录下的文件</td>
    </tr>
    <tr>
      <td>url-loader</td>
      <td>小图片转成base64</td>
    </tr>
    <tr>
      <td>image-webpack-loader</td>
      <td>图片压缩</td>
    </tr>
    <tr>
      <td>copy-webpack-plugin</td>
      <td>复制文件到制定目录</td>
    </tr>
    <tr>
      <td>html-webpack-plugin</td>
      <td>自动生成html并引入css,js</td>
    </tr>
    <tr>
      <td>html-loader</td>
      <td>html片段复用</td>
    </tr>
    <tr>
      <td>rimraf</td>
      <td>删除文件</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>css相关</caption>
  <tbody>
    <tr>
      <td>css-loader</td>
      <td>加载css</td>
    </tr>
    <tr>
      <td>sass-loader</td>
      <td>加载sass</td>
    </tr>
    <tr>
      <td>node-sass</td>
      <td>使用sass-loader的依赖</td>
    </tr>
    <tr>
      <td>style-loader</td>
      <td>支持把js里引入的css以style标签形式写入html的head</td>
    </tr>
    <tr>
      <td>postcss-loader</td>
      <td>补全css浏览器前缀</td>
    </tr>
    <tr>
      <td>autoprefixer</td>
      <td>补全css浏览器前缀所需的插件</td>
    </tr>
    <tr>
      <td>postcss-import</td>
      <td>解决@import引入路径问提</td>
    </tr>
    <tr>
      <td>postcss-url</td>
      <td>把css中路径改为打包后路径</td>
    </tr>
    <tr>
      <td>mini-css-extract-plugin</td>
      <td>把css提取成.css文件</td>
    </tr>
    <tr>
      <td>optimize-css-assets-webpack-plugin</td>
      <td>用于优化或者压缩CSS资源</td>
    </tr>
    <tr>
      <td>cssnano</td>
      <td>含优化css规则的包</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>eslint</caption>
  <tbody>
    <tr>
      <td>eslint</td>
      <td>eslint依赖</td>
    </tr>
    <tr>
      <td>eslint-config-airbnb-base</td>
      <td>airbnb规则</td>
    </tr>
    <tr>
      <td>eslint-loader</td>
      <td>使用eslint加载js</td>
    </tr>
    <tr>
      <td>eslint-plugin-import</td>
      <td>引入相关</td>
    </tr>
    <tr>
      <td>eslint-friendly-formatter</td>
      <td>终端错误提示</td>
    </tr>
    <tr>
      <td>eslint-plugin-html</td>
      <td>eslint的html相关插件</td>
    </tr>
    <tr>
      <td>babel-eslint</td>
      <td>eslint对babel的支持</td>
    </tr>
    <tr>
      <td>eslint-import-resolver-webpack</td>
      <td>解决和webpack中resolve的冲突</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>babel</caption>
  <tbody>
    <tr>
      <td>@babel/core</td>
      <td>babel依赖</td>
    </tr>
    <tr>
      <td>babel-loader</td>
      <td>使用babel加载js</td>
    </tr>
    <tr>
      <td>@babel/preset-env</td>
      <td>preset是规范的总结 env是es2015，es2016,es2017的集合</td>
    </tr>
    <tr>
      <td>@babel/polyfill</td>
      <td>垫片，用于js兼容性</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>typescript</caption>
  <tbody>
    <tr>
      <td>ts-loader</td>
      <td>加载ts文件</td>
    </tr>
    <tr>
      <td>typescript</td>
      <td>ts依赖</td>
    </tr>
  </tbody>
</table>
