import { Parser, Writer } from "n3";
import { solidDatasetAsTurtle } from "@inrupt/solid-client";

const serialize = (quads) => new Promise((resolve, reject) => {
  const writer = new Writer({ format: "N-Triples" });
  writer.addQuads(quads);
  writer.end((error, text) => error ? reject(error) : resolve(text));
});
const key = (quad) => JSON.stringify([quad.subject, quad.predicate, quad.object].map((term) =>
  [term.termType, term.value, term.language, term.datatype?.value]));

// Use one parser's blank-node scope for both snapshots. Unchanged blank nodes
// stay untouched; edited blank-node components need an explicit migration.
export async function buildMetadataPatch(previous, next, url) {
  const parse = (text) => new Parser({ baseIRI: url, blankNodePrefix: "" }).parse(text);
  const before = parse(previous);
  const after = parse(next);
  const oldKeys = new Set(before.map(key));
  const newKeys = new Set(after.map(key));
  const removed = before.filter((quad) => !newKeys.has(key(quad)));
  const added = after.filter((quad) => !oldKeys.has(key(quad)));
  if (!removed.length && !added.length) return "";
  if ([...removed, ...added].some((quad) => [quad.subject, quad.object].some((term) => term.termType === "BlankNode"))) {
    throw new Error("This metadata update changes blank nodes. Preserve their descriptions or assign stable IRIs before editing.");
  }
  const deletes = await serialize(removed);
  const inserts = await serialize(added);
  // Omit absent operations: CSS/N3 versions can treat an empty formula as
  // the default graph and then reject the patch's own blank-node subject.
  const operations = [];
  if (removed.length) operations.push(`solid:where { ${deletes} }`, `solid:deletes { ${deletes} }`);
  if (added.length) operations.push(`solid:inserts { ${inserts} }`);
  return `@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n_:patch a solid:InsertDeletePatch;\n ${operations.join(";\n ")}.\n`;
}

export async function writeMetadataTurtle(url, previous, next, fetch, { etag = "" } = {}) {
  let response;
  if (previous === null) {
    const target = new URL(url);
    const slug = target.pathname.slice(target.pathname.lastIndexOf("/") + 1);
    response = await fetch(new URL("./", target).href, {
      method: "POST", headers: { "Content-Type": "text/turtle", Slug: slug },
      body: next, redirect: "error",
    });
    if (response.ok) {
      const location = response.headers?.get?.("Location");
      if (!location || new URL(location, url).href !== target.href) {
        const error = new Error("The Pod did not create the requested metadata URL. Its Location must match the stable dataset identifier.");
        throw error;
      }
    }
  } else {
    const body = await buildMetadataPatch(previous, next, url);
    if (!body) return { ok: true, status: 204, url };
    response = await fetch(url, {
      method: "PATCH", headers: { "Content-Type": "text/n3", ...(etag ? { "If-Match": etag } : {}) },
      body, redirect: "error",
    });
  }
  if (!response.ok) {
    const error = new Error(`Metadata write failed (${response.status}): ${url}`);
    error.status = response.status;
    throw error;
  }
  return response;
}

export async function saveProfileDocument(url, previous, next, fetch) {
  return writeMetadataTurtle(url,
    previous ? await solidDatasetAsTurtle(previous) : null,
    await solidDatasetAsTurtle(next), fetch);
}

export function profileDistributions(input) {
  if (input.distributions != null && !Array.isArray(input.distributions)) throw new Error("Distributions must be an array.");
  const supplied = Array.isArray(input.distributions) && input.distributions.length ? input.distributions : [{
    url: "", downloadURL: input.distribution_access_type === "access" ? "" : input.access_url_dataset,
    accessURL: input.distribution_access_type === "access" ? input.access_url_dataset : "",
    mediaType: input.file_format,
    conformsTo: input.semanticModels?.length ? input.semanticModels : [input.access_url_semantic_model].filter(Boolean),
  }];
  return supplied.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Each distribution must be an object.");
    const current = { ...item };
    if (index === 0 && input.distributions?.length && Object.hasOwn(input, "access_url_dataset")) {
      current.downloadURL = input.distribution_access_type === "access" ? "" : input.access_url_dataset;
      current.accessURL = input.distribution_access_type === "access" ? input.access_url_dataset : current.accessURL;
      current.mediaType = input.file_format || current.mediaType;
      if (Object.hasOwn(input, "access_url_semantic_model")) {
        current.conformsTo = [input.access_url_semantic_model, ...(current.conformsTo || []).slice(1)].filter(Boolean);
      }
    }
    if (current.conformsTo != null && !Array.isArray(current.conformsTo)) throw new Error("Model/schema references must be an array of IRIs.");
    return { ...current, conformsTo: [...new Set(current.conformsTo || [])] };
  });
}

export function assertProfileDistributions(distributions) {
  const absoluteIri = (value) => {
    try { return Boolean(typeof value === "string" && value && new URL(value).protocol && !/[<>"{}|^`\\\s]/.test(value)); } catch { return false; }
  };
  if (!Array.isArray(distributions) || !distributions.length) throw new Error("At least one distribution is required.");
  for (const distribution of distributions) {
    if (!absoluteIri(distribution.downloadURL) || !/^https?:/.test(distribution.downloadURL)) {
      throw new Error("A direct HTTP(S) download URL is required; an access or landing-page link alone does not satisfy the Solid DCAT Profile.");
    }
    if (typeof distribution.mediaType !== "string" || !distribution.mediaType.trim()) throw new Error("A media type is required for every distribution.");
    if (!Array.isArray(distribution.conformsTo) || !distribution.conformsTo.length || distribution.conformsTo.some((url) => !absoluteIri(url))) {
      throw new Error("A model or schema IRI is required for every distribution.");
    }
  }
}
