import { useState, useEffect, useCallback } from 'react';

/**
 * Generic async data fetcher hook.
 * @param {() => Promise} fetchFn - async function returning axios response
 * @param {boolean} immediate - fetch on mount
 */
export function useAsync(fetchFn, immediate = true) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) execute();
  }, [immediate]);

  return { data, loading, error, refetch: execute };
}

/**
 * Auto-refresh hook — polls every `intervalMs` ms.
 */
export function usePolling(fetchFn, intervalMs = 30000) {
  const result = useAsync(fetchFn);

  useEffect(() => {
    const id = setInterval(result.refetch, intervalMs);
    return () => clearInterval(id);
  }, [result.refetch, intervalMs]);

  return result;
}
