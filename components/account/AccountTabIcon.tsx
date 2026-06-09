import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useUserStore } from '@store/userStore';

export function AccountTabIcon({ focused }: { focused: boolean; color: string }) {
  const avatar = useUserStore((s) => s.user.avatar);

  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: focused ? 2 : 0,
          borderColor: '#FEB623',
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={focused ? '#FEB623' : '#666666'} />
  );
}
