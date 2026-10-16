import { Parser } from "n3";

const formats = {
  ttl: ["Turtle / RDF", "text/turtle"], n3: ["N3 / RDF", "text/n3"],
  nt: ["N-Triples / RDF", "application/n-triples"], nq: ["N-Quads / RDF", "application/n-quads"],
  trig: ["TriG / RDF", "application/trig"], rdf: ["RDF/XML", "application/rdf+xml"],
  owl: ["RDF/XML", "application/rdf+xml"], jsonld: ["JSON-LD", "application/ld+json"],
  json: ["JSON", "application/json"], pdf: ["PDF", "application/pdf"],
  html: ["HTML", "text/html"], htm: ["HTML", "text/html"],
  xml: ["XML", "application/xml"], yaml: ["YAML", "application/yaml"], yml: ["YAML", "application/yaml"],
};
const rdfTypes = new Set(["text/turtle", "application/x-turtle", "text/n3", "application/n-triples", "application/n-quads", "application/trig"]);

export function describeModelReference(url, { contentType = "", text = "" } = {}) {
  let extension = "";
  try { extension = new URL(url).pathname.split("/").pop().split(".").slice(1).pop()?.toLowerCase() || ""; } catch { /* Unknown reference. */ }
  let mime = contentType.split(";")[0].trim().toLowerCase();
  if (!mime || ["text/plain", "application/octet-stream"].includes(mime)) mime = formats[extension]?.[1] || "";
  let format = Object.values(formats).find((entry) => entry[1] === mime)?.[0] || mime || "Not specified";
  let content = "Content: Model, schema or specification";
  let code = formats[extension] ? extension.toUpperCase() : "REF";
  let action = "open";
  if (rdfTypes.has(mime) || ["application/rdf+xml", "application/ld+json"].includes(mime)) {
    content = "Content: RDF model"; action = "download"; code = "RDF";
    if (mime === "application/x-turtle") format = "Turtle / RDF";
  } else if (["application/json", "application/schema+json"].includes(mime)) {
    code = "JSON"; format = "JSON"; action = "download";
    if (mime === "application/schema+json") content = "Content: JSON Schema";
  } else if (mime === "application/pdf" || mime === "text/html") {
    content = "Content: Specification / documentation"; code = mime === "application/pdf" ? "PDF" : "WEB";
    action = mime === "application/pdf" ? "download" : "open";
  } else if (mime && mime !== "Not specified") action = "download";
  if (text) {
    try {
      const value = JSON.parse(text);
      format = "JSON"; code = "JSON"; action = "download"; mime = "application/json";
      content = "Content: Model, schema or specification";
      if (value && !Array.isArray(value) && typeof value.$schema === "string" && /^https?:\/\/(www\.)?json-schema\.org\//i.test(value.$schema)) content = "Content: JSON Schema";
      else if (value && !Array.isArray(value) && value["@context"]) {
        format = "JSON-LD"; mime = "application/ld+json"; content = "Content: RDF model";
      }
    } catch { /* A non-JSON reference retains its advertised format. */ }
  }
  return { content, format, code, action, mime };
}

export function parseReferenceTriples(text, url, mime) {
  if (mime && !rdfTypes.has(mime)) return [];
  try {
    // Parse the complete document before showing a graph; partial RDF is not enough.
    return new Parser({ baseIRI: url, ...(mime ? { format: mime } : {}) }).parse(text)
      .filter((q) => q.subject.value && q.predicate.value && q.object.value)
      .map((q) => ({ subject: q.subject.value, predicate: q.predicate.value, object: q.object.value, fullPredicate: q.predicate.value }));
  } catch { return []; }
}
