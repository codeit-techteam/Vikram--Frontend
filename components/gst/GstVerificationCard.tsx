import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { GstBusinessInfo } from '@components/gst/GstBusinessInfo';
import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { borderRadius, theme } from '@constants/theme';
import type { GstValidationResult } from '@/types/gst';

type GstVerificationCardProps = {
  result: GstValidationResult;
  onSave: () => void;
  onEdit: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  editLabel?: string;
};

export function GstVerificationCard({
  result,
  onSave,
  onEdit,
  isSaving,
  saveLabel = 'Save GST Details',
  editLabel = 'Edit GST',
}: GstVerificationCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 12 }}>
        <Animated.View
          entering={ZoomIn.duration(280).springify().damping(14)}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${theme.success}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
          <Ionicons name="checkmark-circle" size={36} color={theme.success} />
        </Animated.View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>
          Verify GST Details
        </Text>
        <View style={{ marginTop: 8 }}>
          <VerifiedBadge variant="verified" label="Verified" />
        </View>
      </View>

      <GstBusinessInfo data={result} />

      <Animated.View entering={FadeInDown.delay(100).duration(250)} style={{ marginTop: 20 }}>
        <ScaledPressable
          onPress={onSave}
          disabled={isSaving}
          style={{
            backgroundColor: theme.primary,
            borderRadius: borderRadius.lg,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 10,
            opacity: isSaving ? 0.7 : 1,
          }}>
          {isSaving ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
              {saveLabel}
            </Text>
          )}
        </ScaledPressable>
      </Animated.View>

      <ScaledPressable
        onPress={onEdit}
        style={{
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          paddingVertical: 14,
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textSecondary }}>
          {editLabel}
        </Text>
      </ScaledPressable>
    </Animated.View>
  );
}
