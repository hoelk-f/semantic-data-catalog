const fs = require("fs");
const path = require("path");
const packageJson = require("../package.json");

const parseBoolean = (value) =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const runtimeConfig = {
  PUBLIC_CACHE_URL: process.env.PUBLIC_CACHE_URL || "",
  CATALOG_DEFAULT_REGISTRY: process.env.CATALOG_DEFAULT_REGISTRY || "",
  CATALOG_PERSONAL_VIEW_ENABLED: parseBoolean(process.env.CATALOG_PERSONAL_VIEW_ENABLED),
  REACT_APP_REDIRECT_URL: process.env.REACT_APP_REDIRECT_URL || "",
  REACT_APP_VERSION: process.env.REACT_APP_VERSION || packageJson.version,
  STATISTICS_ENABLED: parseBoolean(process.env.STATISTICS_ENABLED),
  STATISTICS_POD_BASE_URL: process.env.STATISTICS_POD_BASE_URL || "",
  STATISTICS_EVENTS_URL: process.env.STATISTICS_EVENTS_URL || "",
  STATISTICS_REGISTRY_CONTEXT: process.env.STATISTICS_REGISTRY_CONTEXT || "",
};

const output = `window._env_ = ${JSON.stringify(runtimeConfig, null, 2)};\n`;
const targets = [path.resolve(__dirname, "../public/env.js")];
const buildTarget = path.resolve(__dirname, "../build/env.js");
if (fs.existsSync(path.dirname(buildTarget))) {
  targets.push(buildTarget);
}

targets.forEach((target) => fs.writeFileSync(target, output, "utf8"));
