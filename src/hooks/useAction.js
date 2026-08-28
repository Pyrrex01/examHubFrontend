import { useCallback, useState } from 'react';

import { ApiError } from '../api/client';

export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (task) => {
    setPending(true);
    setError(null);

    try {
      const result = await task();
      setPending(false);
      return { ok: true, result };
    } catch (caught) {
      const failure =
        caught instanceof ApiError
          ? caught
          : new ApiError(0, "L'opération a échoué. Réessayez dans un instant.");
      setError(failure);
      setPending(false);
      return { ok: false, error: failure };
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
