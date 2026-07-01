import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const WARM_BORDER = '#E8E0C8';
const ERROR = '#FF3B30';

const MOBILE_LENGTH = 10;
const NON_DIGIT_REGEX = /\D/g;

export const MOBILE_VALIDATION_MESSAGE = 'Please enter a valid 10-digit mobile number.';

interface MobileInputProps {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
  showError?: boolean;
}

export function sanitizeMobileInput(value: string): string {
  return value.replace(NON_DIGIT_REGEX, '').slice(0, MOBILE_LENGTH);
}

export function isValidMobileNumber(value: string): boolean {
  return sanitizeMobileInput(value).length === MOBILE_LENGTH;
}

export function getMobileValidationError(value: string, showError: boolean): string | null {
  if (!showError) return null;
  if (isValidMobileNumber(value)) return null;
  return MOBILE_VALIDATION_MESSAGE;
}

export function MobileInput({
  value,
  onChangeText,
  label,
  placeholder = 'Enter mobile number',
  error,
  showError = false,
}: MobileInputProps) {
  const [focused, setFocused] = useState(false);
  const validationError = error ?? getMobileValidationError(value, showError);
  const hasError = Boolean(validationError);

  const handleChange = (text: string) => {
    onChangeText(sanitizeMobileInput(text));
  };

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && !hasError && styles.inputRowFocused,
          hasError && styles.inputRowError,
        ]}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+91</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#BBAA88"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={MOBILE_LENGTH}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {validationError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={ERROR} />
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: WARM_BORDER,
    overflow: 'hidden',
  },
  inputRowFocused: {
    borderColor: GOLD,
  },
  inputRowError: {
    borderColor: ERROR,
  },
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: WARM_BORDER,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: DARK,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    flex: 1,
  },
});
