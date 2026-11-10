import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'navigate-outline', label: 'Live tracking' },
  { icon: 'refresh-outline', label: 'Easy reorder' },
  { icon: 'document-text-outline', label: 'GST invoices' },
];

export function GuestOrdersState() {
  const clearGuestMode = useAuthStore((s) => s.clearGuestMode);

  const handleLogin = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Explicit CTA → full login screen (sheet can no-op if already "visible").
    void clearGuestMode();
    router.push('/login');
  };

  const handleBrowse = () => {
    void Haptics.selectionAsync();
    router.push('/(tabs)/catalog');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
      <Animated.View entering={FadeIn.duration(320)} style={{ alignItems: 'center' }}>
        <LinearGradient
          colors={[theme.primaryUltraLight, theme.white]}
          locations={[0, 1]}
          style={{
            width: '100%',
            borderRadius: borderRadius.xl + 4,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 24,
            alignItems: 'center',
            overflow: 'hidden',
          }}>
          <View
            style={{
              position: 'absolute',
              top: -36,
              right: -28,
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: 'rgba(254, 182, 35, 0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -48,
              left: -36,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: 'rgba(254, 182, 35, 0.08)',
            }}
          />

          <Animated.View
            entering={ZoomIn.delay(80).duration(420).springify()}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.white,
              borderWidth: 1,
              borderColor: '#FFE6A8',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
              shadowColor: theme.primary,
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 3,
            }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: theme.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="cube-outline" size={34} color={theme.primaryDark} />
            </View>
          </Animated.View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.white,
              borderWidth: 1,
              borderColor: '#FFE6A8',
              borderRadius: borderRadius.full,
              paddingHorizontal: 12,
              paddingVertical: 5,
              marginBottom: 14,
            }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: theme.primary,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: theme.textSecondary,
                letterSpacing: 0.2,
              }}>
              Guest mode
            </Text>
          </View>

          <Animated.Text
            entering={FadeInDown.delay(120).duration(320)}
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: theme.textPrimary,
              textAlign: 'center',
              marginBottom: 8,
            }}>
            No orders for guests
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(180).duration(320)}
            style={{
              fontSize: 14,
              lineHeight: 21,
              color: theme.textSecondary,
              textAlign: 'center',
              marginBottom: 22,
              maxWidth: 280,
            }}>
            Sign in to see your order history, track live deliveries, and reorder materials in one tap.
          </Animated.Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 22,
            }}>
            {BENEFITS.map((benefit, index) => (
              <Animated.View
                key={benefit.label}
                entering={FadeInDown.delay(220 + index * 60).duration(280)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: theme.white,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}>
                <Ionicons name={benefit.icon} size={14} color={theme.darkGray} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }}>
                  {benefit.label}
                </Text>
              </Animated.View>
            ))}
          </View>

          <ScaledPressable
            onPress={handleLogin}
            accessibilityRole="button"
            accessibilityLabel="Log in to view orders"
            style={{
              width: '100%',
              height: 52,
              borderRadius: borderRadius.full,
              backgroundColor: theme.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Ionicons name="log-in-outline" size={18} color={theme.textOnPrimary} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textOnPrimary }}>
              Log in to view orders
            </Text>
          </ScaledPressable>

          <ScaledPressable
            onPress={handleBrowse}
            accessibilityRole="button"
            accessibilityLabel="Browse catalog"
            style={{
              marginTop: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
            }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>
              Continue browsing catalog
            </Text>
          </ScaledPressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
