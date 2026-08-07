import { useEffect, useRef } from "react";

/**
 * Re-runs callback on an interval and when the browser tab regains focus.
 */
export const usePolling = (callback, intervalMs, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const run = () => savedCallback.current();

    const intervalId = window.setInterval(run, intervalMs);

    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [intervalMs, enabled]);
};
