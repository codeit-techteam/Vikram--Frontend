import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  NOTIFICATION_TYPE_META,
  type AppNotification,
} from '@constants/notificationData';
import { useNotificationStore } from '@store/notificationStore';

interface NotificationCardProps {
  item: AppNotification;
  index: number;
}

export function NotificationCard({ item, index }: NotificationCardProps) {
  const config = NOTIFICATION_TYPE_META[item.type];
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const isRead = useNotificationStore((s) => s.isRead(item.id));

  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 80, withSpring(0, { damping: 18, stiffness: 120 }));
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 250 }));
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = () => {
    markAsRead(item.id);
  };

  const handleAction = () => {
    markAsRead(item.id);
    if (item.action?.route) {
      router.push(item.action.route as Href);
    }
  };

  const showUnread = item.unread && !isRead;

  return (
    <Animated.View
      style={[styles.card, { borderLeftColor: config.borderColor }, animStyle]}>
      <Pressable onPress={handlePress}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.iconName} size={18} color={config.iconColor} />
          </View>
          <Text style={[styles.typeLabel, { color: config.labelColor }]}>{item.label}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{item.time}</Text>
            {showUnread ? <View style={styles.unreadDot} /> : null}
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={[styles.body, { marginBottom: item.action ? 12 : 0 }]}>{item.body}</Text>

        {item.action ? (
          <Pressable
            onPress={handleAction}
            style={[
              styles.actionButton,
              item.action.variant === 'outline' ? styles.actionOutline : styles.actionFilled,
            ]}>
            <Text
              style={[
                styles.actionText,
                item.action.variant === 'outline' ? styles.actionTextOutline : styles.actionTextFilled,
              ]}>
              {item.action.label}
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B00',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 21,
  },
  body: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionFilled: {
    backgroundColor: '#FF6B00',
  },
  actionOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF6B00',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionTextFilled: {
    color: '#FFFFFF',
  },
  actionTextOutline: {
    color: '#FF6B00',
  },
});
