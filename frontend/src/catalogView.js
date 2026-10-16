import { datasetPodRoots, podNameFromRoot } from "./catalogOrigin";
// Presentation-only queries over the already loaded catalog. Never fetch sources here.
export const normalizeSearch = (value) => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/ß/g, "ss");

export const datasetKey = (dataset) => dataset.datasetUrl || dataset.identifier;
export const datasetThemes = (dataset) => String(dataset.theme || "")
  .split(/[,;|]/).map((value) => value.trim()).filter(Boolean);

export function themeLabel(value) {
  try {
    const url = new URL(value);
    return decodeURIComponent(url.hash.slice(1) || url.pathname.split("/").filter(Boolean).pop() || value);
  } catch { return value; }
}

export function accessState(dataset) {
  if (dataset.datasetType === "series") return "series";
  if (dataset.is_public) return "public";
  return dataset.userHasAccess ? "available" : "restricted";
}

export function selectCatalogDatasets(datasets, { query = "", theme = "", publisher = "", type = "", access = "", pod = "", sort = "relevance" } = {}) {
  const words = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  const result = [];
  datasets.forEach((dataset, index) => {
    if (theme && !datasetThemes(dataset).includes(theme)) return;
    if (publisher && dataset.publisher !== publisher) return;
    if (pod && !datasetPodRoots(dataset).includes(pod)) return;
    if (type && (dataset.datasetType || "dataset") !== type) return;
    if (access && accessState(dataset) !== access) return;
    const fields = [dataset.title, dataset.identifier, dataset.theme, dataset.publisher, dataset.description, dataset.file_format].map(normalizeSearch);
    if (!words.every((word) => fields.some((field) => field.includes(word)))) return;
    const score = words.reduce((total, word) => total + fields.reduce((sum, field, i) => sum + (field.includes(word) ? [10, 6, 4, 3, 1, 1][i] : 0), 0), 0);
    result.push({ dataset, index, score });
  });
  const timestamp = (value) => Date.parse(value) || 0;
  result.sort((a, b) => {
    if (sort === "modified") return timestamp(b.dataset.modified) - timestamp(a.dataset.modified) || a.index - b.index;
    if (sort === "title") return String(a.dataset.title || "").localeCompare(String(b.dataset.title || "")) || a.index - b.index;
    return b.score - a.score || a.index - b.index;
  });
  return result.map(({ dataset }) => dataset);
}

// Preserve original text, including accents, while finding normalized matches.
export function highlightParts(value, query) {
  const text = String(value || "");
  const words = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [{ text, match: false }];
  let normalized = "";
  const positions = [];
  let offset = 0;
  for (const character of text) {
    const normalizedCharacter = normalizeSearch(character);
    for (let i = 0; i < normalizedCharacter.length; i++) positions.push([offset, offset + character.length]);
    normalized += normalizedCharacter;
    offset += character.length;
  }
  const marked = new Array(text.length).fill(false);
  words.forEach((word) => {
    let start = normalized.indexOf(word);
    while (start !== -1) {
      const end = positions[start + word.length - 1]?.[1];
      for (let i = positions[start]?.[0]; i < end; i++) marked[i] = true;
      start = normalized.indexOf(word, start + word.length);
    }
  });
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    if (!parts.length || parts[parts.length - 1].match !== marked[i]) parts.push({ text: "", match: marked[i] });
    parts[parts.length - 1].text += text[i];
  }
  return parts;
}

// Display only the Pod name; a WebID is an identifier, not a label or a link here.
export function podNameFromWebId(webId) {
  try {
    const url = new URL(webId);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const segments = url.pathname.split("/").filter(Boolean);
    const profile = segments.indexOf("profile");
    const name = profile >= 0 ? segments.slice(0, profile).pop() : segments.slice(0, -1).pop();
    return decodeURIComponent(name || url.hostname.split(".")[0]);
  } catch { return ""; }
}


// Use confirmed storage/catalog provenance, never the creator WebID.
export function catalogPodOptions(datasets) {
  const pods = [...new Set(datasets.flatMap(datasetPodRoots))]
    .map(value => ({ value, label: podNameFromRoot(value) }))
    .filter(({ label }) => label);
  const counts = new Map();
  pods.forEach(({ label }) => counts.set(label, (counts.get(label) || 0) + 1));
  return pods.map(({ value, label }) => ({ value,
    label: counts.get(label) > 1 ? `${label} (${new URL(value).host})` : label,
  })).sort((a, b) => a.label.localeCompare(b.label) || a.value.localeCompare(b.value));
}
