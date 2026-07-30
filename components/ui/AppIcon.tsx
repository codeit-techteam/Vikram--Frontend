import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { AppIcons, ICON_SIZE, type AppIconName } from '@constants/icons';
import { theme } from '@constants/theme';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

/** Renders a semantic app icon from the single Ionicons outline set. */
function AppIconComponent({
  name,
  size = ICON_SIZE.header,
  color = theme.textPrimary,
}: AppIconProps) {
  return <Ionicons name={AppIcons[name]} size={size} color={color} />;
}

export const AppIcon = memo(AppIconComponent);
