import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLoyaltyStore } from '@store/loyaltyStore';
import { useTranslation } from '@store/languageStore';

interface LoyaltyCardProps {
  onPress: () => void;
  points?: number;
}

export function LoyaltyCard({ onPress, points }: LoyaltyCardProps) {
  const { t } = useTranslation();
  const totalPoints = useLoyaltyStore((s) => s.totalPoints);
  const refresh = useLoyaltyStore((s) => s.refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const displayPoints = points ?? totalPoints;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>BajriPro Points</Text>
        <Text style={styles.pointsText}>
          {displayPoints.toLocaleString('en-IN')} {t('points')}
        </Text>
      </View>
      <Text style={styles.earn}>{t('earnPoints')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pointsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  earn: {
    fontSize: 12,
    color: '#FEB623',
    marginTop: 6,
  },
});
