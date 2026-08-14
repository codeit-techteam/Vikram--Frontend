import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '@store/languageStore';

export interface SearchBarRef {
  focus: () => void;
}

interface SearchBarProps {
  query: string;
  isActive?: boolean;
  embedded?: boolean;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onSubmit: () => void;
  onClear: () => void;
  onVoicePress: () => void;
  editable?: boolean;
  autoFocus?: boolean;
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(function SearchBar(
  {
    query,
    isActive = false,
    embedded = false,
    onChangeText,
    onFocus,
    onSubmit,
    onClear,
    onVoicePress,
    editable = true,
    autoFocus = false,
  },
  ref,
) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const handlePress = async () => {
    if (!isActive) {
      await Haptics.selectionAsync();
      onFocus?.();
    }
  };

  const inputProps: TextInputProps = {
    value: query,
    onChangeText,
    placeholder: t('searchPlaceholder'),
    placeholderTextColor: '#AAAAAA',
    returnKeyType: 'search',
    onSubmitEditing: onSubmit,
    autoFocus,
    editable,
    blurOnSubmit: false,
    accessibilityLabel: t('searchPlaceholder'),
    style: styles.input,
  };

  const containerStyle = [
    styles.container,
    embedded && styles.containerEmbedded,
    isActive && styles.containerActive,
  ];

  if (!isActive) {
    return (
      <View style={containerStyle}>
        <Pressable style={styles.idlePressable} onPress={handlePress}>
          <Ionicons name="search-outline" size={18} color="#FEB623" />
          <Text style={styles.placeholder}>{t('searchPlaceholder')}</Text>
        </Pressable>
        <Pressable
          onPress={async (e) => {
            e.stopPropagation?.();
            await Haptics.selectionAsync();
            onVoicePress();
          }}
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="mic-outline" size={20} color="#FEB623" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Ionicons name="search-outline" size={18} color="#FEB623" />
      <TextInput ref={inputRef} {...inputProps} />
      {query.length > 0 ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={20} color="#999" />
        </Pressable>
      ) : null}
      <View style={styles.inputDivider} />
      <Pressable
        onPress={onVoicePress}
        hitSlop={10}
        style={styles.micButton}
        accessibilityRole="button"
        accessibilityLabel="Voice search">
        <Ionicons name="mic-outline" size={20} color="#FEB623" />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  containerEmbedded: {
    marginHorizontal: 0,
    marginTop: 0,
    width: '100%',
  },
  containerActive: {
    marginHorizontal: 0,
    marginTop: 0,
    flex: 1,
    borderColor: '#FEB623',
  },
  idlePressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: '#AAAAAA',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  micButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
