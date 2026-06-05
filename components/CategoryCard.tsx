import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ImageSourcePropType } from 'react-native';

import { ScaledPressable } from '@components/ScaledPressable';

interface CategoryCardProps {
  name: string;
  image: ImageSourcePropType;
  onPress: () => void;
}

export function CategoryCard({ name, image, onPress }: CategoryCardProps) {
  return (
    <ScaledPressable onPress={onPress} className="mb-3 flex-1 overflow-hidden rounded-card shadow-sm">
      <View style={{ aspectRatio: 1.1 }}>
        <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }}
        />
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <Text className="text-sm font-bold text-text-inverse">{name}</Text>
        </View>
      </View>
    </ScaledPressable>
  );
}
