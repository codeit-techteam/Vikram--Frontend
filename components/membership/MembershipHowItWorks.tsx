import { StyleSheet, Text, View } from 'react-native';

import type { MembershipHowItWorksStep } from '@constants/membership';

interface MembershipHowItWorksProps {
  steps: MembershipHowItWorksStep[];
}

export function MembershipHowItWorks({ steps }: MembershipHowItWorksProps) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => (
        <View key={step.id}>
          <View style={styles.row}>
            <View style={styles.dot}>
              <Text style={styles.dotText}>{index + 1}</Text>
            </View>
            <Text style={styles.label}>{step.label}</Text>
          </View>
          {index < steps.length - 1 ? (
            <View style={styles.connector}>
              <Text style={styles.arrow}>↓</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  connector: {
    paddingLeft: 6,
    paddingVertical: 4,
  },
  arrow: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '600',
  },
});
