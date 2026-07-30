import { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { AppIcon } from '@components/ui/AppIcon';
import { ICON_SIZE } from '@constants/icons';
import { layout } from '@constants/spacing';
import { theme } from '@constants/theme';

interface SearchHeaderProps {
  placeholder?: string;
  onPress: () => void;
  onVoicePress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared floating search bar — Home, Catalog, Category, Search, Wishlist.
 */
function SearchHeaderComponent({
  placeholder = 'Search cement, steel, sand...',
  onPress,
  onVoicePress,
  style,
}: SearchHeaderProps) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.bar, style]}
      accessibilityRole="search">
      <AppIcon name="search" size={ICON_SIZE.action} color={theme.primary} />
      <Text style={styles.placeholder} numberOfLines={1}>
        {placeholder}
      </Text>
      {onVoicePress ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            void Haptics.selectionAsync();
            onVoicePress();
          }}
          hitSlop={8}
          style={styles.mic}
          accessibilityLabel="Voice search">
          <AppIcon name="voice" size={ICON_SIZE.action} color={theme.primary} />
        </Pressable>
      ) : (
        <View style={styles.mic} />
      )}
    </Pressable>
  );
}

export const SearchHeader = memo(SearchHeaderComponent);

const styles = StyleSheet.create({
  bar: {
    height: layout.searchHeight,
    borderRadius: layout.searchHeight / 2,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: theme.textMuted,
  },
  mic: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
