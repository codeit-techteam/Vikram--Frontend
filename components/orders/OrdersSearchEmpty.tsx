import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';

interface OrdersSearchEmptyProps {
  query: string;
  onClear: () => void;
}

export function OrdersSearchEmpty({ query, onClear }: OrdersSearchEmptyProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="search-outline" size={32} color="#FEB623" />
      </View>
      <Text style={styles.title}>{t('noOrdersFound')}</Text>
      <Text style={styles.subtitle}>
        {t('noOrdersMatch').replace('{{query}}', query)}
      </Text>
      <ScaledPressable style={styles.button} onPress={onClear}>
        <Text style={styles.buttonText}>{t('clearSearch')}</Text>
      </ScaledPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
