module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  globals: {    // 可以使用的为在当前 js 内声明的变量
		document: true,
		window:true,
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
