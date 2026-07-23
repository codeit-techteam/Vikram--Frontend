import { useEffect, useState } from 'react';

import { getVideoThumbnailUri, peekVideoThumbnail } from '@utils/videoThumbnailCache';

interface UseVideoThumbnailResult {
  thumbnailUri: string | null;
  isLoading: boolean;
  error: boolean;
  retry: () => void;
}

export function useVideoThumbnail(
  videoModule: number | null | undefined,
  enabled: boolean,
): UseVideoThumbnailResult {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(() =>
    typeof videoModule === 'number' ? peekVideoThumbnail(videoModule) ?? null : null,
  );
  const [isLoading, setIsLoading] = useState(
    enabled && typeof videoModule === 'number' && !thumbnailUri,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || typeof videoModule !== 'number') {
      setIsLoading(false);
      return;
    }

    const cached = peekVideoThumbnail(videoModule);
    if (cached) {
      setThumbnailUri(cached);
      setIsLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(false);

    getVideoThumbnailUri(videoModule)
      .then((uri) => {
        if (cancelled) return;
        setThumbnailUri(uri);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoModule, enabled, attempt]);

  const retry = () => setAttempt((n) => n + 1);

  return { thumbnailUri, isLoading, error, retry };
}
