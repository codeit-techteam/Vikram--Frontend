import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import type { SearchCategoryChip } from '@components/search/RecentSearches';
import { useTranslation } from '@store/languageStore';

interface SearchEmptyStateProps {
  query: string;
  categories?: SearchCategoryChip[];
  onSuggestionPress: (term: string) => void;
  onCategorySelect?: (term: string, slug?: string) => void;
}

export function SearchEmptyState({
  query,
  categories = [],
  onSuggestionPress,
  onCategorySelect,
}: SearchEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.illustration}>
        <Ionicons name="search-outline" size={40} color="#FEB623" />
      </View>

      <Text style={styles.title}>No products found</Text>
      <Text style={styles.subtitle}>
        We couldn’t find anything matching{'\n'}“{query}”
      </Text>

      <Text style={styles.hintTitle}>Try:</Text>
      <Text style={styles.hint}>• checking the spelling</Text>
      <Text style={styles.hint}>• searching by brand</Text>
      <Text style={styles.hint}>• searching by material / category</Text>

      {categories.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>{t('popularCategories')}</Text>
          <View style={styles.chipRow}>
            {categories.slice(0, 6).map((cat) => (
              <ScaledPressable
                key={cat.id}
                style={styles.chip}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  if (onCategorySelect) onCategorySelect(cat.label, cat.id);
                  else onSuggestionPress(cat.label);
                }}
                accessibilityRole="button"
                accessibilityLabel={cat.label}>
                <Text style={styles.chipIcon}>{cat.icon}</Text>
                <Text style={styles.chipText}>{cat.label}</Text>
              </ScaledPressable>
            ))}
          </View>
        </>
      ) : null}

      <Pressable
        style={styles.browseLink}
        onPress={async () => {
          await Haptics.selectionAsync();
          onSuggestionPress('Cement');
        }}
        accessibilityRole="button">
        <Text style={styles.browseText}>{t('trySearching')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  illustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
  },
  hintTitle: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    alignSelf: 'flex-start',
  },
  hint: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    alignSelf: 'flex-start',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
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
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  browseLink: {
    marginTop: 24,
  },
  browseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FEB623',
  },
});
