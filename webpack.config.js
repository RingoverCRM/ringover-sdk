const path = require("path");

module.exports = {
  entry: "./src/index.js", // Your main JS file
  output: {
    filename: "sdk.bundle.js", // Output file
    path: path.resolve(__dirname, "dist"), // Output directory
    library: "RingoverSDK", // Global variable name
    libraryTarget: "umd", // Universal Module Definition
    globalObject: "this", // For compatibility with both Node.js and browser
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  mode: "development", // Set to production mode for minification
};
