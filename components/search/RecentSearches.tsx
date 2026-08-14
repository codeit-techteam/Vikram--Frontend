import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';

export interface SearchCategoryChip {
  id: string;
  label: string;
  icon: string;
}

interface RecentSearchesProps {
  recentSearches: string[];
  isLoading: boolean;
  categories: SearchCategoryChip[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClearAll: () => void;
  onCategorySelect: (term: string, slug?: string) => void;
}

export function RecentSearches({
  recentSearches,
  isLoading,
  categories,
  onSelect,
  onRemove,
  onClearAll,
  onCategorySelect,
}: RecentSearchesProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonRow} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {recentSearches.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentSearches')}</Text>
            <Pressable onPress={onClearAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear all recent searches">
              <Text style={styles.clearAll}>{t('clearAll')}</Text>
            </Pressable>
          </View>
          {recentSearches.map((term) => (
            <View key={term} style={styles.recentRow}>
              <Pressable
                style={styles.recentPressable}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  onSelect(term);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Search ${term}`}>
                <Ionicons name="time-outline" size={18} color="#999" />
                <Text style={styles.recentText}>{term}</Text>
              </Pressable>
              <Pressable
                onPress={() => onRemove(term)}
                hitSlop={10}
                style={styles.removeBtn}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${term}`}>
                <Ionicons name="close" size={16} color="#999" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('popularCategories')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled">
          {categories.map((cat) => (
            <ScaledPressable
              key={cat.id}
              style={styles.chip}
              onPress={async () => {
                await Haptics.selectionAsync();
                onCategorySelect(cat.label, cat.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={cat.label}>
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text style={styles.chipLabel}>{cat.label}</Text>
            </ScaledPressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  clearAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FEB623',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    minHeight: 48,
  },
  recentPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  removeBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingRight: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  skeletonRow: {
    height: 48,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
});
