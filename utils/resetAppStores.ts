import { useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useGstStore } from '@store/gstStore';
import { useNotificationStore } from '@store/notificationStore';
import { useOrderStore } from '@store/orderStore';
import { useUserStore } from '@store/userStore';
import { useAuthStore } from '@store/useAuthStore';
import { useSiteStore } from '@store/useSiteStore';

/**
 * Full logout flow: clears auth tokens + the API session (via `useAuthStore.logout`,
 * which also resets `userStore`/`deliveryStore` and re-enters guest mode), then wipes
 * every other domain store so the next session starts clean.
 */
export async function resetAppStores() {
  await useAuthStore.getState().logout();

  useCartStore.setState({
    items: [],
    savedForLater: [],
    pointsApplied: true,
  });
  useOrderStore.setState({
    orders: [],
    lastOrderId: null,
    proTipDismissed: false,
  });
  useNotificationStore.getState().reset();
  useSiteStore.setState({ sites: [] });
  useGstStore.getState().reset();

  // useAuthStore.logout() already resets these, but guard against store shape drift.
  useDeliveryStore.getState().reset();
  useUserStore.getState().reset();
}
