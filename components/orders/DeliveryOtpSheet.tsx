import { memo, useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';

interface DeliveryOtpSheetProps {
  visible: boolean;
  otp?: string | null;
  onClose: () => void;
}

/**
 * Shown when the delivery partner has reached the customer.
 * OTP digits come from API when available; otherwise prompts to check SMS.
 */
export const DeliveryOtpSheet = memo(function DeliveryOtpSheet({
  visible,
  otp,
  onClose,
}: DeliveryOtpSheetProps) {
  useEffect(() => {
    if (visible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  const digits = otp?.trim() || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}>
        <ScaledPressable
          onPress={onClose}
          style={{ flex: 1 }}
          accessibilityLabel="Dismiss OTP sheet">
          <View style={{ flex: 1 }} />
        </ScaledPressable>
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={{
            backgroundColor: theme.white,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 36,
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              marginBottom: 20,
            }}
          />

          <Animated.View
            entering={FadeIn.delay(80).duration(250)}
            style={{ alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Ionicons name="keypad-outline" size={28} color={theme.primaryDark} />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: theme.textPrimary,
                textAlign: 'center',
              }}>
              Your Delivery OTP
            </Text>
          </Animated.View>

          {digits ? (
            <Animated.View
              entering={ZoomIn.delay(120).duration(280).springify()}
              style={{
                marginTop: 20,
                marginBottom: 16,
                backgroundColor: theme.primaryUltraLight,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.primary,
                paddingVertical: 20,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 40,
                  fontWeight: '800',
                  letterSpacing: 12,
                  color: theme.textPrimary,
                }}>
                {digits}
              </Text>
            </Animated.View>
          ) : (
            <View
              style={{
                marginTop: 16,
                marginBottom: 12,
                backgroundColor: theme.ultraLightGray,
                borderRadius: borderRadius.lg,
                padding: 16,
              }}>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                Your delivery OTP has been sent to your registered mobile number.
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
            }}>
            Share this OTP with the delivery partner to complete your delivery.
          </Text>

          <ScaledPressable
            onPress={onClose}
            style={{
              backgroundColor: theme.primary,
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
              Got it
            </Text>
          </ScaledPressable>
        </Animated.View>
      </View>
    </Modal>
  );
});
