import { DATA_SERVICE, validateServiceRecord } from "./apiService";
import { Parser, Store } from "n3";

// Normative MUST rules in SolidDCAT-Profile/index.html. This runs in the
// standalone app, embedded catalog and catalog-api package, without an API
// dependency. Reading legacy catalogs deliberately does not use this guard.
const DCAT = "http://www.w3.org/ns/dcat#";
const DCT = "http://purl.org/dc/terms/";
const TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const TOPIC = "http://xmlns.com/foaf/0.1/primaryTopic";
const documentUrl = url => url.split("#")[0];
const objects = (store, subject, predicate) => store.getObjects(subject, predicate, null);
const typed = (store, subject, type) => store.countQuads(subject, TYPE, type, null) > 0;
const dataset = (store, subject) => typed(store, subject, DCAT + "Dataset") || typed(store, subject, DCAT + "DatasetSeries");
const iri = value => value?.termType === "NamedNode" && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value.value) && !/[<>"{}|^`\\\s]/.test(value.value);
const local = (value, url) => iri(value) && value.value.startsWith(url + "#") && value.value.length > url.length + 1;
const unique = terms => [...new Map(terms.map(term => [term.id, term])).values()];

export class ProfileValidationError extends Error {
  constructor(message) {
    super(`Solid DCAT Profile: ${message}`);
    this.name = "ProfileValidationError";
    this.code = "profile-nonconformant";
  }
}
const requireRule = (condition, message) => { if (!condition) throw new ProfileValidationError(message); };

function parseRecord(url, turtle) {
  requireRule(typeof turtle === "string", "Metadata must be supplied as Turtle.");
  let store;
  try { store = new Store(new Parser({ baseIRI: url, format: "Turtle" }).parse(turtle)); }
  catch { throw new ProfileValidationError(`Invalid Turtle metadata: ${url}`); }
  requireRule(store.size <= 200000, "Metadata validation exceeds 200000 triples.");
  requireRule(typed(store, url, DCAT + "CatalogRecord"), `The document must be a CatalogRecord: ${url}`);
  const records = store.getSubjects(TYPE, DCAT + "CatalogRecord", null);
  requireRule(records.length === 1 && records[0].value === url, "A CatalogRecord must identify its own document without a fragment.");
  const topics = objects(store, url, TOPIC);
  requireRule(topics.length === 1 && local(topics[0], url) && (dataset(store, topics[0]) || typed(store, topics[0], DATA_SERVICE)),
    "foaf:primaryTopic must identify exactly one typed Dataset/Series secondary resource of this record document.");
  const topic = topics[0];
  if (typed(store, topic, DATA_SERVICE)) return validateServiceRecord(store, url, topic);
  const datasets = unique([...store.getSubjects(TYPE, DCAT + "Dataset", null), ...store.getSubjects(TYPE, DCAT + "DatasetSeries", null)]);
  requireRule(datasets.length === 1 && datasets[0].equals(topic), "Each record document must describe exactly its primary Dataset/Series.");
  const distributions = objects(store, topic, DCAT + "distribution");
  requireRule(distributions.length > 0, "At least one distribution is required.");
  for (const distribution of distributions) {
    requireRule(local(distribution, url) && typed(store, distribution, DCAT + "Distribution"),
      "Every distribution must be a typed secondary resource of the same record document.");
    const downloads = objects(store, distribution, DCAT + "downloadURL");
    requireRule(downloads.length === 1 && iri(downloads[0]), "Every distribution needs exactly one direct downloadURL IRI.");
    const media = objects(store, distribution, DCAT + "mediaType");
    requireRule(media.length === 1 && (media[0].termType === "Literal" || iri(media[0])) && media[0].value.trim(),
      "Every distribution needs exactly one nonempty mediaType.");
    const models = objects(store, distribution, DCT + "conformsTo");
    requireRule(models.length > 0 && models.every(iri), "Every distribution needs at least one model or schema IRI via conformsTo.");
  }
  for (const distribution of store.getSubjects(TYPE, DCAT + "Distribution", null)) {
    requireRule(local(distribution, url) && distributions.some(value => value.equals(distribution)),
      "Every Distribution must belong to the record's primary Dataset/Series.");
  }
  const dependencies = [];
  for (const [predicate, type] of [["inSeries", "DatasetSeries"], ["seriesMember", "Dataset"]]) {
    const targets = objects(store, topic, DCAT + predicate);
    requireRule(targets.every(iri), `dcat:${predicate} must link metadata by absolute IRI.`);
    // seriesMember is meaningful only on DatasetSeries; reject accidental links
    // here instead of silently publishing unchecked nested metadata.
    if (targets.length && predicate === "seriesMember") requireRule(typed(store, topic, DCAT + "DatasetSeries"), "Only DatasetSeries may declare series members.");
    dependencies.push(...targets.map(target => ({ url: target.value, type })));
  }
  return { store, topic, dependencies };
}

export async function assertProfileRecord({ url, turtle }, fetch) {
  const root = documentUrl(url);
  const pending = [root];
  const documents = new Map([[root, turtle]]);
  const parsed = new Map();
  let bytes = 0;
  let triples = 0;
  while (pending.length) {
    const current = pending.pop();
    if (parsed.has(current)) continue;
    requireRule(parsed.size < 256, "Metadata validation exceeds 256 documents.");
    if (!documents.has(current)) {
      requireRule(/^https?:\/\//.test(current) && typeof fetch === "function", `Linked metadata is unavailable: ${current}`);
      const response = await fetch(current, { headers: { Accept: "text/turtle" }, redirect: "error", cache: "no-store" });
      requireRule(response.ok, `Cannot validate linked metadata (${response.status}): ${current}`);
      const length = Number(response.headers?.get?.("Content-Length"));
      requireRule(!length || bytes + length <= 16000000, "Metadata validation exceeds 16 MB.");
      documents.set(current, await response.text());
    }
    const source = documents.get(current);
    bytes += new TextEncoder().encode(source).length;
    requireRule(bytes <= 16000000, "Metadata validation exceeds 16 MB.");
    const record = parseRecord(current, source);
    parsed.set(current, record);
    triples += record.store.size;
    requireRule(triples <= 200000, "Metadata validation exceeds 200000 triples.");
    record.dependencies.forEach(dependency => pending.push(documentUrl(dependency.url)));
  }
  for (const record of parsed.values()) {
    for (const reference of record.dependencies) {
      const target = parsed.get(documentUrl(reference.url));
      requireRule(target?.topic.value === reference.url && (reference.type === "Dataset" ? dataset(target.store, reference.url) : typed(target.store, reference.url, DCAT + reference.type)),
        `Linked ${reference.type} must be a conformant record's primary topic: ${reference.url}`);
    }
  }
  return { datasetUrl: parsed.get(root).topic.value, recordUrl: root, validatedDocuments: [...parsed.keys()] };
}

export async function assertProfileCatalogAddition(datasetUrl, fetch) {
  const url = documentUrl(datasetUrl);
  const response = await fetch(url, { headers: { Accept: "text/turtle" }, redirect: "error", cache: "no-store" });
  requireRule(response.ok, `Cannot validate the record before linking it (${response.status}): ${url}`);
  const result = await assertProfileRecord({ url, turtle: await response.text() }, fetch);
  requireRule(result.datasetUrl === datasetUrl, "The catalog must link the record's actual primary Dataset/Series.");
  return result;
}
