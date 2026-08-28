import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client';

export function useResource(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setLoading(true);
    setError(null);

    fetcherRef
      .current({ signal: controller.signal })
      .then((result) => {
        if (!alive) return;
        setData(result);
        setLoading(false);
      })
      .catch((caught) => {
        if (!alive || caught?.name === 'AbortError') return;
        setError(caught instanceof ApiError ? caught : new ApiError(0, 'Chargement impossible.'));
        setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, reload, setData };
}
