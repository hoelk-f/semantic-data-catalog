import React from "react";
import StandaloneFooter from "../standalone/StandaloneFooter";
import { appVersion } from "../version";
import { useI18n } from "../i18n";
export default function FooterBar() {
  const { language } = useI18n();
  return <StandaloneFooter title="Semantic Data Catalog" version={appVersion} language={language} assetsBase={process.env.PUBLIC_URL || ""} />;
}
