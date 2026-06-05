import { useEffect } from 'react';
import { ImageBackground, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import { images } from '@constants/images';
import { useUserStore } from '@store/userStore';

const TIER_LABELS = {
  platinum: 'PLATINUM CONTRACTOR',
  gold: 'GOLD CONTRACTOR',
  silver: 'SILVER CONTRACTOR',
} as const;

interface DrawerHeaderProps {
  onEditPress: () => void;
  isDrawerOpen: boolean;
}

export function DrawerHeader({ onEditPress, isDrawerOpen }: DrawerHeaderProps) {
  const user = useUserStore((s) => s.user);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-12);

  useEffect(() => {
    if (isDrawerOpen) {
      headerOpacity.value = withDelay(80, withTiming(1, { duration: 250 }));
      headerTranslateY.value = withDelay(
        80,
        withSpring(0, { damping: 16, stiffness: 120 }),
      );
    } else {
      headerOpacity.value = withTiming(0, { duration: 120 });
      headerTranslateY.value = withTiming(-12, { duration: 120 });
    }
  }, [isDrawerOpen, headerOpacity, headerTranslateY]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return (
    <Animated.View style={headerStyle}>
      <ImageBackground
        source={{ uri: images.loginBanner }}
        style={{ height: 140 }}
        imageStyle={{ opacity: 0.9 }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(80,40,10,0.85)']}
          style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}>
          <ScaledPressable
            onPress={onEditPress}
            className="absolute right-4 top-4 h-8 w-8 items-center justify-center rounded-full bg-black/30">
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          </ScaledPressable>

          <View className="flex-row items-end gap-3">
            <Image
              source={{ uri: user.avatar ?? undefined }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
              contentFit="cover"
            />
            <View className="flex-1 pb-1">
              <Text className="text-base font-bold text-text-inverse">{user.name}</Text>
              <Text className="text-xs text-text-inverse/90">{user.company}</Text>
              <View className="mt-2 self-start flex-row items-center gap-1 rounded-full bg-primary px-2.5 py-1">
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text className="text-[9px] font-bold tracking-wide text-text-inverse">
                  {TIER_LABELS[user.memberTier]}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  );
}
