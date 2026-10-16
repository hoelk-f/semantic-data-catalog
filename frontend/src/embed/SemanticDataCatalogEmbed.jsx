import React from "react";
import "./embed.css";
import App from "../App";

export default function SemanticDataCatalogEmbed({ webId, language, statisticsConfig, datasetUrl }) {
  return (
    <App
      embedded
      webIdOverride={webId}
      datasetUrl={datasetUrl}
      language={language}
      statisticsConfig={statisticsConfig}
    />
  );
}
