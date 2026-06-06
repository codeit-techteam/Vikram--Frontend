import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NotificationFeedbackType } from 'expo-haptics';
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type AppNotification } from '@constants/notificationData';
import { useTranslation } from '@store/languageStore';
import { useNotificationStore } from '@store/notificationStore';

import { NotificationCard } from './NotificationCard';

interface SwipeableNotificationCardProps {
  item: AppNotification;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
}

function DeleteAction({
  progress,
  onPress,
  label,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
  label: string;
}) {
  const animStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.7, 0.9, 1]);
    const opacity = interpolate(progress.value, [0, 0.3, 1], [0, 0.5, 1]);
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={styles.actionSlot}>
      <Reanimated.View style={animStyle}>
        <TouchableOpacity onPress={onPress} style={styles.deleteButton} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
      </Reanimated.View>
    </View>
  );
}

function MarkReadAction({
  progress,
  onPress,
  label,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
  label: string;
}) {
  const animStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.7, 1]);
    const opacity = interpolate(progress.value, [0, 0.3, 1], [0, 0.5, 1]);
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={styles.actionSlot}>
      <Reanimated.View style={animStyle}>
        <TouchableOpacity onPress={onPress} style={styles.readButton} activeOpacity={0.85}>
          <Ionicons name="checkmark-done-outline" size={22} color="#fff" />
          <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
      </Reanimated.View>
    </View>
  );
}

export function SwipeableNotificationCard({
  item,
  onDelete,
  onMarkRead,
}: SwipeableNotificationCardProps) {
  const { t } = useTranslation();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isRead = useNotificationStore((s) => s.isRead(item.id));
  const showUnread = item.unread && !isRead;

  const layoutHeight = useSharedValue(0);
  const cardHeight = useSharedValue(-1);
  const cardOpacity = useSharedValue(1);
  const cardMargin = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  const handleDelete = () => {
    if (isDeleting.value) return;
    isDeleting.value = true;

    if (layoutHeight.value > 0) {
      cardHeight.value = layoutHeight.value;
    }
    cardHeight.value = withTiming(0, { duration: 280 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardMargin.value = withTiming(0, { duration: 280 });

    setTimeout(() => {
      onDelete(item.id);
    }, 300);

    void Haptics.notificationAsync(NotificationFeedbackType.Success);
  };

  const collapseStyle = useAnimatedStyle(() => {
    if (!isDeleting.value) {
      return { overflow: 'hidden' as const };
    }
    return {
      height: cardHeight.value,
      opacity: cardOpacity.value,
      marginBottom: cardMargin.value,
      overflow: 'hidden' as const,
    };
  });

  const renderRightActions = (progress: SharedValue<number>) => (
    <DeleteAction
      progress={progress}
      label={t('delete')}
      onPress={() => {
        swipeableRef.current?.close();
        handleDelete();
      }}
    />
  );

  const renderLeftActions = (progress: SharedValue<number>) => {
    if (!showUnread) return null;
    return (
      <MarkReadAction
        progress={progress}
        label={t('readAction')}
        onPress={() => {
          swipeableRef.current?.close();
          onMarkRead(item.id);
          void Haptics.selectionAsync();
        }}
      />
    );
  };

  return (
    <Reanimated.View
      style={collapseStyle}
      onLayout={(e) => {
        const height = e.nativeEvent.layout.height;
        if (layoutHeight.value === 0 && height > 0) {
          layoutHeight.value = height;
        }
      }}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        overshootFriction={8}
        rightThreshold={60}
        leftThreshold={60}
        renderRightActions={renderRightActions}
        renderLeftActions={showUnread ? renderLeftActions : undefined}
        onSwipeableWillOpen={(direction) => {
          if (direction === 'right') {
            handleDelete();
          }
        }}
        containerStyle={styles.swipeContainer}>
        <NotificationCard item={item} />
      </Swipeable>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    backgroundColor: 'transparent',
  },
  actionSlot: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 64,
    height: '88%',
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  readButton: {
    width: 64,
    height: '88%',
    backgroundColor: '#34C759',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
