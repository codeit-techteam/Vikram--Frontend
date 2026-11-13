import { useEffect } from 'react';
import { router, type Href } from 'expo-router';

/** Legacy business GST screen — multi-account management lives on gst-accounts. */
export function BusinessDetailsScreen() {
  useEffect(() => {
    router.replace('/account/gst-accounts' as Href);
  }, []);
  return null;
}
