import { ActivityIndicator, Text } from 'react-native';

import { ScaledPressable } from '@components/ScaledPressable';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  showArrow = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <ScaledPressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-[52px] w-full items-center justify-center rounded-pill ${
        isDisabled ? 'bg-disabled' : 'bg-primary'
      }`}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text className="text-base font-bold text-text-inverse">
          {title}
          {showArrow ? ' →' : ''}
        </Text>
      )}
    </ScaledPressable>
  );
}
