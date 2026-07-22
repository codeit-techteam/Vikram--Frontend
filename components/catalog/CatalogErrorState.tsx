import { Text, View } from 'react-native';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';

interface CatalogErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function CatalogErrorState({ message, onRetry }: CatalogErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View className="items-center justify-center px-8 py-16">
      <Text className="text-center text-base font-semibold text-text">
        {message ?? t('unableToLoadProducts')}
      </Text>
      {onRetry ? (
        <ScaledPressable
          onPress={onRetry}
          className="mt-4 rounded-pill bg-primary px-8 py-2.5">
          <Text className="text-sm font-bold text-onPrimary">{t('retry')}</Text>
        </ScaledPressable>
      ) : null}
    </View>
  );
}
