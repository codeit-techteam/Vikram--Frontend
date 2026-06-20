import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface FormFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: IconName;
  error?: string | null;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  prefix?: string;
}

export function FormField({
  label,
  required,
  placeholder,
  value,
  onChangeText,
  icon,
  error,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
  maxLength,
  prefix,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          multiline && { alignItems: 'flex-start', paddingVertical: 10 },
        ]}>
        <Ionicons
          name={icon}
          size={17}
          color={focused ? '#FEB623' : '#999'}
          style={{ marginTop: multiline ? 2 : 0 }}
        />
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, multiline && { height: 70, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor="#AAAAAA"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 7,
  },
  required: { color: '#FF3B30' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  inputWrapperFocused: {
    borderColor: '#FEB623',
    backgroundColor: '#FFFBF0',
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
});
