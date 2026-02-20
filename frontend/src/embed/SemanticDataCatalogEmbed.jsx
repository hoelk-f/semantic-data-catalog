import React from "react";
import "./embed.css";
import App from "../App";

export default function SemanticDataCatalogEmbed({ webId }) {
  return <App embedded webIdOverride={webId} />;
}
