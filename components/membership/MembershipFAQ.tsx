import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type { MembershipFaqItem } from '@constants/membership';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MembershipFAQProps {
  items: MembershipFaqItem[];
}

export function MembershipFAQ({ items }: MembershipFAQProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <View key={item.id} style={styles.item}>
            <ScaledPressable
              scaleTo={0.98}
              onPress={() => toggle(item.id)}
              style={styles.header}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}>
              <Text style={styles.question}>{item.question}</Text>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#666666"
              />
            </ScaledPressable>
            {open ? <Text style={styles.answer}>{item.answer}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  answer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 13,
    lineHeight: 20,
    color: '#666666',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFEFEF',
    paddingTop: 12,
  },
});
