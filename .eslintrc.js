module.exports = {
	root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
	extends: 'airbnb-base',   // 所用的规范
	globals: {    // 可以使用的为在当前 js 内声明的变量
		document: true,
		navigator: true,
		window:true,
		node:true
	},
	plugins: [  // 对 html 文件的规则处理
		'html'
	],
	settings: {
    'import/resolver': {
      webpack: { config: 'webpack.config.js' }
		}
  },
	rules: {    // 除了规预设范外的自定义规则
		'import/extensions': ['error', 'always', {
				js: 'never',
		}],
		'max-len': ['error', {
			code: 9999,
			tabWidth: 2
		}]
	}
};