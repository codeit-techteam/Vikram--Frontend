import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import type { CmsEmergencyBanner } from '@/types/cms';
import { navigateCmsRedirect } from '@utils/cmsAdapters';

const DISMISS_KEY = 'cms:emergency-banner:dismissed';

interface EmergencyBannerStripProps {
  banner: CmsEmergencyBanner | null;
}

export function EmergencyBannerStrip({ banner }: EmergencyBannerStripProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(DISMISS_KEY).then((value) => {
      setDismissedId(value);
    });
  }, []);

  if (!banner || dismissedId === banner.id) return null;

  const onPress = async () => {
    await Haptics.selectionAsync();
    if (banner.linkTarget || banner.linkUrl) {
      navigateCmsRedirect('ROUTE', banner.linkTarget ?? banner.linkUrl);
    }
  };

  const onDismiss = async () => {
    await AsyncStorage.setItem(DISMISS_KEY, banner.id);
    setDismissedId(banner.id);
  };

  return (
    <Pressable onPress={() => void onPress()} style={styles.strip}>
      <View style={styles.content}>
        <Ionicons name="alert-circle" size={16} color="#1A1A1A" />
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {banner.title}
          </Text>
          {banner.body ? (
            <Text style={styles.body} numberOfLines={1}>
              {banner.body}
            </Text>
          ) : null}
        </View>
      </View>
      {banner.dismissible ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            void onDismiss();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dismiss">
          <Ionicons name="close" size={18} color="#1A1A1A" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FEB623',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  body: {
    fontSize: 11,
    color: '#333',
    marginTop: 1,
  },
});
