import { useEffect, useState } from 'react';

import { getVideoThumbnailUri, peekVideoThumbnail } from '@utils/videoThumbnailCache';

interface UseVideoThumbnailResult {
  thumbnailUri: string | null;
  isLoading: boolean;
  error: boolean;
  retry: () => void;
}

/**
 * @param source Bundled require() module id, or remote https video URL
 * @param enabled Only generate when the card is (near) visible
 * @param preferCmsThumb When a CMS poster already exists, skip generation
 */
export function useVideoThumbnail(
  source: number | string | null | undefined,
  enabled: boolean,
  preferCmsThumb = false,
): UseVideoThumbnailResult {
  const hasSource =
    typeof source === 'number' ||
    (typeof source === 'string' && source.startsWith('http'));

  const [thumbnailUri, setThumbnailUri] = useState<string | null>(() =>
    hasSource ? peekVideoThumbnail(source as number | string) ?? null : null,
  );
  const [isLoading, setIsLoading] = useState(
    enabled && hasSource && !preferCmsThumb && !thumbnailUri,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (preferCmsThumb) {
      setIsLoading(false);
      setError(false);
      return;
    }

    if (!enabled || !hasSource) {
      setIsLoading(false);
      return;
    }

    const key = source as number | string;
    const cached = peekVideoThumbnail(key);
    if (cached) {
      setThumbnailUri(cached);
      setIsLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(false);

    getVideoThumbnailUri(key)
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
  }, [source, enabled, attempt, preferCmsThumb, hasSource]);

  const retry = () => setAttempt((n) => n + 1);

  return { thumbnailUri, isLoading, error, retry };
}
