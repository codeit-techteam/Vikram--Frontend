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

import { InitialsAvatar } from '@components/InitialsAvatar';
import { ScaledPressable } from '@components/ScaledPressable';
import { images } from '@constants/images';
import { useAuthStore } from '@store/useAuthStore';
import { useUserStore } from '@store/userStore';

interface DrawerHeaderProps {
  onEditPress: () => void;
  isDrawerOpen: boolean;
}

export function DrawerHeader({ onEditPress, isDrawerOpen }: DrawerHeaderProps) {
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isGuest = useAuthStore((s) => s.isGuest);
  const showGuestState = !isLoggedIn || isGuest;
  const displayName = showGuestState || !user.name ? 'Guest User' : user.name;
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
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}
                contentFit="cover"
              />
            ) : (
              <InitialsAvatar
                name={showGuestState ? '' : user.name}
                size={48}
                style={{ borderWidth: 2, borderColor: '#FFFFFF' }}
              />
            )}
            <View className="flex-1 pb-1">
              <Text className="text-base font-bold text-text-inverse">{displayName}</Text>
              {!showGuestState && user.company ? (
                <Text className="text-xs text-text-inverse/90">{user.company}</Text>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  );
}
