import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { safeGoBack } from '@utils/navigation';

interface BackHeaderProps {
  title: string;
  titleColor?: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  backgroundColor?: string;
  borderBottom?: boolean;
}

export function BackHeader({
  title,
  titleColor = '#1A1A1A',
  onBack,
  rightElement,
  backgroundColor = '#FFFFFF',
  borderBottom = true,
}: BackHeaderProps) {
  const handleBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      safeGoBack();
    }
  };

  return (
    <View
      style={[
        styles.header,
        { backgroundColor },
        borderBottom && styles.border,
      ]}>
      <TouchableOpacity
        onPress={handleBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={titleColor} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>{rightElement ?? <View style={{ width: 22 }} />}</View>
    </View>
  );
}

interface YellowBackHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function YellowBackHeader({ title, onBack }: YellowBackHeaderProps) {
  const handleBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      safeGoBack();
    }
  };

  return (
    <View style={styles.yellowHeader}>
      <TouchableOpacity
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.yellowBackBtn}>
        <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
      </TouchableOpacity>
      {title ? <Text style={styles.yellowTitle}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 52,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  right: {
    width: 36,
    alignItems: 'flex-end',
  },
  yellowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEB623',
    gap: 10,
  },
  yellowBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

export default BackHeader;
