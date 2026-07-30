import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * Single icon library for the entire Bajriwala Customer App.
 * Always use outline Ionicons via these semantic keys — never mix packs.
 */
export type AppIconName =
  | 'menu'
  | 'close'
  | 'back'
  | 'search'
  | 'voice'
  | 'notification'
  | 'cart'
  | 'wishlist'
  | 'profile'
  | 'filter'
  | 'category'
  | 'orders'
  | 'home'
  | 'location'
  | 'chevronDown'
  | 'chevronRight';

type IonName = ComponentProps<typeof Ionicons>['name'];

/** Outline-only Ionicons map. Active tabs use color, not fill. */
export const AppIcons: Record<AppIconName, IonName> = {
  menu: 'menu-outline',
  close: 'close-outline',
  back: 'arrow-back-outline',
  search: 'search-outline',
  voice: 'mic-outline',
  notification: 'notifications-outline',
  cart: 'cart-outline',
  wishlist: 'heart-outline',
  profile: 'person-circle-outline',
  filter: 'options-outline',
  category: 'grid-outline',
  orders: 'cube-outline',
  home: 'home-outline',
  location: 'location-outline',
  chevronDown: 'chevron-down-outline',
  chevronRight: 'chevron-forward-outline',
};

export const ICON_SIZE = {
  header: 24,
  tab: 24,
  floating: 26,
  action: 22,
  badge: 16,
  small: 14,
} as const;

export const TOUCH_TARGET = 48;
