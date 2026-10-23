const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const babel = require("@rollup/plugin-babel");
const postcss = require("rollup-plugin-postcss");

const extensions = [".js", ".jsx"];
const external = (id) =>
  id === "react" ||
  id === "react-dom" ||
  id === "react-router-dom" ||
  id === "axios" ||
  id === "n3" ||
  id === "vis-network" ||
  id.startsWith("@inrupt/");

const createPlugins = ({ css = false } = {}) => [
    resolve({ extensions }),
    ...(css
      ? [
          postcss({
            extract: "embed.css",
            minimize: false,
          }),
        ]
      : []),
    babel({
      babelHelpers: "bundled",
      extensions,
      presets: [
        ["@babel/preset-env", { targets: { esmodules: true } }],
        ["@babel/preset-react", { runtime: "classic" }],
      ],
    }),
    commonjs({ include: /node_modules/ }),
];

const library = ({ input, directory, css = false }) => ({
  input,
  output: [
    {
      file: `dist/${directory}/index.js`,
      format: "es",
      sourcemap: true,
    },
    {
      file: `dist/${directory}/index.cjs`,
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  ],
  external,
  plugins: createPlugins({ css }),
});

module.exports = [
  library({ input: "src/embed/index.js", directory: "embed", css: true }),
  library({ input: "src/catalog-api/index.js", directory: "catalog-api" }),
];
