import { useEffect, useState } from 'react';
import { createCatalogAccess } from './catalogAccess';

export default function useCatalogAccess(session, webId, scope = '', enabled = true) {
  const [owned, setOwned] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled || !webId) return undefined;
    const service = createCatalogAccess({ session, webId });
    const unsubscribe = service.subscribe(() => setRevision(value => value + 1));
    setOwned({ session, webId, scope, service });
    const refresh = () => { if (document.visibilityState !== 'hidden') service.refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      unsubscribe(); service.dispose();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [session, webId, scope, enabled]);
  const service = enabled && owned?.session === session && owned.webId === webId && owned.scope === scope ? owned.service : null;
  return { service, revision };
}
