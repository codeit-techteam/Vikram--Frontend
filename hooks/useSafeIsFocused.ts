import { useContext, useEffect, useState } from 'react';
import {
  NavigationContainerRefContext,
  NavigationContext,
} from '@react-navigation/native';

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
