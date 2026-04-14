import { useState, useEffect, useCallback, useRef } from "react";

type UseFetchConfig = {
  enabled?: boolean;
};

export const fetchAPI = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const useFetch = <T>(
  url: string,
  options?: RequestInit,
  config?: UseFetchConfig,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = config?.enabled ?? true;

  // Keep a stable ref so object-literal options don't cause infinite refetch
  // loops when callers pass a new reference on every render. The ref is
  // always synced to the latest value so real changes (e.g. auth token
  // becoming available) are picked up on the next triggered fetch.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, optionsRef.current);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled, url]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
  }, [enabled, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
