module.exports = {
  mode: "production",
  entry: {
    main: "./src/js/main.js",
    eth: "./src/js/eth.js"
  },
  output: {
    filename: "[name].js"
  }
}