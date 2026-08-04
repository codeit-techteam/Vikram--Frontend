import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { CmsQuickAction } from '@/types/cms';
import { navigateCmsRedirect } from '@utils/cmsAdapters';
import { resolveCmsImageSource } from '@utils/cmsMedia';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bulk: 'cube-outline',
  whatsapp: 'logo-whatsapp',
  call: 'call-outline',
  membership: 'diamond-outline',
  track: 'navigate-outline',
  refer: 'gift-outline',
  expert: 'construct-outline',
};

interface QuickActionsRowProps {
  actions: CmsQuickAction[];
}

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  if (!actions.length) return null;

  const onPress = async (action: CmsQuickAction) => {
    await Haptics.selectionAsync();
    navigateCmsRedirect(action.redirectType, action.redirectId);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {actions.map((action) => {
        const iconName = ICON_MAP[action.iconKey || ''] || 'apps-outline';
        return (
          <Pressable
            key={action.id}
            onPress={() => void onPress(action)}
            style={styles.item}
            accessibilityRole="button">
            <View style={styles.iconWrap}>
              {action.iconUrl ? (
                <Image
                  source={resolveCmsImageSource(action.iconUrl)}
                  style={styles.iconImage}
                  contentFit="contain"
                />
              ) : (
                <Ionicons name={iconName} size={22} color="#1A1A1A" />
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    width: 72,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});
