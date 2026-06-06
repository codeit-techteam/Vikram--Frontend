import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { POPULAR_SEARCH_TERMS } from '@utils/searchUtils';
import { useTranslation } from '@store/languageStore';

interface SearchEmptyStateProps {
  query: string;
  onSuggestionPress: (term: string) => void;
}

export function SearchEmptyState({ query, onSuggestionPress }: SearchEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.illustration}>
        <Ionicons name="cube-outline" size={48} color="#FF6A00" />
      </View>

      <Text style={styles.title}>
        {t('noResultsFor')} &quot;{query}&quot;
      </Text>

      <Text style={styles.subtitle}>{t('trySearchingFor')}</Text>

      <View style={styles.chipRow}>
        {POPULAR_SEARCH_TERMS.map((term) => (
          <ScaledPressable
            key={term}
            style={styles.chip}
            onPress={async () => {
              await Haptics.selectionAsync();
              onSuggestionPress(term);
            }}>
            <Text style={styles.chipText}>{term}</Text>
          </ScaledPressable>
        ))}
      </View>

      <Pressable
        style={styles.browseLink}
        onPress={async () => {
          await Haptics.selectionAsync();
          router.push('/(tabs)/catalog' as Href);
        }}>
        <Text style={styles.browseText}>{t('browseAllCategories')}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FF6A00" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6A00',
    backgroundColor: '#FFF8F3',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6A00',
  },
  browseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
  },
  browseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6A00',
  },
});
