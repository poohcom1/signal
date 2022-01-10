module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: ["last 2 versions", "not ie > 0", "not ie_mob > 0"],
        },
      },
    ],
    "@babel/preset-typescript",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
  plugins: [
    "lodash",
    ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
    ["@babel/plugin-proposal-class-properties", { loose: false }],
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "@babel/plugin-proposal-optional-chaining",
    "babel-plugin-styled-components",
  ],
}
