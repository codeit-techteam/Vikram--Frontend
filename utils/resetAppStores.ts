import { useCartStore } from '@store/cartStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useGstStore } from '@store/gstStore';
import { useNotificationStore } from '@store/notificationStore';
import { useOrderStore } from '@store/orderStore';
import { useUserStore } from '@store/userStore';
import { useAuthStore } from '@store/useAuthStore';
import { useSiteStore } from '@store/useSiteStore';

export function resetAppStores() {
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
  useAuthStore.getState().reset();
  useSiteStore.setState({ sites: [] });
  useDeliveryStore.getState().reset();
  useUserStore.getState().reset();
  useGstStore.getState().reset();
}
