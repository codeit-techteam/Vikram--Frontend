import { useMemo, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationCard } from '@components/notifications/NotificationCard';
import {
  filterNotifications,
  NOTIFICATION_FILTERS,
  NOTIFICATIONS,
  type NotificationFilter,
} from '@constants/notificationData';
import { useNotificationStore } from '@store/notificationStore';
import { safeGoBack } from '@utils/navigation';

function ProTipBanner() {
  return (
    <View style={styles.proTipWrap}>
      <ImageBackground
        source={{ uri: 'https://source.unsplash.com/featured/600x200/?construction+site' }}
        style={styles.proTipBg}
        imageStyle={{ borderRadius: 16 }}>
        <View style={styles.proTipOverlay} />
        <View style={styles.proTipContent}>
          <View style={styles.proTipTag}>
            <Text style={styles.proTipTagText}>PRO TIP</Text>
          </View>
          <Text style={styles.proTipTitle}>Maximize Procurement Efficiency</Text>
          <Text style={styles.proTipBody}>
            Upgrade to Business Gold for automated tax filing and logistics priority.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function NotificationsScreen() {
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  const filteredNotifications = useMemo(
    () => filterNotifications(NOTIFICATIONS, searchQuery, activeFilter),
    [searchQuery, activeFilter],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => safeGoBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={markAllRead}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="options-outline" size={22} color="#FF6B00" />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#AAAAAA" />
        <TextInput
          placeholder="Search alerts, orders, or sites..."
          placeholderTextColor="#AAAAAA"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#CCC" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
        {NOTIFICATION_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => {
                setActiveFilter(filter.key);
                Haptics.selectionAsync();
              }}
              style={[
                styles.filterPill,
                isActive ? styles.filterPillActive : styles.filterPillInactive,
              ]}>
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        style={styles.list}
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<ProTipBanner />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#DDD" />
            <Text style={styles.emptyText}>No notifications here</Text>
          </View>
        }
        renderItem={({ item, index }) => <NotificationCard item={item} index={index} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B00',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  filterPillActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 30,
  },
  separator: {
    height: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    marginTop: 12,
  },
  proTipWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  proTipBg: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  proTipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
  },
  proTipContent: {
    position: 'relative',
  },
  proTipTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  proTipTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  proTipTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  proTipBody: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
});
