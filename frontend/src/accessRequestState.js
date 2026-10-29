import { Parser, Writer, DataFactory } from "n3";
import {
  createAcl, createContainerAt, getResourceInfoWithAcl, hasResourceAcl, getResourceAcl, createAclFromFallbackAcl,
  setAgentResourceAccess, setAgentDefaultAccess, saveAclFor,
  createSolidDataset, createThing, getSolidDataset, getContainedResourceUrlAll,
  getThing, getThingAll, getUrl, getUrlAll, getStringNoLocale, getDatetime,
  setThing, setUrl, setStringNoLocale, saveSolidDatasetAt, solidDatasetAsTurtle,
} from '@inrupt/solid-client';

const NS = 'https://w3id.org/solid-dataspace-manager#';
const TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const CREATED = 'http://purl.org/dc/terms/created';
const INBOX = 'http://www.w3.org/ns/ldp#inbox';
const terminal = new Set(['approved', 'denied', 'revoked', 'expired', 'archived']);
const text = (thing, key) => getStringNoLocale(thing, NS + key) || '';
const iri = (thing, key) => getUrl(thing, NS + key) || '';
const time = value => Date.parse(value) || 0;
const stamp = (thing, predicate) => getDatetime(thing, predicate)?.toISOString() || getStringNoLocale(thing, predicate) || '';
const httpUrl = value => { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid Pod URL.'); return url.href; };
const freshFetch = fetch => (url, init = {}) => fetch(url, { ...init, cache: 'no-store' });

export function legacyRequestKey(dataset, webId) {
  const key = dataset?.identifier || dataset?.datasetUrl || dataset?.access_url_dataset || dataset?.title;
  return key && webId ? `sdm.request.pending.${webId}.${key}` : '';
}

async function inboxFor(webId, fetch) {
  const document = await getSolidDataset(httpUrl(webId).split('#')[0], { fetch });
  const inbox = getUrl(getThing(document, webId), INBOX);
  if (!inbox) throw new Error('No Solid inbox found for this profile.');
  return httpUrl(inbox);
}

async function receiptContainerFor(webId, fetch) {
  const doc = await getSolidDataset(webId.split('#')[0], { fetch });
  const profile = getThing(doc, webId);
  let root = getUrl(profile, 'http://www.w3.org/ns/pim/space#storage');
  if (!root) {
    const url = new URL(webId), index = url.pathname.indexOf('/profile/');
    if (index < 0) throw new Error('Pod storage URL is missing from the profile.');
    root = url.origin + url.pathname.slice(0, index + 1);
  }
  return new URL('catalog-requests/', httpUrl(root).replace(/\/?$/, '/')).href;
}

async function ensureReceiptContainer(url, webId, fetch) {
  let resource, created = false;
  try { resource = await getResourceInfoWithAcl(url, { fetch }); }
  catch (error) {
    if ((error.statusCode || error.response?.status) !== 404) throw error;
    // The conditional create must not replace a concurrently created container.
    await createContainerAt(url, { fetch: (target, init = {}) => {
      const headers = new Headers(init.headers); headers.set('If-None-Match', '*');
      return fetch(target, { ...init, headers });
    } });
    created = true;
    resource = await getResourceInfoWithAcl(url, { fetch });
  }
  if (created) {
    const access = { read: true, append: true, write: true, control: true };
    let acl = setAgentResourceAccess(createAcl(resource), webId, access);
    acl = setAgentDefaultAccess(acl, webId, access);
    await saveAclFor(resource, acl, { fetch });
    resource = await getResourceInfoWithAcl(url, { fetch });
  }
  assertPrivateReceiptContainer(resource, url, webId);
}

function assertPrivateReceiptContainer(resource, url, webId) {
  // Unlike an inbox, this container must not accept third-party appends.
  // Do not change pre-existing grants; reject unsafe status storage instead.
  const acl = hasResourceAcl(resource) ? getResourceAcl(resource) : createAclFromFallbackAcl(resource);
  const ACL = 'http://www.w3.org/ns/auth/acl#';
  const relevant = getThingAll(acl).filter(rule => [...getUrlAll(rule, ACL + 'accessTo'), ...getUrlAll(rule, ACL + 'default'), ...getUrlAll(rule, ACL + 'defaultForNew')].includes(url));
  if (!relevant.length || relevant.some(rule => getUrlAll(rule, ACL + 'mode').length &&
    (getUrlAll(rule, ACL + 'agent').some(agent => agent !== webId) || !getUrlAll(rule, ACL + 'agent').length ||
    getUrlAll(rule, ACL + 'agentClass').length || getUrlAll(rule, ACL + 'agentGroup').length))) {
    throw new Error('Outgoing request storage must be private to its owner. Existing permissions were not changed.');
  }
}

function fields(thing, url) {
  return {
    url, requestId: text(thing, 'requestId'), requesterWebId: iri(thing, 'requesterWebId'),
    ownerWebId: iri(thing, 'ownerWebId'), decidedBy: iri(thing, 'decidedBy'),
    datasetUrl: iri(thing, 'catalogDatasetUrl'), dataUrl: iri(thing, 'datasetAccessUrl'),
    status: text(thing, 'decision') || text(thing, 'deliveryStatus'),
    createdAt: stamp(thing, CREATED), decidedAt: stamp(thing, NS + 'decidedAt'),
  };
}

export function resolveRequestState({ dataset, webId, receipts = [], decisions = [], legacyPending = false, complete = true }) {
  const matches = item => item.requesterWebId === webId &&
    (!item.ownerWebId || item.ownerWebId === dataset.webid) &&
    (!item.decidedBy || item.decidedBy === dataset.webid) &&
    (item.datasetUrl ? item.datasetUrl === dataset.datasetUrl : Boolean(item.dataUrl && item.dataUrl === dataset.access_url_dataset));
  const requests = receipts.filter(matches).sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const latest = requests[0];
  const replies = decisions.filter(item => matches(item) && terminal.has(item.status) &&
    (!latest || (item.requestId && item.requestId === latest.requestId)) &&
    (!latest || time(item.decidedAt || item.createdAt) >= time(latest.createdAt)))
    .sort((a, b) => time(b.decidedAt || b.createdAt) - time(a.decidedAt || a.createdAt));
  if (!complete) return { status: 'unknown' };
  if (replies.length) return { ...replies[0], status: replies[0].status };
  if (latest) return { ...latest, status: latest.status === 'sent' ? 'pending' : latest.status === 'failed' ? 'none' : 'unknown' };
  return { status: legacyPending ? 'unknown' : 'none' };
}

export async function readAccessRequestState({ session, dataset, storage = globalThis.localStorage }) {
  const webId = session.info.webId;
  const key = legacyRequestKey(dataset, webId);
  let legacyPending = false;
  try { legacyPending = Boolean(key && storage?.getItem(key)); } catch { /* Storage is optional. */ }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const fetch = freshFetch((url, init) => session.fetch(url, { ...init, signal: controller.signal }));
  try {
    const [inbox, receiptContainer] = await Promise.all([inboxFor(webId, fetch), receiptContainerFor(webId, fetch)]);
    const receipts = [], decisions = [];
    let complete = true;
    for (const [container, type, target] of [[receiptContainer, 'AccessRequestReceipt', receipts], [inbox, 'AccessDecision', decisions]]) {
      let listing;
      try { listing = await getSolidDataset(container, { fetch }); }
      catch (error) { if (container === receiptContainer && (error.statusCode || error.response?.status) === 404) continue; throw error; }
      if (container === receiptContainer) assertPrivateReceiptContainer(await getResourceInfoWithAcl(container, { fetch }), container, webId);
      const urls = [...new Set(getContainedResourceUrlAll(listing))];
      if (urls.length > 2000) complete = false;
      let cursor = 0;
      await Promise.all(Array.from({ length: Math.min(6, urls.length) }, async () => {
        while (cursor < Math.min(urls.length, 2000)) {
          if (controller.signal.aborted) { complete = false; break; }
          const url = urls[cursor++];
          if (!url.startsWith(container.endsWith('/') ? container : container + '/')) { complete = false; continue; }
          try {
            const doc = await getSolidDataset(url, { fetch });
            for (const thing of getThingAll(doc)) if (getUrlAll(thing, TYPE).includes(NS + type)) target.push(fields(thing, url));
          } catch { complete = false; }
        }
      }));
    }
    const result = resolveRequestState({ dataset, webId, receipts, decisions, legacyPending, complete });
    if (terminal.has(result.status)) { try { if (key) storage?.removeItem(key); } catch { /* Optional legacy cache. */ } }
    return result;
  } catch { return { status: 'unknown' }; }
  finally { clearTimeout(timer); }
}

const buildThing = (url, type, literals, urls) => {
  let thing = setUrl(createThing({ url }), TYPE, NS + type);
  for (const [key, value] of Object.entries(literals)) if (value) thing = setStringNoLocale(thing, key === 'createdAt' ? CREATED : NS + key, value);
  for (const [key, value] of Object.entries(urls)) if (value) thing = setUrl(thing, NS + key, value);
  return thing;
};
async function postDocument(inbox, document, slug, fetch) {
  const response = await fetch(inbox, { method: 'POST', headers: { 'Content-Type': 'text/turtle', Slug: slug }, body: new Writer().quadsToString(new Parser().parse(await solidDatasetAsTurtle(document)).map(quad => quad.subject.value === inbox + '#request' ? DataFactory.quad(DataFactory.namedNode(''), quad.predicate, quad.object, quad.graph) : quad)) });
  if (!response.ok) throw Object.assign(new Error(`Inbox rejected request (${response.status})`), { rejected: true });
  const location = response.headers.get('Location');
  const url = location ? new URL(location, inbox).href : '';
  return url.startsWith(inbox.endsWith('/') ? inbox : inbox + '/') ? url : '';
}

export async function sendAccessRequest({ session, dataset, userName = '', userEmail = '', message }) {
  if (!session.info.isLoggedIn || !session.info.webId) throw new Error('Please sign in with Solid to request access.');
  if (!message?.trim()) throw new Error('Please provide a reason for your request.');
  const webId = session.info.webId, fetch = freshFetch(session.fetch);
  const owner = httpUrl(dataset.webid);
  const [receiptContainer, ownerInbox] = await Promise.all([receiptContainerFor(webId, fetch), inboxFor(owner, fetch)]);
  await ensureReceiptContainer(receiptContainer, webId, fetch);
  const requestId = globalThis.crypto.randomUUID(), createdAt = new Date().toISOString();
  const urls = { requesterWebId: webId, ownerWebId: owner, catalogDatasetUrl: dataset.datasetUrl,
    catalogUrl: dataset.catalogUrl, datasetAccessUrl: dataset.access_url_dataset, datasetSemanticModelUrl: dataset.access_url_semantic_model };
  const literals = { requestId, createdAt, requesterName: userName, requesterEmail: userEmail,
    datasetIdentifier: dataset.identifier || '', datasetTitle: dataset.title || '', message: message.trim() };
  // Store outgoing status separately from the appendable inbox so other senders cannot forge pending receipts.
  const receiptThing = buildThing(receiptContainer + '#request', 'AccessRequestReceipt', { ...literals, deliveryStatus: 'sending' }, urls);
  const receiptUrl = await postDocument(receiptContainer, setThing(createSolidDataset(), receiptThing), 'catalog-request-' + requestId, fetch);
  if (!receiptUrl) throw new Error('The outgoing request could not be saved. No request was sent to the owner.');
  const persist = async (status, requestResourceUrl = '') => {
    const doc = await getSolidDataset(receiptUrl, { fetch });
    const receipt = getThingAll(doc).find(item => text(item, 'requestId') === requestId);
    if (!receipt) throw new Error('Outgoing request receipt is unavailable.');
    let next = setStringNoLocale(receipt, NS + 'deliveryStatus', status);
    if (requestResourceUrl) next = setUrl(next, NS + 'requestResourceUrl', requestResourceUrl);
    await saveSolidDatasetAt(receiptUrl, setThing(doc, next), { fetch });
  };
  let requestResourceUrl;
  try {
    const request = buildThing(ownerInbox + '#request', 'AccessRequest', { ...literals, status: 'pending' }, urls);
    requestResourceUrl = await postDocument(ownerInbox, setThing(createSolidDataset(), request), 'access-request-' + requestId, fetch);
  } catch (error) {
    try { await persist(error.rejected ? 'failed' : 'unknown'); } catch { /* Sending remains explicitly unconfirmed. */ }
    throw error;
  }
  try { await persist('sent', requestResourceUrl); return { status: 'pending', requestId }; }
  catch { return { status: 'unknown', requestId }; }
}
