import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import useCatalogAccess from "./useCatalogAccess";
import { loadAggregatedDatasets } from "./solidCatalog";

export default function useCatalogDatasets(session, webId, isLoggedIn, registryUrl = "") {
  const context = `${isLoggedIn}:${webId || ""}:${registryUrl}`;
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const activeRun = useRef(null);
  const { service: accessService, revision } = useCatalogAccess(session, webId, registryUrl, isLoggedIn);

  const fetchDatasets = useCallback(async () => {
    const run = activeRun.current;
    if (!run || run.context !== context) return;
    const request = ++run.request;
    if (!isLoggedIn || !registryUrl || session.info.webId !== webId) {
      setResult({ context, datasets: [], catalogs: [], error: false });
      return;
    }
    let failed = false;
    let partial = false;
    try {
      const loaded = await loadAggregatedDatasets(
        session,
        isLoggedIn ? null : window.fetch.bind(window),
        {
          usePublicCache: true,
          registryUrl,
          onLoadError: (_error, detail) => {
            // A registry can link to deleted, private or offline entries.
            // Wait for the complete traversal, but do not let one such entry
            // hide every successful result. Discovery failures remain blocking.
            if (detail?.stage === "dataset" || detail?.stage === "catalog") partial = true;
            else failed = true;
          },
        }
      );
      if (activeRun.current !== run || run.request !== request) return;
      setResult({
        context,
        datasets: loaded.datasets,
        catalogs: loaded.catalogs || [],
        error: failed,
        partial,
      });
    } catch (error) {
      if (activeRun.current !== run || run.request !== request) return;
      console.error("Error fetching datasets:", error);
      setResult({ context, datasets: [], catalogs: [], error: true });
    }
  }, [session, context, isLoggedIn, webId, registryUrl]);

  useEffect(() => {
    const run = { context, request: 0 };
    activeRun.current = run;
    setResult(null);
    fetchDatasets();
    // Ignore stale responses after account changes or unmounts.
    // https://react.dev/reference/react/useEffect#fetching-data-with-effects
    return () => {
      if (activeRun.current === run) activeRun.current = null;
    };
  }, [session, context, isLoggedIn, webId, attempt, fetchDatasets]);

  const current = result?.context === context ? result : null;
  const datasets = useMemo(() => (current?.datasets || []).map(dataset => {
    const accessStatus = accessService?.state(dataset) || (dataset.is_public ? 'public' : 'checking');
    return { ...dataset, accessStatus, userHasAccess: ['public', 'available'].includes(accessStatus) };
  }), [current, accessService, revision]);
  const refreshDatasets = useCallback(() => { accessService?.refresh(); return fetchDatasets(); }, [accessService, fetchDatasets]);
  return {
    datasets,
    accessService,
    metadataSnapshot: current,
    catalogs: current?.catalogs || [],
    loading: !current,
    error: Boolean(current?.error),
    partial: Boolean(current?.partial),
    fetchDatasets: refreshDatasets,
    retry: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
  };
}
