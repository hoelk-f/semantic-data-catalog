import React from "react";
import "./embed.css";
import App from "../App";

export default function SemanticDataCatalogEmbed({ webId, language, statisticsConfig, datasetUrl, onSemanticSearch }) {
  return (
    <App
      embedded
      webIdOverride={webId}
      datasetUrl={datasetUrl}
      onSemanticSearch={onSemanticSearch}
      language={language}
      statisticsConfig={statisticsConfig}
    />
  );
}
