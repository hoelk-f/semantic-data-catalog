import { datasetPodRoots } from './catalogOrigin';

export const ACCESS_TTL = 60000;
export const ACCESS_LABELS = {
  public: 'Public', available: 'Restricted (you have access)', restricted: 'Restricted',
  checking: 'Checking access...', unknown: 'Access could not be confirmed', series: 'Dataset Series',
};

function resourceUrl(dataset, value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    const roots = datasetPodRoots(dataset);
    // Older entries may only identify their Pod using its owner's WebID.
    if (!roots.length && dataset.webid) {
      const owner = new URL(dataset.webid);
      const segments = owner.pathname.split('/').filter(Boolean);
      const profile = segments.indexOf('profile');
      const path = (profile >= 0 ? segments.slice(0, profile) : segments).join('/');
      roots.push(owner.origin + '/' + (path ? path + '/' : ''));
    }
    url.hash = '';
    return roots.some(root => url.href.startsWith(root)) ? url.href : '';
  } catch { return ''; }
}

// A store belongs to one mounted catalog, login and registry. Personal access
// results never enter catalog metadata, browser storage or the public cache.
export function createCatalogAccess({ session, webId, now = Date.now, concurrency = 4, timeout = 8000 }) {
  const entries = new Map(), listeners = new Set(), queue = [], controllers = new Set();
  let active = 0, disposed = false;
  const current = () => !disposed && Boolean(webId && session.info.isLoggedIn && session.info.webId === webId);
  const notify = () => { if (!disposed) listeners.forEach(listener => listener()); };
  const fixed = dataset => dataset?.datasetType === 'series' ? 'series'
    : dataset?.is_public ? 'public' : current() && dataset?.webid === webId ? 'available' : '';
  const state = (dataset, value = dataset?.access_url_dataset) => {
    const known = fixed(dataset);
    if (known) return known;
    const url = resourceUrl(dataset, value);
    if (!current() || !url) return 'unknown';
    return entries.get(url)?.status || 'checking';
  };
  const pump = () => {
    while (!disposed && active < concurrency && queue.length) {
      const task = queue.shift();
      active++;
      const controller = new AbortController(); controllers.add(controller);
      let timer;
      const deadline = new Promise(resolve => { timer = setTimeout(() => { controller.abort(); resolve('unknown'); }, timeout); });
      const cancelled = new Promise(resolve => controller.signal.addEventListener('abort', () => resolve('unknown'), { once: true }));
      const request = Promise.resolve().then(async () => {
        if (!current()) return 'unknown';
        try {
          const response = await session.fetch(task.url, { method: 'HEAD', cache: 'no-store', redirect: 'error', signal: controller.signal });
          if (!current()) return 'unknown';
          if (response.ok) return 'available';
          // A 401 may be an expired session. Offline, unavailable and unsupported
          // responses do not establish a revoked permission either.
          return response.status === 403 ? 'restricted' : 'unknown';
        } catch { return 'unknown'; }
      });
      Promise.race([request, deadline, cancelled]).then(status => {
        if (!disposed && entries.get(task.url) === task.entry) {
          Object.assign(task.entry, { status: current() ? status : 'unknown', checkedAt: now(), promise: null });
          notify();
        }
        task.resolve(status);
      }).finally(() => { clearTimeout(timer); controllers.delete(controller); active--; pump(); });
    }
  };
  const check = (dataset, value = dataset?.access_url_dataset, { force = false, priority = false, onlyIfUnseen = false } = {}) => {
    const known = fixed(dataset), url = resourceUrl(dataset, value);
    if (known || !current() || !url) return Promise.resolve(known || 'unknown');
    const prior = entries.get(url);
    if (prior?.promise) {
      if (priority) { const index = queue.findIndex(task => task.url === url); if (index > 0) queue.unshift(...queue.splice(index, 1)); }
      return prior.promise;
    }
    const ttl = prior?.status === 'unknown' ? 5000 : ACCESS_TTL;
    if (!force && prior && (onlyIfUnseen || now() - prior.checkedAt < ttl)) return Promise.resolve(prior.status);
    let resolve;
    const entry = { status: 'checking', checkedAt: 0, dataset, value, promise: new Promise(done => { resolve = done; }) };
    entries.set(url, entry);
    const task = { url, entry, resolve };
    priority ? queue.unshift(task) : queue.push(task);
    notify(); pump();
    return entry.promise;
  };
  return {
    state, check,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    refresh() { for (const entry of [...entries.values()]) check(entry.dataset, entry.value, { force: true }); },
    dispose() {
      disposed = true; controllers.forEach(controller => controller.abort());
      queue.splice(0).forEach(task => task.resolve('unknown'));
      entries.clear(); listeners.clear();
    },
  };
}
