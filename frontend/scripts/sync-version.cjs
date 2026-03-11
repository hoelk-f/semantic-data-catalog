const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");
const versionPath = path.join(rootDir, "src", "version.js");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const nextContent = `export const appVersion = "${pkg.version}";\n`;
const currentContent = fs.existsSync(versionPath)
  ? fs.readFileSync(versionPath, "utf8")
  : "";

if (currentContent !== nextContent) {
  fs.writeFileSync(versionPath, nextContent, "utf8");
}
