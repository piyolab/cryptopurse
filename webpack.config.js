
module.exports = {
  mode: "production",
  entry: {
    main: "./src/main.js",
    eth: "./src/eth.js"
  },
  output: {
    filename: "[name].js"
  }
}