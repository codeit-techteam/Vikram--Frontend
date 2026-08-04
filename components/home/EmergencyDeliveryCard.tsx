import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { CmsPromotion } from '@/types/cms';
import { useDeliveryEta } from '@hooks/useDeliveryEta';

interface EmergencyDeliveryCardProps {
  onOrderNow: () => void;
  promotion?: CmsPromotion | null;
}

export function EmergencyDeliveryCard({
  onOrderNow,
  promotion,
}: EmergencyDeliveryCardProps) {
  const { estimatedMinutes, deliveryMessage } = useDeliveryEta({ autoFetch: false });

  if (!promotion) return null;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onOrderNow();
  };

  const imageUri = promotion.imageUrl;
  if (!imageUri) return null;

  const eta =
    promotion.badge ||
    deliveryMessage ||
    (estimatedMinutes ? `Delivery in ${estimatedMinutes} mins` : null) ||
    '';
  const title = promotion.title;
  const subtitle = promotion.subtitle ?? '';
  const buttonText = promotion.buttonText ?? 'Order Now';

  return (
    <Pressable onPress={handlePress} style={styles.wrap}>
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.bg}
        imageStyle={{ borderRadius: 16 }}>
        <View style={styles.overlay} />
        <View style={styles.content}>
          {eta ? (
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{eta}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.button}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  bg: {
    padding: 20,
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 16,
  },
  content: {
    position: 'relative',
  },
  etaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEB623',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FEB623',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FEB623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '800',
  },
});
