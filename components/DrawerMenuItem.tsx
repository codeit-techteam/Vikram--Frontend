import { memo, useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface DrawerMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number | string;
  isHighlight?: boolean;
  isDestructive?: boolean;
  rightElement?: ReactNode;
  index: number;
  isDrawerOpen: boolean;
  onPress: () => void;
}

export const DrawerMenuItem = memo(function DrawerMenuItem({
  icon,
  label,
  badge,
  isHighlight = false,
  isDestructive = false,
  rightElement,
  index,
  isDrawerOpen,
  onPress,
}: DrawerMenuItemProps) {
  const [flashing, setFlashing] = useState(false);
  const opacity = useSharedValue(0);
  const translateXItem = useSharedValue(-24);

  useEffect(() => {
    if (isDrawerOpen) {
      const delay = 40 + index * 28;
      opacity.value = withDelay(delay, withTiming(1, { duration: 260 }));
      translateXItem.value = withDelay(
        delay,
        withSpring(0, { damping: 20, stiffness: 200, mass: 0.7 }),
      );
    } else {
      opacity.value = withTiming(0, { duration: 140 });
      translateXItem.value = withTiming(-20, { duration: 140 });
    }
  }, [isDrawerOpen, index, opacity, translateXItem]);

  const itemStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateXItem.value }],
  }));

  const color = isDestructive ? '#D32F2F' : isHighlight ? '#FEB623' : '#555555';

  const handlePress = async () => {
    if (isDestructive) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.selectionAsync();
    }
    setFlashing(true);
    setTimeout(() => setFlashing(false), 150);
    onPress();
  };

  return (
    <Animated.View style={itemStyle}>
      <Pressable
        onPress={handlePress}
        className="flex-row items-center px-5 py-3.5"
        style={{ backgroundColor: flashing ? '#FFF4D1' : 'transparent' }}>
        <Ionicons name={icon} size={20} color={color} />
        <Text className="ml-4 flex-1 text-[15px] font-medium" style={{ color }}>
          {label}
        </Text>
        {badge !== undefined && badge !== 0 && (
          <View className="h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1">
            <Text className="text-[10px] font-bold text-onPrimary">{badge}</Text>
          </View>
        )}
        {rightElement}
      </Pressable>
    </Animated.View>
  );
});

export function DrawerSectionLabel({
  label,
  index,
  isDrawerOpen,
}: {
  label: string;
  index: number;
  isDrawerOpen: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateXItem = useSharedValue(-16);

  useEffect(() => {
    if (isDrawerOpen) {
      const delay = 40 + index * 28;
      opacity.value = withDelay(delay, withTiming(1, { duration: 240 }));
      translateXItem.value = withDelay(
        delay,
        withSpring(0, { damping: 20, stiffness: 200, mass: 0.7 }),
      );
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateXItem.value = withTiming(-14, { duration: 120 });
    }
  }, [isDrawerOpen, index, opacity, translateXItem]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateXItem.value }],
  }));

  return (
    <Animated.View style={labelStyle}>
      <Text className="px-5 pb-1 pt-4 text-[10px] font-bold tracking-widest text-text-secondary">
        {label}
      </Text>
    </Animated.View>
  );
}
