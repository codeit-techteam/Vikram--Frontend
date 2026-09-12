import { useContext, useEffect, useState } from 'react';
import {
  NavigationContainerRefContext,
  NavigationContext,
} from 'expo-router/react-navigation';

type FocusableNav = {
  isFocused: () => boolean;
  addListener: (type: 'focus' | 'blur', callback: () => void) => () => void;
};

/**
 * Focus state that never throws when NavigationContainer is briefly unavailable
 * (e.g. during auth redirects / tab transitions).
 */
export function useSafeIsFocused(defaultFocused = true): boolean {
  const navigation = useContext(NavigationContext);
  const root = useContext(NavigationContainerRefContext);
  const nav = (navigation ?? root) as FocusableNav | null;
  const [isFocused, setIsFocused] = useState(() =>
    nav ? Boolean(nav.isFocused()) : defaultFocused,
  );

  useEffect(() => {
    if (!nav) {
      setIsFocused(defaultFocused);
      return;
    }

    setIsFocused(nav.isFocused());
    const unsubFocus = nav.addListener('focus', () => setIsFocused(true));
    const unsubBlur = nav.addListener('blur', () => setIsFocused(false));
    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [nav, defaultFocused]);

  return isFocused;
}

type RootNavRef = {
  getRootState?: () => { index?: number; routes?: { name?: string }[] } | undefined;
  addListener?: (type: 'state', cb: () => void) => () => void;
};

/**
 * True when the root stack is showing only the tab navigator (no checkout/login/etc on top).
 * Never calls usePathname — safe during NavigationContainer gaps.
 */
export function useIsAtTabRoot(): boolean {
  const root = useContext(NavigationContainerRefContext) as RootNavRef | null;
  const [atTabRoot, setAtTabRoot] = useState(true);

  useEffect(() => {
    if (!root?.getRootState) {
      setAtTabRoot(true);
      return;
    }

    const sync = () => {
      try {
        const state = root.getRootState?.();
        if (!state) {
          setAtTabRoot(true);
          return;
        }
        // index > 0 → a Stack screen (checkout, product, etc.) is above tabs
        setAtTabRoot((state.index ?? 0) === 0);
      } catch {
        setAtTabRoot(true);
      }
    };

    sync();
    const unsub = root.addListener?.('state', sync);
    return () => {
      unsub?.();
    };
  }, [root]);

  return atTabRoot;
}
