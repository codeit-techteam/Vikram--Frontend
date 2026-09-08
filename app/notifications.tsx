import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';

import { BackHeader } from '@components/BackHeader';
import { SwipeableNotificationCard } from '@components/notifications/SwipeableNotificationCard';
import type { StringKey } from '@constants/strings';
import {
  filterNotifications,
  type NotificationFilter,
} from '@constants/notificationData';
import { useTranslation } from '@store/languageStore';
import { useNotificationStore } from '@store/notificationStore';
import { useAuthStore } from '@store/useAuthStore';
import {
  listNotifications,
  NOTIFICATIONS_QUERY_KEY,
} from '@services/notifications.api';
import { mapCustomerNotification } from '@utils/mapCustomerNotification';
import { requireAuth } from '@utils/requireAuth';

const FILTER_KEYS: { key: NotificationFilter; labelKey: StringKey }[] = [
  { key: 'all', labelKey: 'allNotifications' },
  { key: 'logistics', labelKey: 'logisticsFilter' },
  { key: 'payments', labelKey: 'paymentsFilter' },
  { key: 'inventory', labelKey: 'inventoryFilter' },
  { key: 'site', labelKey: 'siteComms' },
];

function ProTipBanner({ t }: { t: (key: StringKey) => string }) {
  return (
    <View style={styles.proTipWrap}>
      <ImageBackground
        source={{ uri: 'https://source.unsplash.com/featured/600x200/?construction+site' }}
        style={styles.proTipBg}
        imageStyle={{ borderRadius: 16 }}>
        <View style={styles.proTipOverlay} />
        <View style={styles.proTipContent}>
          <View style={styles.proTipTag}>
            <Text style={styles.proTipTagText}>{t('proTip')}</Text>
          </View>
          <Text style={styles.proTipTitle}>{t('proTipEfficiencyTitle')}</Text>
          <Text style={styles.proTipBody}>{t('proTipEfficiencyBody')}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const deletedIds = useNotificationStore((s) => s.deletedIds);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  const query = useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, searchQuery],
    enabled: isLoggedIn,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listNotifications({
        page: pageParam,
        limit: 20,
        search: searchQuery.trim() || undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });

  const mapped = useMemo(() => {
    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    return items
      .filter((item) => !deletedIds.includes(item.id))
      .map(mapCustomerNotification);
  }, [deletedIds, query.data]);

  const filteredNotifications = useMemo(
    () => filterNotifications(mapped, searchQuery, activeFilter),
    [activeFilter, mapped, searchQuery],
  );

  const onRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackHeader title={t('notifications')} titleColor="#FEB623" />
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={52} color="#DDD" />
          <Text style={styles.emptyTitle}>Log in to view notifications</Text>
          <Pressable
            style={styles.loginBtn}
            onPress={() => requireAuth('Log in to view your notifications.')}>
            <Text style={styles.loginBtnText}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader
        title={t('notifications')}
        titleColor="#FEB623"
        rightElement={
          <Pressable
            onPress={() => {
              void markAllRead().then(() => query.refetch());
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="options-outline" size={20} color="#FEB623" />
          </Pressable>
        }
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#AAAAAA" />
        <TextInput
          placeholder={t('searchNotifications')}
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
        {FILTER_KEYS.map((filter) => {
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
                {t(filter.labelKey)}
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
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color="#FEB623" style={{ marginVertical: 16 }} />
          ) : (
            <ProTipBanner t={t} />
          )
        }
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color="#FEB623" style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={52} color="#DDD" />
              <Text style={styles.emptyTitle}>{t('allCaughtUp')}</Text>
              <Text style={styles.emptySubtitle}>{t('noNotifications')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <SwipeableNotificationCard
            item={item}
            onDelete={(id) => void deleteNotification(id)}
            onMarkRead={(id) => void markAsRead(id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#FEB623',
    borderColor: '#FEB623',
    shadowColor: '#FEB623',
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
    color: '#1A1A1A',
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
  emptyTitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#CCCCCC',
    marginTop: 4,
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#FEB623',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginBtnText: {
    fontWeight: '700',
    color: '#1A1A1A',
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
  },
  proTipContent: {
    position: 'relative',
  },
  proTipTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEB623',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  proTipTagText: {
    color: '#1A1A1A',
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
