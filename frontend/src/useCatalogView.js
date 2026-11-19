import { useCallback, useEffect, useState } from 'react';

export default function useCatalogView(embedded) {
  const enabled = !embedded && (
    window.__APP_CONFIG__?.catalog?.personalViewEnabled === true ||
    window._env_?.CATALOG_PERSONAL_VIEW_ENABLED === true
  );
  const [selected, setSelected] = useState(() => enabled && new URLSearchParams(window.location.search).get('catalog') === 'personal' ? 'personal' : 'registry');
  useEffect(() => {
    const update = () => setSelected(enabled && new URLSearchParams(window.location.search).get('catalog') === 'personal' ? 'personal' : 'registry');
    update();
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, [enabled]);
  const select = useCallback(view => {
    if (!enabled || !['registry', 'personal'].includes(view)) return;
    const url = new URL(window.location.href);
    if (view === 'personal') url.searchParams.set('catalog', 'personal');
    else url.searchParams.delete('catalog');
    url.searchParams.delete('dataset');
    url.searchParams.delete('view');
    window.history.pushState({}, '', url);
    setSelected(view);
  }, [enabled]);
  return { enabled, view: enabled ? selected : 'registry', select };
}
