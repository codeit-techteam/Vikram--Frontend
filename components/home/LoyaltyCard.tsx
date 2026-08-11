import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedProgressBar } from '@components/AnimatedProgressBar';
import { useLoyaltyStore } from '@store/loyaltyStore';
import { useTranslation } from '@store/languageStore';

interface LoyaltyCardProps {
  onPress: () => void;
  points?: number;
  progress?: number;
}

export function LoyaltyCard({
  onPress,
  points,
  progress,
}: LoyaltyCardProps) {
  const { t } = useTranslation();
  const totalPoints = useLoyaltyStore((s) => s.totalPoints);
  const tierProgress = useLoyaltyStore((s) => s.progressPercent);
  const tier = useLoyaltyStore((s) => s.tier);
  const nextTier = useLoyaltyStore((s) => s.nextTier);
  const refresh = useLoyaltyStore((s) => s.refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const displayPoints = points ?? totalPoints;
  const displayProgress =
    progress ?? Math.min(1, Math.max(0, tierProgress / 100));

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{tier}</Text>
        </View>
        <Text style={styles.pointsText}>
          {displayPoints.toLocaleString('en-IN')} {t('points')}
        </Text>
      </View>
      <View style={styles.midRow}>
        <Text style={styles.title}>{t('loyaltyProgress')}</Text>
        <Text style={styles.next}>
          {nextTier ? `${nextTier} →` : 'Max tier'}
        </Text>
      </View>
      <AnimatedProgressBar progress={displayProgress} height={5} />
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
  tierBadge: {
    borderWidth: 1.5,
    borderColor: '#FEB623',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEB623',
  },
  pointsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  next: {
    fontSize: 13,
    color: '#FEB623',
    fontWeight: '600',
  },
  earn: {
    fontSize: 12,
    color: '#FEB623',
    marginTop: 6,
  },
});
