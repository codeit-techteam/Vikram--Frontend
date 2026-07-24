import { getSites } from '@services/sites.api';

/**
 * Returns true when the logged-in customer has at least one saved delivery site.
 * Guests are treated as not requiring setup (browse-only).
 */
export async function customerHasDeliverySites(): Promise<boolean> {
  try {
    const sites = await getSites();
    return sites.length > 0;
  } catch {
    return false;
  }
}
