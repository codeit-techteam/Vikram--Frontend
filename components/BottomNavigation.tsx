import { memo } from 'react';

import { AppIcon } from '@components/ui/AppIcon';
import { ICON_SIZE, type AppIconName } from '@constants/icons';
import { theme } from '@constants/theme';

/**
 * Shared bottom-tab icon renderer.
 * Outline only — active state is color (primary), never a filled glyph.
 */
export const TabIcons = {
  home: 'home' as AppIconName,
  catalog: 'category' as AppIconName,
  orders: 'orders' as AppIconName,
  account: 'profile' as AppIconName,
};

interface BottomTabIconProps {
  name: AppIconName;
  color: string;
  focused?: boolean;
  size?: number;
}

function BottomTabIconComponent({
  name,
  color,
  size = ICON_SIZE.tab,
}: BottomTabIconProps) {
  return <AppIcon name={name} size={size} color={color} />;
}

export const BottomTabIcon = memo(BottomTabIconComponent);

export const TAB_BAR_THEME = {
  active: theme.primary,
  inactive: theme.mediumGray,
  background: theme.white,
  border: '#E5E5E5',
} as const;
