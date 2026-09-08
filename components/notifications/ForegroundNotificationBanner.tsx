import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ForegroundNotificationBannerProps {
  title: string;
  body: string;
  onView: () => void;
  onDismiss: () => void;
}

export function ForegroundNotificationBanner({
  title,
  body,
  onView,
  onDismiss,
}: ForegroundNotificationBannerProps) {
  return (
    <Pressable style={styles.wrap} onPress={onView}>
      <View style={styles.icon}>
        <Ionicons name="notifications" size={18} color="#1A1A1A" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
      </View>
      <Pressable onPress={onView} style={styles.viewBtn} hitSlop={8}>
        <Text style={styles.viewText}>View</Text>
      </Pressable>
      <Pressable onPress={onDismiss} hitSlop={8} style={styles.close}>
        <Ionicons name="close" size={16} color="#888" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0E2B8',
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  body: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  viewBtn: {
    backgroundColor: '#FEB623',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  close: {
    padding: 2,
  },
});
