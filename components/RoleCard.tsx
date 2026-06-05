import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import type { UserRole } from '@store/useAuthStore';

interface RoleCardProps {
  role: UserRole;
  title: string;
  subtitle: string;
  imageUrl: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: (role: UserRole) => void;
}

export function RoleCard({
  role,
  title,
  subtitle,
  imageUrl,
  icon,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <Pressable
      onPress={() => onSelect(role)}
      className={`flex-1 overflow-hidden rounded-card ${
        selected ? 'border-2 border-primary' : 'border-2 border-transparent'
      }`}
      style={{ aspectRatio: 0.82, minHeight: 170 }}>
      <Image
        source={{ uri: imageUrl }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />
      <View className="absolute left-2 top-2 h-8 w-8 items-center justify-center rounded-md bg-primary">
        <Ionicons name={icon} size={16} color="#FFFFFF" />
      </View>
      <View
        className={`absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary bg-primary' : 'border-white bg-transparent'
        }`}>
        {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <View className="absolute bottom-0 left-0 right-0 p-3">
        <Text className="text-sm font-bold text-text-inverse">{title}</Text>
        <Text className="mt-0.5 text-[10px] leading-3 text-text-inverse/90">{subtitle}</Text>
      </View>
    </Pressable>
  );
}
