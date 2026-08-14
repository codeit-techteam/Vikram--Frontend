import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { useOffers } from '@hooks/useOffers';
import type { CustomerOffer } from '@services/offer.api';
import { resolveCmsImageSource } from '@utils/cmsMedia';
import { formatINR } from '@utils/formatCurrency';
import { navigateToOffer } from '@utils/offerCta';

const PRIMARY = '#FEB623';
const DARK = '#1A1A1A';

type SortKey = 'priority' | 'ending' | 'newest';

const OFFER_TYPES = ['ALL', 'BUNDLE', 'PERCENTAGE', 'FLAT', 'BULK'] as const;

function OfferListCard({ offer }: { offer: CustomerOffer }) {
  const image = resolveCmsImageSource(
    offer.mobileImageUrl || offer.bannerImage || offer.imageUrl,
  );
  const badge = offer.badge || offer.discountLabel;
  return (
    <Pressable style={styles.card} onPress={() => navigateToOffer(offer, 'see_all')}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={image} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Bajriwala</Text>
          </View>
        )}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {offer.title}
        </Text>
        {offer.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {offer.description}
          </Text>
        ) : null}
        {offer.startingFrom ? (
          <Text style={styles.price}>From {formatINR(offer.startingFrom)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function AllOffersScreen() {
  const query = useOffers();
  const [search, setSearch] = useState('');
  const [offerType, setOfferType] = useState<(typeof OFFER_TYPES)[number]>('ALL');
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('priority');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const offer of query.data ?? []) {
      for (const name of offer.categories ?? []) set.add(name);
    }
    return ['ALL', ...Array.from(set).sort()];
  }, [query.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...(query.data ?? [])];
    if (q) {
      list = list.filter(
        (offer) =>
          offer.title.toLowerCase().includes(q) ||
          (offer.description || '').toLowerCase().includes(q),
      );
    }
    if (offerType !== 'ALL') {
      list = list.filter(
        (offer) => offer.offerType.toUpperCase() === offerType,
      );
    }
    if (category !== 'ALL') {
      list = list.filter((offer) => offer.categories?.includes(category));
    }
    list.sort((a, b) => {
      if (sort === 'ending') {
        return (a.endDate || '').localeCompare(b.endDate || '');
      }
      if (sort === 'newest') {
        return (b.startDate || '').localeCompare(a.startDate || '');
      }
      return (b.priority || 0) - (a.priority || 0);
    });
    return list;
  }, [category, offerType, query.data, search, sort]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Offers For You" />
      {query.isLoading && !query.data ? (
        <View style={styles.centered}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : query.error && !query.data ? (
        <CatalogErrorState
          message="Could not load offers."
          onRetry={() => void query.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={PRIMARY}
            />
          }>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search offers"
            placeholderTextColor="#AAAAAA"
            style={styles.search}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {OFFER_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setOfferType(type)}
                style={[styles.chip, offerType === type && styles.chipActive]}>
                <Text
                  style={[
                    styles.chipText,
                    offerType === type && styles.chipTextActive,
                  ]}>
                  {type === 'ALL' ? 'All types' : type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {categories.length > 2 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              {categories.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setCategory(name)}
                  style={[styles.chip, category === name && styles.chipActive]}>
                  <Text
                    style={[
                      styles.chipText,
                      category === name && styles.chipTextActive,
                    ]}>
                    {name === 'ALL' ? 'All categories' : name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.sortRow}>
            {(
              [
                ['priority', 'Priority'],
                ['ending', 'Ending soon'],
                ['newest', 'Newest'],
              ] as const
            ).map(([key, label]) => (
              <Pressable key={key} onPress={() => setSort(key)}>
                <Text style={[styles.sort, sort === key && styles.sortActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {rows.length === 0 ? (
            <Text style={styles.empty}>No offers match these filters.</Text>
          ) : (
            rows.map((offer) => <OfferListCard key={offer.id} offer={offer} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  search: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    fontSize: 14,
    color: DARK,
  },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F5F5F5',
  },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  chipTextActive: { color: DARK },
  sortRow: { flexDirection: 'row', gap: 16 },
  sort: { fontSize: 13, color: '#888', fontWeight: '600' },
  sortActive: { color: DARK },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  imageWrap: { height: 140, backgroundColor: '#FFF8E8' },
  image: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  fallbackText: { fontSize: 18, fontWeight: '800', color: DARK },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: DARK },
  body: { padding: 12, gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: DARK },
  desc: { fontSize: 13, color: '#666' },
  price: { fontSize: 14, fontWeight: '700', color: DARK, marginTop: 4 },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
