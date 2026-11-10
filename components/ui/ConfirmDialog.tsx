import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';

const OVERLAY_SCRIM = 'rgba(28, 28, 28, 0.48)';
const DANGER_SOFT = '#FFE8E6';
const SHADOW = theme.black;

type ConfirmTone = 'default' | 'destructive';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Visual tone for the primary action. */
  tone?: ConfirmTone;
  /** Ionicons glyph shown in the header badge. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Disable actions while an async confirm is running. */
  confirming?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'default',
  icon = 'alert-circle-outline',
  confirming = false,
}: ConfirmDialogProps) {
  const isDestructive = tone === 'destructive';

  const handleCancel = () => {
    if (confirming) return;
    void Haptics.selectionAsync();
    onCancel();
  };

  const handleConfirm = () => {
    if (confirming) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} accessibilityRole="button" />

        <View style={styles.card} accessibilityRole="alert">
          <View
            style={[
              styles.iconWrap,
              isDestructive ? styles.iconWrapDanger : styles.iconWrapBrand,
            ]}>
            <Ionicons
              name={icon}
              size={28}
              color={isDestructive ? theme.error : theme.darkGray}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <ScaledPressable
              onPress={handleCancel}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={[styles.btn, styles.btnGhost, confirming && styles.btnDisabled]}>
              <Text style={styles.btnGhostLabel}>{cancelLabel}</Text>
            </ScaledPressable>

            <ScaledPressable
              onPress={handleConfirm}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[
                styles.btn,
                isDestructive ? styles.btnDanger : styles.btnPrimary,
                confirming && styles.btnDisabled,
              ]}>
              <Text
                style={[
                  styles.btnLabel,
                  isDestructive ? styles.btnDangerLabel : styles.btnPrimaryLabel,
                ]}>
                {confirming ? '…' : confirmLabel}
              </Text>
            </ScaledPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  btn: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  btnDanger: {
    backgroundColor: theme.error,
  },
  btnDangerLabel: {
    color: theme.white,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnGhost: {
    backgroundColor: theme.ultraLightGray,
  },
  btnGhostLabel: {
    color: theme.darkGray,
    fontSize: 15,
    fontWeight: '700',
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  btnPrimary: {
    backgroundColor: theme.primary,
  },
  btnPrimaryLabel: {
    color: theme.textOnPrimary,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.white,
    borderRadius: 24,
    elevation: 12,
    maxWidth: 360,
    paddingBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 26,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  iconWrapBrand: {
    backgroundColor: theme.primaryLight,
  },
  iconWrapDanger: {
    backgroundColor: DANGER_SOFT,
  },
  message: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: OVERLAY_SCRIM,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 8,
    textAlign: 'center',
  },
});
