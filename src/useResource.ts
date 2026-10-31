import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export function useResource<T>(path: string, pollMilliseconds = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    let pending = false;
    async function load(background = false) {
      if (pending || (background && document.visibilityState !== "visible")) return;
      pending = true;
      try {
        const response = await apiRequest(path, {
          signal: controller.signal,
          headers: background ? { "X-Background-Refresh": "1" } : undefined,
        });
        const value: T = await response.json();
        if (!controller.signal.aborted) { setData(value); setError(""); }
      } catch (failure: unknown) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load data.");
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    const timer = pollMilliseconds ? setInterval(() => { void load(true); }, pollMilliseconds) : undefined;
    return () => { controller.abort(); clearInterval(timer); };
  }, [path, revision, pollMilliseconds]);
  return { data, error, loading, reload: () => setRevision(value => value + 1) };
}
