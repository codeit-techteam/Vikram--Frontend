import { useEffect, useRef, useState } from 'react';
import { Dimensions, ImageSourcePropType, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { ScaledPressable } from '@components/ScaledPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductImageCarouselProps {
  images: ImageSourcePropType[];
  onMenuPress?: () => void;
}

export function ProductImageCarousel({ images, onMenuPress }: ProductImageCarouselProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % images.length;
        scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <View style={{ height: 220 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}>
        {images.map((source, i) => (
          <Image
            key={i}
            source={source}
            style={{ width: SCREEN_WIDTH, height: 220 }}
            contentFit="cover"
          />
        ))}
      </ScrollView>

      {onMenuPress && (
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}>
          <ScaledPressable onPress={onMenuPress} className="rounded-full bg-black/30 p-2">
            <Ionicons name="menu" size={22} color="#FFFFFF" />
          </ScaledPressable>
          <View className="rounded-full bg-black/30 px-3 py-1.5">
            <BrandLogo size="sm" />
          </View>
          <View className="w-10" />
        </View>
      )}

      <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-2">
        {images.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${i === activeIndex ? 'w-5 bg-primary' : 'w-2 bg-white/60'}`}
          />
        ))}
      </View>
    </View>
  );
}
