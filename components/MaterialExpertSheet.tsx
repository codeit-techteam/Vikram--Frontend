import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { submitExpertCallback } from '@services/expertCallback.api';
import { useAuthStore } from '@store/useAuthStore';
import { useTranslation } from '@store/languageStore';
import { requireAuth } from '@utils/requireAuth';

interface MaterialExpertCTAProps {
  onPress: () => void;
}

interface MaterialExpertSheetProps {
  categorySlug?: string;
  categoryName?: string;
}

export function MaterialExpertCTA({ onPress }: MaterialExpertCTAProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.ctaCard}>
      <Text style={styles.ctaQuestion}>{t('cantFindProduct')}</Text>
      <Text style={styles.ctaTitle}>{t('speakToExpert')}</Text>
      <Pressable
        onPress={async () => {
          await Haptics.selectionAsync();
          onPress();
        }}
        style={styles.ctaButton}>
        <Ionicons name="chatbubbles-outline" size={18} color="#1A1A1A" />
        <Text style={styles.ctaButtonText}>{t('talkToExpert')}</Text>
      </Pressable>
    </View>
  );
}

function SuccessPopup({
  visible,
  title,
  body,
  buttonLabel,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  buttonLabel: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.successOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <Animated.View
          entering={FadeInDown.duration(280).springify().damping(18)}
          style={styles.successCard}>
          <Animated.View
            entering={ZoomIn.delay(60).duration(320).springify().damping(14)}
            style={styles.successIconWrap}>
            <View style={styles.successIconRing}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(100).duration(240)} style={styles.successTextBlock}>
            <Text style={styles.successTitle}>{title}</Text>
            <Text style={styles.successBody}>{body}</Text>
          </Animated.View>

          <Pressable
            onPress={async () => {
              await Haptics.selectionAsync();
              onClose();
            }}
            style={styles.successButton}>
            <Text style={styles.successButtonText}>{buttonLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export const MaterialExpertSheet = forwardRef<BottomSheet, MaterialExpertSheetProps>(
  function MaterialExpertSheet({ categorySlug, categoryName }, ref) {
    const { t } = useTranslation();
    const customerName = useAuthStore((s) => s.customer?.name ?? '');
    const snapPoints = useMemo(() => ['58%'], []);
    const nameRef = useRef(customerName);
    const needRef = useRef('');
    const [submitting, setSubmitting] = useState(false);
    const [nameValue, setNameValue] = useState(customerName);
    const [needValue, setNeedValue] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.45}
        />
      ),
      [],
    );

    const closeSheet = () => {
      if (typeof ref !== 'function' && ref?.current) {
        ref.current.close();
      }
    };

    const handleSubmit = async () => {
      if (!requireAuth('Please log in to request a callback.')) return;

      const name = nameRef.current.trim() || nameValue.trim();
      const needs = needRef.current.trim() || needValue.trim();

      if (name.length < 2) {
        Alert.alert(t('expertValidationTitle'), t('expertNameRequired'));
        return;
      }
      if (needs.length < 5) {
        Alert.alert(t('expertValidationTitle'), t('expertNeedsRequired'));
        return;
      }

      setSubmitting(true);
      try {
        await submitExpertCallback({
          name,
          needs,
          categorySlug: categorySlug || undefined,
          categoryName: categoryName || undefined,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        nameRef.current = customerName;
        needRef.current = '';
        setNameValue(customerName);
        setNeedValue('');
        closeSheet();
        setShowSuccess(true);
      } catch (error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : t('expertRequestFailed');
        Alert.alert(t('expertRequestFailedTitle'), message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          enableBlurKeyboardOnGesture
          backdropComponent={renderBackdrop}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.handle}>
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <Text style={styles.sheetTitle}>{t('speakToExpert')}</Text>
            <Text style={styles.sheetSubtitle}>{t('expertSheetSubtitle')}</Text>

            <Text style={styles.label}>{t('yourName')}</Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder={t('namePlaceholder')}
              placeholderTextColor="#999"
              value={nameValue}
              editable={!submitting}
              returnKeyType="next"
              onChangeText={(v) => {
                nameRef.current = v;
                setNameValue(v);
              }}
            />

            <Text style={styles.label}>{t('whatDoYouNeed')}</Text>
            <BottomSheetTextInput
              style={[styles.input, styles.multiline]}
              placeholder={t('needPlaceholder')}
              placeholderTextColor="#999"
              multiline
              value={needValue}
              editable={!submitting}
              onChangeText={(v) => {
                needRef.current = v;
                setNeedValue(v);
              }}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.submit, submitting && styles.submitDisabled]}>
              {submitting ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text style={styles.submitText}>{t('requestCallback')}</Text>
              )}
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheet>

        <SuccessPopup
          visible={showSuccess}
          title={t('expertRequestSent')}
          body={t('expertRequestBody')}
          buttonLabel={t('done')}
          onClose={() => setShowSuccess(false)}
        />
      </>
    );
  },
);

const styles = StyleSheet.create({
  ctaCard: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#FFF4D1',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FEB623',
    alignItems: 'center',
  },
  ctaQuestion: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  ctaTitle: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: '#D0D0D0',
    width: 40,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#F8F8F8',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: 18,
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  successCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconWrap: {
    marginBottom: 18,
  },
  successIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  successTextBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  successButton: {
    width: '100%',
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
