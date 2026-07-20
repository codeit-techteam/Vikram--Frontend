import { useEffect, useState } from 'react';

import { getVideoThumbnailUri, peekVideoThumbnail } from '@utils/videoThumbnailCache';

interface UseVideoThumbnailResult {
  thumbnailUri: string | null;
  isLoading: boolean;
  error: boolean;
  retry: () => void;
}

export function useVideoThumbnail(
  videoModule: number,
  enabled: boolean,
): UseVideoThumbnailResult {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(
    () => peekVideoThumbnail(videoModule) ?? null,
  );
  const [isLoading, setIsLoading] = useState(enabled && !thumbnailUri);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;

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

  return {
    thumbnailUri,
    isLoading,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}
