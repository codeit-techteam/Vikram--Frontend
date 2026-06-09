import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  NOTIFICATION_TYPE_META,
  type AppNotification,
} from '@constants/notificationData';
import { useNotificationStore } from '@store/notificationStore';

interface NotificationCardProps {
  item: AppNotification;
}

export function NotificationCard({ item }: NotificationCardProps) {
  const config = NOTIFICATION_TYPE_META[item.type];
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const isRead = useNotificationStore((s) => s.isRead(item.id));

  const showUnread = item.unread && !isRead;

  const handlePress = () => {
    markAsRead(item.id);
  };

  const handleAction = () => {
    markAsRead(item.id);
    if (item.action?.route) {
      router.push(item.action.route as Href);
    }
  };

  return (
    <View
      style={[
        styles.card,
        showUnread ? styles.cardUnread : styles.cardRead,
        { borderLeftColor: showUnread ? config.borderColor : 'transparent' },
      ]}>
      <Pressable onPress={handlePress}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.iconName} size={17} color={config.iconColor} />
          </View>
          <Text style={[styles.typeLabel, { color: config.labelColor }]}>{item.label}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{item.time}</Text>
            {showUnread ? <View style={styles.unreadDot} /> : null}
          </View>
        </View>

        <Text style={[styles.title, showUnread ? styles.titleUnread : styles.titleRead]}>
          {item.title}
        </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#FFFBEE',
  },
  cardRead: {
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    fontSize: 12,
    color: '#AAA',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FEB623',
  },
  title: {
    fontSize: 15,
    marginBottom: 5,
    lineHeight: 21,
  },
  titleUnread: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  titleRead: {
    fontWeight: '600',
    color: '#444',
  },
  body: {
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  actionFilled: {
    backgroundColor: '#FEB623',
  },
  actionOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FEB623',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionTextFilled: {
    color: '#1A1A1A',
  },
  actionTextOutline: {
    color: '#FEB623',
  },
});
