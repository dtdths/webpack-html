// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  "plugins": {
    "postcss-import": {},
    "postcss-url": {},
    // to edit target browsers: use "browserslist" field in package.json
    "autoprefixer": {
      overrideBrowserslist: ["> 1%", "last 2 versions", "not ie <= 10"]
    }
  }
}
