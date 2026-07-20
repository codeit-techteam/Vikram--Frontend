import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '@store/languageStore';

interface MaterialExpertCTAProps {
  onPress: () => void;
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

export const MaterialExpertSheet = forwardRef<BottomSheet>(function MaterialExpertSheet(_, ref) {
  const { t } = useTranslation();
  const snapPoints = useMemo(() => ['48%'], []);
  const nameRef = useRef('');
  const needRef = useRef('');

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  const handleSubmit = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('expertRequestSent'), t('expertRequestBody'));
    if (typeof ref !== 'function' && ref?.current) {
      ref.current.close();
    }
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}>
      <BottomSheetView style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>{t('speakToExpert')}</Text>
        <Text style={styles.sheetSubtitle}>{t('expertSheetSubtitle')}</Text>

        <Text style={styles.label}>{t('yourName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('namePlaceholder')}
          placeholderTextColor="#999"
          onChangeText={(v) => {
            nameRef.current = v;
          }}
        />

        <Text style={styles.label}>{t('whatDoYouNeed')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t('needPlaceholder')}
          placeholderTextColor="#999"
          multiline
          onChangeText={(v) => {
            needRef.current = v;
          }}
        />

        <Pressable onPress={handleSubmit} style={styles.submit}>
          <Text style={styles.submitText}>{t('requestCallback')}</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
});

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
    paddingBottom: 28,
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
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
