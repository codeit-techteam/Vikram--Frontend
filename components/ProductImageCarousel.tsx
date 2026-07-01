import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageSourcePropType,
  Modal,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  const galleryRef = useRef<FlatList<ImageSourcePropType>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ height: 280 }}>
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
          <ScaledPressable key={i} onPress={() => openGallery(i)}>
            <Image
              source={source}
              style={{ width: SCREEN_WIDTH, height: 280 }}
              contentFit="cover"
            />
          </ScaledPressable>
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

      <Modal visible={galleryOpen} transparent animationType="fade" statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
          }}>
          <ScaledPressable
            onPress={() => setGalleryOpen(false)}
            style={{
              position: 'absolute',
              top: insets.top + 12,
              right: 16,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="close" size={20} color="#fff" />
          </ScaledPressable>

          <Text
            style={{
              position: 'absolute',
              top: insets.top + 18,
              alignSelf: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: '600',
              zIndex: 10,
            }}>
            {galleryIndex + 1} / {images.length}
          </Text>

          <FlatList
            ref={galleryRef}
            horizontal
            pagingEnabled
            initialScrollIndex={galleryIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            data={images}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setGalleryIndex(index);
            }}
            renderItem={({ item: source }) => (
              <View
                style={{
                  width: SCREEN_WIDTH,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={source}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                  contentFit="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
