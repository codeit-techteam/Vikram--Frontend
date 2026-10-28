import { getSites } from '@services/sites.api';
import { useDeliveryStore } from '@store/deliveryStore';
import { withDeadline, DeadlineExceededError } from '@utils/withDeadline';

const SITES_BOOT_DEADLINE_MS = 5000;

function syncSitesToStore(
  deliverySites: Awaited<ReturnType<typeof getSites>>,
): void {
  useDeliveryStore.getState().setProfileSitesFromDeliverySites(deliverySites);
  useDeliveryStore.getState().setSites(
    deliverySites.map((s) => ({
      id: s.id,
      name: s.siteName,
      address: [s.fullAddress, s.city].filter(Boolean).join(', '),
    })),
  );
  const primary = deliverySites.find((s) => s.isPrimary) ?? deliverySites[0];
  if (primary) {
    useDeliveryStore.getState().setSelectedSite(primary.id);
  }
}

function hasCachedSites(): boolean {
  const { profileSites, sites } = useDeliveryStore.getState();
  return profileSites.length > 0 || sites.length > 0;
}

/**
 * Returns true when the logged-in customer has at least one saved delivery site.
 * Guests are treated as not requiring setup (browse-only).
 *
 * Network / timeout failures fail open (return true) when no positive empty
 * response was received, so a flaky sites API cannot bounce users off Home
 * or look like a splash→close loop.
 */
export async function customerHasDeliverySites(): Promise<boolean> {
  if (hasCachedSites()) return true;

  try {
    const deliverySites = await withDeadline(
      getSites(),
      SITES_BOOT_DEADLINE_MS,
      'Delivery sites took too long to load',
    );
    syncSitesToStore(deliverySites);
    return deliverySites.length > 0;
  } catch (error) {
    if (error instanceof DeadlineExceededError) {
      console.warn('[sites] boot deadline exceeded — continuing without redirect');
      return true;
    }
    console.warn('[sites] fetch failed — continuing without redirect');
    return true;
  }
}

/**
 * Boot-only sites check with an explicit unknown outcome for routing.
 * - yes: proceed to tabs
 * - no: send to delivery-location
 * - unknown: proceed to tabs (do not block startup)
 */
export async function resolveDeliverySitesForBoot(): Promise<
  'yes' | 'no' | 'unknown'
> {
  if (hasCachedSites()) return 'yes';

  try {
    const deliverySites = await withDeadline(
      getSites(),
      SITES_BOOT_DEADLINE_MS,
      'Delivery sites took too long to load',
    );
    syncSitesToStore(deliverySites);
    return deliverySites.length > 0 ? 'yes' : 'no';
  } catch {
    return 'unknown';
  }
}
