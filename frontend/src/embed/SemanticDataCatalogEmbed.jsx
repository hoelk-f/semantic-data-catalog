import React from "react";
import App from "../App";

export default function SemanticDataCatalogEmbed({ webId }) {
  return <App embedded webIdOverride={webId} />;
}
