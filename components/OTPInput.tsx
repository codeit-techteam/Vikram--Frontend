import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
}

export function OTPInput({ length = 6, onComplete, onChange }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const updateOtp = (newOtp: string[]) => {
    setOtp(newOtp);
    const value = newOtp.join('');
    onChange?.(value);
    if (value.length === length && !newOtp.includes('')) {
      onComplete(value);
    }
  };

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    updateOtp(newOtp);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      updateOtp(newOtp);
    }
  };

  return (
    <View className="flex-row justify-between gap-2">
      {Array.from({ length }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => inputRefs.current[index]?.focus()}
          className="flex-1">
          <TextInput
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={otp[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            className="h-12 rounded-input border border-border bg-surface text-center text-lg font-semibold text-text"
          />
        </Pressable>
      ))}
    </View>
  );
}
