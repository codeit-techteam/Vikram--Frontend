import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** Disables drawer swipe while a horizontal carousel is actively scrolling. */
export function useCarouselDrawerLock(
  onInteractionChange?: (isInteracting: boolean) => void,
) {
  const isDragging = useRef(false);

  const setInteracting = useCallback(
    (active: boolean) => {
      onInteractionChange?.(active);
    },
    [onInteractionChange],
  );

  const onScrollBeginDrag = useCallback(() => {
    isDragging.current = true;
    setInteracting(true);
  }, [setInteracting]);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isDragging.current = false;
      const velocityX = event.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(velocityX) < 0.05) {
        setInteracting(false);
      }
    },
    [setInteracting],
  );

  const onMomentumScrollBegin = useCallback(() => {
    setInteracting(true);
  }, [setInteracting]);

  const onMomentumScrollEnd = useCallback(() => {
    if (!isDragging.current) {
      setInteracting(false);
    }
  }, [setInteracting]);

  return {
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
  };
}
