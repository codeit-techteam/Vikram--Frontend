import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BUNDLE_ORIGINAL_PRICE,
  BUNDLE_PRICE,
  BUNDLE_PRODUCT_IDS,
  SEARCH_CATEGORIES,
  formatSearchPrice,
  getInstantSuggestions,
  getResults,
  getSearchProductById,
  searchProductToCartItem,
  type SearchProduct,
} from '@constants/searchData';
import { getProductImageUrl } from '@constants/catalogData';
import { useCartStore } from '@store/cartStore';
import { useSearchStore } from '@store/searchStore';
import { safeGoBack } from '@utils/navigation';

type SearchState = 'empty' | 'typing' | 'results';

function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
}: {
  text: string;
  query: string;
  style?: object;
  highlightStyle?: object;
}) {
  if (!query.trim()) {
    return <Text style={style}>{text}</Text>;
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) {
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={[{ color: '#FF6B00', fontWeight: '700' }, highlightStyle]}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

function CategoryPill({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.categoryPill,
        selected ? styles.categoryPillSelected : styles.categoryPillDefault,
      ]}>
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function AddButton({ product }: { product: SearchProduct }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleAdd = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    scale.value = withSequence(
      withSpring(1.25, { damping: 6, stiffness: 300 }),
      withSpring(1.0, { damping: 8 }),
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(searchProductToCartItem(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => handleAdd()}
        hitSlop={8}
        style={[styles.addButton, added && styles.addButtonAdded]}>
        <Ionicons
          name={added ? 'checkmark' : 'add'}
          size={18}
          color={added ? '#2E7D32' : '#FF6B00'}
        />
      </Pressable>
    </Animated.View>
  );
}

function SearchResultItem({
  item,
  query,
  index,
  onPress,
}: {
  item: SearchProduct;
  query: string;
  index: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 250 }));
    translateY.value = withDelay(index * 60, withTiming(0, { duration: 250 }));
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.resultImageWrap}>
          <Image
            source={{ uri: getProductImageUrl(item.image, '160x160') }}
            style={styles.resultImage}
            contentFit="cover"
          />
          {item.badge ? (
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor:
                    item.badgeColor ?? (item.badge === 'TRENDING' ? '#FF6B00' : '#1A73E8'),
                },
              ]}>
              <Text style={styles.resultBadgeText}>{item.badge}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultCategory}>{item.category.toUpperCase()}</Text>
          <HighlightedText text={item.name} query={query} style={styles.resultName} />
          <View style={styles.resultPriceRow}>
            <Text style={styles.resultPriceValue}>{formatSearchPrice(item.price)}</Text>
            <Text style={styles.resultPriceUnit}>/ {item.unit}</Text>
          </View>
        </View>
        <AddButton product={item} />
      </Pressable>
    </Animated.View>
  );
}

function BundleCard({ onAddBundle }: { onAddBundle: () => void }) {
  const cementProduct = getSearchProductById(BUNDLE_PRODUCT_IDS[0]);

  return (
    <View style={styles.bundleCard}>
      <View style={styles.bundleHeader}>
        <Text style={styles.bundleStar}>✦</Text>
        <Text style={styles.bundleLabel}>Frequently Purchased Together</Text>
      </View>

      <View style={styles.bundleItems}>
        <View style={styles.bundleProduct}>
          <Image
            source={{ uri: getProductImageUrl(cementProduct?.image ?? 'cement bags', '200x160') }}
            style={styles.bundleProductImage}
            contentFit="cover"
          />
          <Text style={styles.bundleProductName}>UltraTech PPC</Text>
        </View>

        <Text style={styles.bundlePlus}>+</Text>

        <View style={styles.bundleProduct}>
          <View style={styles.bundlePlaceholder}>
            <Ionicons name="reorder-three-outline" size={28} color="#999" />
          </View>
          <Text style={styles.bundleProductName}>JSW TMT Bars</Text>
        </View>

        <Text style={styles.bundlePlus}>+</Text>

        <View style={[styles.bundleProduct, styles.bundleProductNarrow]}>
          <View style={[styles.bundlePlaceholder, styles.bundlePlaceholderNarrow]}>
            <Ionicons name="grid-outline" size={28} color="#999" />
          </View>
          <Text style={styles.bundleProductName}>Stone Chips</Text>
        </View>
      </View>

      <View style={styles.bundleFooter}>
        <View>
          <Text style={styles.bundleStrike}>{formatSearchPrice(BUNDLE_ORIGINAL_PRICE)}</Text>
          <Text style={styles.bundlePrice}>{formatSearchPrice(BUNDLE_PRICE)}</Text>
        </View>
        <Pressable onPress={onAddBundle} style={styles.bundleButton}>
          <Text style={styles.bundleButtonText}>Add Bundle</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const recentSearches = useSearchStore((s) => s.recentSearches);
  const recentlyViewed = useSearchStore((s) => s.recentlyViewed);
  const addRecentSearch = useSearchStore((s) => s.addRecentSearch);
  const clearRecentSearches = useSearchStore((s) => s.clearRecentSearches);
  const addRecentlyViewed = useSearchStore((s) => s.addRecentlyViewed);
  const addItem = useCartStore((s) => s.addItem);

  const suggestionsHeight = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setResults(getResults(query, selectedCategory));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  const searchState: SearchState = useMemo(() => {
    if (query.length === 0) return 'empty';
    if (query !== debouncedQuery) return 'typing';
    return 'results';
  }, [query, debouncedQuery]);

  const suggestions = useMemo(() => getInstantSuggestions(query), [query]);

  const showBundle = useMemo(
    () => searchState === 'results' && results.some((p) => p.category === 'cement'),
    [searchState, results],
  );

  const suggestionsAnimStyle = useAnimatedStyle(() => ({
    opacity: suggestionsHeight.value,
    maxHeight: suggestionsHeight.value * 300,
  }));

  useEffect(() => {
    suggestionsHeight.value = withSpring(searchState === 'typing' && suggestions.length > 0 ? 1 : 0, {
      damping: 14,
    });
  }, [searchState, suggestions.length, suggestionsHeight]);

  const handleBack = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setSelectedCategory(null);
    Keyboard.dismiss();
    safeGoBack();
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    Keyboard.dismiss();
  }, [query, addRecentSearch]);

  const handleSelectTerm = useCallback(
    (term: string) => {
      setQuery(term);
      addRecentSearch(term);
      Keyboard.dismiss();
    },
    [addRecentSearch],
  );

  const handleProductPress = useCallback(
    (product: SearchProduct) => {
      addRecentlyViewed(product);
      if (query.trim()) addRecentSearch(query.trim());
      router.push(`/products/detail/${product.id}` as Href);
    },
    [addRecentlyViewed, addRecentSearch, query],
  );

  const handleCategoryPress = useCallback((id: string) => {
    setSelectedCategory((prev) => (prev === id ? null : id));
  }, []);

  const handleAddBundle = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    BUNDLE_PRODUCT_IDS.forEach((id) => {
      const product = getSearchProductById(id);
      if (product) addItem(searchProductToCartItem(product));
    });
  }, [addItem]);

  const renderResultItem = useCallback(
    ({ item, index }: { item: SearchProduct; index: number }) => (
      <SearchResultItem
        item={item}
        query={debouncedQuery}
        index={index}
        onPress={() => handleProductPress(item)}
      />
    ),
    [debouncedQuery, handleProductPress],
  );

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'card',
          animation: 'fade',
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} hitSlop={12} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
            </Pressable>

            <View
              style={[
                styles.searchContainer,
                { borderColor: focused ? '#FF6B00' : '#E0E0E0' },
              ]}>
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search cement, steel, sand, bricks..."
                placeholderTextColor="#AAAAAA"
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={styles.input}
              />

              {query.length > 0 ? (
                <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
                  <Ionicons name="close" size={18} color="#999" />
                </Pressable>
              ) : null}

              <View style={styles.inputDivider} />

              <Pressable
                onPress={() => router.push('/voice-assistant' as Href)}
                hitSlop={8}
                style={styles.micButton}>
                <Ionicons name="mic-outline" size={20} color="#FF6B00" />
              </Pressable>
            </View>
          </View>

          {searchState === 'typing' && suggestions.length > 0 ? (
            <Animated.View style={[styles.suggestionsDropdown, suggestionsAnimStyle]}>
              {suggestions.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectTerm(item.name)}
                  style={styles.suggestionRow}>
                  <Ionicons name="search" size={16} color="#999" />
                  <HighlightedText text={item.name} query={query} style={styles.suggestionText} />
                </Pressable>
              ))}
            </Animated.View>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}>
              {SEARCH_CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  selected={selectedCategory === cat.id}
                  onPress={() => handleCategoryPress(cat.id)}
                />
              ))}
            </ScrollView>

            {recentSearches.length > 0 ? (
              <Animated.View entering={FadeIn.delay(50).duration(300)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Recent Searches</Text>
                  <Pressable onPress={clearRecentSearches}>
                    <Text style={styles.clearAll}>Clear All</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    {recentSearches.map((term) => (
                      <Pressable
                        key={term}
                        onPress={() => handleSelectTerm(term)}
                        style={styles.recentChip}>
                        <Ionicons name="time-outline" size={13} color="#999" />
                        <Text style={styles.recentChipText}>{term}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </Animated.View>
            ) : null}

            {searchState === 'results' ? (
              <View style={styles.resultsSection}>
                {results.length > 0 ? (
                  <>
                    <Text style={styles.resultsTitle}>Search Results</Text>
                    <FlatList
                      data={results}
                      keyExtractor={(item) => item.id}
                      renderItem={renderResultItem}
                      scrollEnabled={false}
                    />
                  </>
                ) : (
                  <View style={styles.emptyResults}>
                    <Ionicons name="search" size={48} color="#CCC" />
                    <Text style={styles.emptyResultsTitle}>No results for '{debouncedQuery}'</Text>
                    <Text style={styles.emptyResultsHint}>
                      Try searching cement, steel, sand, bricks
                    </Text>
                    <Pressable onPress={() => router.push('/(tabs)/catalog' as Href)}>
                      <Text style={styles.browseLink}>Browse All Categories →</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}

            {showBundle ? (
              <View style={styles.bundleWrap}>
                <BundleCard onAddBundle={handleAddBundle} />
              </View>
            ) : null}

            {recentlyViewed.length > 0 ? (
              <View style={styles.recentlyViewedSection}>
                <Text style={styles.sectionLabel}>Recently Viewed</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.recentlyViewedRow}>
                    {recentlyViewed.map((product) => (
                      <Pressable
                        key={product.id}
                        onPress={() => handleProductPress(product)}
                        style={styles.recentlyViewedCard}>
                        <Image
                          source={{ uri: getProductImageUrl(product.image, '112x112') }}
                          style={styles.recentlyViewedImage}
                          contentFit="cover"
                        />
                        <View style={styles.recentlyViewedInfo}>
                          <Text style={styles.recentlyViewedName} numberOfLines={2}>
                            {product.name}
                          </Text>
                          <Text style={styles.recentlyViewedPrice}>
                            {formatSearchPrice(product.price)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  clearButton: {
    paddingLeft: 6,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  micButton: {
    padding: 2,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 64,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  categoriesRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryPillSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  categoryPillDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#999',
    textTransform: 'uppercase',
  },
  clearAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B00',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  recentChipText: {
    fontSize: 13,
    color: '#333',
  },
  resultsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultImageWrap: {
    position: 'relative',
    marginRight: 12,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  resultBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultInfo: {
    flex: 1,
  },
  resultCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  resultPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  resultPriceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B00',
  },
  resultPriceUnit: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addButtonAdded: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  bundleWrap: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  bundleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F4FF',
    padding: 16,
  },
  bundleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  bundleStar: {
    fontSize: 13,
    color: '#FF6B00',
  },
  bundleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B00',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bundleItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  bundleProduct: {
    alignItems: 'center',
    width: 100,
  },
  bundleProductNarrow: {
    width: 90,
  },
  bundleProductImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  bundlePlaceholder: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E8EAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundlePlaceholderNarrow: {
    width: 90,
  },
  bundleProductName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    color: '#1A1A1A',
  },
  bundlePlus: {
    fontSize: 18,
    color: '#999',
    fontWeight: '300',
  },
  bundleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bundleStrike: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  bundlePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  bundleButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  bundleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentlyViewedSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  recentlyViewedRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  recentlyViewedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 8,
    width: 140,
  },
  recentlyViewedImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  recentlyViewedInfo: {
    flex: 1,
  },
  recentlyViewedName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 15,
  },
  recentlyViewedPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
    marginTop: 2,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  emptyResultsHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  browseLink: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
  },
});
