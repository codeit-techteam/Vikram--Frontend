import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MembershipBenefitItem } from '@constants/membership';

interface MembershipBenefitCardProps {
  benefit: MembershipBenefitItem;
}

export function MembershipBenefitCard({ benefit }: MembershipBenefitCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={benefit.icon} size={22} color="#1A1A1A" />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {benefit.label}
      </Text>
    </View>
  );
}

interface MembershipBenefitsGridProps {
  benefits: MembershipBenefitItem[];
}

export function MembershipBenefitsGrid({ benefits }: MembershipBenefitsGridProps) {
  return (
    <View style={styles.grid}>
      {benefits.map((item) => (
        <View key={item.id} style={styles.cell}>
          <MembershipBenefitCard benefit={item} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cell: {
    width: '50%',
    padding: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 17,
  },
});
