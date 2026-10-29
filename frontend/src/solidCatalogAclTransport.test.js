/** @jest-environment node */
import { ensurePublicReadOnlyResourceAccess } from "./solidCatalog";

// Real Inrupt ACL handling with a transport fixture: no RDF request or data body
// fetch should be needed for CSV, gzip, or binary files.
test.each(["trees.csv", "sensor.json.gz", "movie.mp4"])("checks and updates %s permissions using HEAD", async filename => {
  const root = "https://pod.example/alice/";
  const url = root + filename;
  const webId = root + "profile/card#me";
  let acl = `@prefix acl: <http://www.w3.org/ns/auth/acl#>. <#owner> a acl:Authorization; acl:agent <${webId}>; acl:accessTo <${url}>; acl:mode acl:Read, acl:Write, acl:Control.`;
  const fetch = jest.fn(async (target, options = {}) => {
    const method = options.method || "GET";
    let response;
    if (target === url && method === "HEAD") {
      response = new Response(null, { headers: { Link: `<${url}.acl>; rel="acl"`, "Content-Type": "application/octet-stream" } });
    } else if (target === url + ".acl" && method === "GET") {
      response = new Response(acl, { headers: { "Content-Type": "text/turtle" } });
    } else if (target === url + ".acl" && method === "PATCH") {
      const inserts = options.body.match(/INSERT DATA\s*\{([\s\S]*?)\}/);
      expect(inserts).not.toBeNull();
      acl += "\n" + inserts[1];
      response = new Response(null, { status: 201 });
    } else { throw new Error(`Unexpected data request: ${method} ${target}`); }
    Object.defineProperty(response, "url", { value: target });
    return response;
  });
  await ensurePublicReadOnlyResourceAccess({ info: { webId }, fetch }, url, { podRoot: root });
  expect(fetch.mock.calls.filter(([target]) => target === url).map(([,options]) => options.method)).toEqual(["HEAD", "HEAD"]);
  expect(acl).toContain(webId);
  expect(acl).toContain("http://xmlns.com/foaf/0.1/Agent");
});
