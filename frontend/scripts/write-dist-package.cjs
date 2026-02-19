const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");
const distDir = path.join(rootDir, "dist");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const distPkg = {
  name: pkg.name,
  version: pkg.version,
  main: "./embed/index.cjs",
  module: "./embed/index.js",
  exports: {
    "./embed": {
      import: "./embed/index.js",
      require: "./embed/index.cjs",
    },
    "./embed.css": "./embed/embed.css",
  },
  peerDependencies: pkg.peerDependencies || {
    react: "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
  },
  sideEffects: ["**/*.css"],
};

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(distPkg, null, 2));
