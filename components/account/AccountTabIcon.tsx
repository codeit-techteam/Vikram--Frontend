import { Image } from 'expo-image';
import { View } from 'react-native';

import { InitialsAvatar } from '@components/InitialsAvatar';
import { theme } from '@constants/theme';
import { useUserStore } from '@store/userStore';

export function AccountTabIcon({ focused }: { focused: boolean; color: string }) {
  const user = useUserStore((s) => s.user);

  if (user.avatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: focused ? 2 : 0,
          borderColor: theme.primary,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{
        borderWidth: focused ? 2 : 0,
        borderColor: theme.primary,
        borderRadius: 14,
      }}>
      <InitialsAvatar name={user.name} size={24} />
    </View>
  );
}
