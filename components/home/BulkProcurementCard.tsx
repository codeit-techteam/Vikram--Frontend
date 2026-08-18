import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '@store/languageStore';
import type { CmsPromotion } from '@/types/cms';

interface BulkProcurementCardProps {
  onKnowMore: () => void;
  promotion?: CmsPromotion | null;
}

function isRemovedBenefit(label: string): boolean {
  const value = label.trim().toLowerCase();
  return (
    value.includes('unlock discount') ||
    value.includes('international trips') ||
    value.includes('lucky draw') ||
    value.includes('loyalty points') ||
    value.includes('15% तक छूट') ||
    value.includes('अंतरराष्ट्रीय यात्राएं') ||
    value.includes('लकी ड्रॉ') ||
    value.includes('लॉयल्टी पॉइंट्स')
  );
}

export function BulkProcurementCard({
  onKnowMore,
  promotion,
}: BulkProcurementCardProps) {
  const { t } = useTranslation();

  if (!promotion) return null;

  const handlePress = async () => {
    await Haptics.selectionAsync();
    onKnowMore();
  };

  const eyebrow = promotion.description ?? t('bulkProcurementSection');
  const badge = promotion.badge ?? t('enquire');
  const title = promotion.title || t('bulkProcurementCardTitle');
  const subtitle = promotion.subtitle ?? t('bulkProcurementCardSubtitle');
  const sourceBenefits = promotion.benefits?.length ? promotion.benefits : [];
  const benefits = sourceBenefits.filter((label) => !isRemovedBenefit(label));
  const cmsCta = promotion.buttonText?.trim();
  const buttonText =
    !cmsCta || cmsCta.toLowerCase() === 'enquire'
      ? t('enquireNow')
      : cmsCta;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Pressable
          onPress={handlePress}
          style={styles.unlockBadge}
          accessibilityRole="button"
          accessibilityLabel={buttonText}>
          <Ionicons name="diamond-outline" size={12} color="#1A1A1A" />
          <Text style={styles.unlockBadgeText}>{badge}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {benefits.length > 0 ? (
        <View style={styles.list}>
          {benefits.map((label) => (
            <View key={label} style={styles.row}>
              <Ionicons name="checkmark-circle" size={18} color="#FEB623" />
              <Text style={styles.rowText}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable onPress={handlePress} style={styles.cta} accessibilityRole="button">
        <Text style={styles.ctaText}>{buttonText}</Text>
        <Ionicons name="arrow-forward" size={18} color="#1A1A1A" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },
  unlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEB623',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unlockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    flex: 1,
  },
  cta: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
