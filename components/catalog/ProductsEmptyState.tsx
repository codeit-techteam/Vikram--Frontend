import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@store/languageStore';

export function ProductsEmptyState() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Ionicons name="cube-outline" size={48} color="#FEB623" />
      </View>
      <Text style={styles.title}>{t('noProductsFound')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});
