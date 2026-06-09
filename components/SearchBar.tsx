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
    style: styles.input,
  };

  if (!isActive) {
    return (
      <View style={styles.container}>
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="mic-outline" size={20} color="#FEB623" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.containerActive]}>
      <Ionicons name="search-outline" size={18} color="#FEB623" />
      <TextInput ref={inputRef} {...inputProps} />
      {query.length > 0 ? (
        <Pressable onPress={onClear} hitSlop={10}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </Pressable>
      ) : (
        <Pressable onPress={onVoicePress} hitSlop={10}>
          <Ionicons name="mic-outline" size={20} color="#FEB623" />
        </Pressable>
      )}
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
});
