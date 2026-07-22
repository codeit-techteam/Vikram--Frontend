import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps, BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GstVerificationCard } from '@components/gst/GstVerificationCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { validateGST } from '@services/gst.service';
import { useGstStore } from '@store/gstStore';
import { borderRadius, theme } from '@constants/theme';
import { isValidGstFormat } from '@utils/validation';
import type { GstDetails, GstValidationResult } from '@/types/gst';

type GstBottomSheetStep = 'input' | 'confirm';

type GstBottomSheetProps = {
  visible: boolean;
  initialGstNumber?: string;
  isEditMode?: boolean;
  onClose: () => void;
  onSave: (details: GstValidationResult) => Promise<void>;
};

export function GstBottomSheet({
  visible,
  initialGstNumber = '',
  isEditMode = false,
  onClose,
  onSave,
}: GstBottomSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const setVerifying = useGstStore((s) => s.setVerifying);
  const setValidationFailed = useGstStore((s) => s.setValidationFailed);

  const snapPoints = useMemo(() => (['52%', '78%']), []);

  const [step, setStep] = useState<GstBottomSheetStep>('input');
  const [gstInput, setGstInput] = useState(initialGstNumber);
  const [validationResult, setValidationResult] = useState<GstValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const normalizedInput = gstInput.trim().toUpperCase();
  const isFormatValid = normalizedInput.length === 15 && isValidGstFormat(normalizedInput);
  const showFormatError =
    normalizedInput.length === 15 && !isValidGstFormat(normalizedInput);
  const showLengthHint =
    normalizedInput.length > 0 && normalizedInput.length < 15;
  const canContinue = isFormatValid && !isValidating;

  const resetState = useCallback(() => {
    setStep('input');
    setGstInput(initialGstNumber);
    setValidationResult(null);
    setIsValidating(false);
    setIsSaving(false);
  }, [initialGstNumber]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  useEffect(() => {
    if (!visible) {
      sheetRef.current?.close();
      resetState();
      return;
    }

    setGstInput(initialGstNumber);
    setStep('input');
    setValidationResult(null);

    const frame = requestAnimationFrame(() => {
      sheetRef.current?.snapToIndex(0);
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, initialGstNumber, resetState]);

  useEffect(() => {
    if (!visible) return;

    const frame = requestAnimationFrame(() => {
      sheetRef.current?.snapToIndex(step === 'confirm' ? 1 : 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, step]);

  const handleGstChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
    setGstInput(cleaned);
  };

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    setIsValidating(true);
    setVerifying();
    try {
      const result = await validateGST(normalizedInput);
      if (!result.isValid) {
        setValidationFailed('Invalid GST Number');
        return;
      }
      setValidationResult(result);
      setStep('confirm');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setValidationFailed('Unable to verify GST. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }, [canContinue, normalizedInput, setVerifying, setValidationFailed]);

  const handleSave = async () => {
    if (!validationResult) return;
    setIsSaving(true);
    try {
      await onSave(validationResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (validationResult) {
      setGstInput(validationResult.gstNumber);
    }
    setStep('input');
    setValidationResult(null);
  };

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (step !== 'input') return null;

      return (
        <BottomSheetFooter {...props} bottomInset={insets.bottom}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.white,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}>
            <ScaledPressable
              onPress={handleContinue}
              disabled={!canContinue}
              style={{
                borderRadius: borderRadius.lg,
                backgroundColor: canContinue ? theme.primary : theme.lightGray,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: canContinue ? 1 : 0.75,
              }}>
              {isValidating ? (
                <ActivityIndicator color={theme.textPrimary} size="small" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                  Continue
                </Text>
              )}
            </ScaledPressable>
          </View>
        </BottomSheetFooter>
      );
    },
    [step, insets.bottom, canContinue, isValidating, handleContinue],
  );

  const sheetContent = (
    <BottomSheetScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: step === 'input' ? 100 + insets.bottom : insets.bottom + 24,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {step === 'input' ? (
        <>
          <View style={{ alignItems: 'center', paddingBottom: 16 }}>
            <View
              style={{
                width: 96,
                height: 72,
                borderRadius: 18,
                backgroundColor: theme.primaryUltraLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}>
              <Ionicons name="receipt-outline" size={44} color={theme.primary} />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: theme.textPrimary,
                textAlign: 'center',
                marginBottom: 6,
              }}>
              {isEditMode ? 'Update GST Details' : 'Add GST Details'}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
                paddingHorizontal: 8,
              }}>
              Receive GST invoices on eligible business purchases.
            </Text>
          </View>

          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: theme.textSecondary,
              letterSpacing: 0.6,
              marginBottom: 8,
            }}>
            GST NUMBER
          </Text>
          <BottomSheetTextInput
            value={gstInput}
            onChangeText={handleGstChange}
            placeholder="Enter GST Number"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={15}
            style={{
              borderWidth: 1.5,
              borderColor: showFormatError
                ? theme.error
                : isFormatValid
                  ? theme.success
                  : theme.border,
              borderRadius: borderRadius.lg,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontWeight: '600',
              letterSpacing: 1.2,
              color: theme.textPrimary,
              backgroundColor: theme.white,
            }}
          />
          {showFormatError ? (
            <Text style={{ fontSize: 12, color: theme.error, marginTop: 8, fontWeight: '600' }}>
              Invalid GST Number
            </Text>
          ) : showLengthHint ? (
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
              {normalizedInput.length}/15 characters
            </Text>
          ) : null}
        </>
      ) : validationResult ? (
        <GstVerificationCard
          result={validationResult}
          onSave={handleSave}
          onEdit={handleEdit}
          isSaving={isSaving}
          editLabel={isEditMode ? 'Change GST Number' : 'Edit GST'}
        />
      ) : null}
    </BottomSheetScrollView>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      onClose={onClose}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      bottomInset={insets.bottom}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 44 }}
      backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        sheetContent
      )}
    </BottomSheet>
  );
}

export type { GstDetails };
