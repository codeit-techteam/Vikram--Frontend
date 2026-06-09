import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { HighlightedText } from '@components/search/HighlightedText';
import type { Suggestion } from '@utils/searchUtils';

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  query: string;
  onSelect: (term: string) => void;
}

export function SearchSuggestions({ suggestions, query, onSelect }: SearchSuggestionsProps) {
  return (
    <View style={styles.container}>
      {suggestions.map((item) => (
        <Pressable
          key={item.id}
          style={styles.row}
          onPress={async () => {
            await Haptics.selectionAsync();
            onSelect(item.text);
          }}>
          <Ionicons name="search-outline" size={18} color="#FEB623" />
          <View style={styles.content}>
            <HighlightedText text={item.text} query={query} style={styles.title} />
            {item.category ? (
              <Text style={styles.category}>Category: {item.category}</Text>
            ) : null}
          </View>
          <Ionicons name="arrow-forward" size={16} color="#CCC" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  category: {
    marginTop: 2,
    fontSize: 12,
    color: '#999',
  },
});
