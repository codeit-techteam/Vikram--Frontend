import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DELIVERY_POLICY_SECTION_ID, TERMS_SECTIONS } from '@constants/terms';
import type { DeliveryOperatingWindow } from '@/types/deliveryPreference';
import { useTranslation } from '@store/languageStore';

const COLLAPSED_BULLETS = 3;

interface DeliveryTermsSectionProps {
  accepted: boolean;
  onToggle: (accepted: boolean) => void;
  operatingWindow?: DeliveryOperatingWindow | null;
  closedDaysLabel?: string | null;
  showRequiredHint?: boolean;
}

export function DeliveryTermsSection({
  accepted,
  onToggle,
  operatingWindow,
  closedDaysLabel,
  showRequiredHint,
}: DeliveryTermsSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const bullets = useMemo(() => {
    const policy =
      TERMS_SECTIONS.find((section) => section.id === DELIVERY_POLICY_SECTION_ID)?.bullets ?? [];
    const hoursLine = operatingWindow
      ? `${t('deliveryHoursLabel')}: ${operatingWindow.start} – ${operatingWindow.end}${
          closedDaysLabel ? ` · ${t('noDeliveryOn')} ${closedDaysLabel}` : ''
        }.`
      : null;
    return hoursLine ? [hoursLine, ...policy] : policy;
  }, [operatingWindow, closedDaysLabel, t]);

  const visible = expanded ? bullets : bullets.slice(0, COLLAPSED_BULLETS);

  return (
    <View className="mb-3 rounded-card border border-border bg-surface p-4">
      <Text className="mb-2 font-bold text-text">{t('deliveryTermsTitle')}</Text>
      <View className="gap-1.5">
        {visible.map((line) => (
          <View key={line} className="flex-row gap-2">
            <Text className="text-xs text-text-secondary">•</Text>
            <Text className="flex-1 text-xs leading-[17px] text-text-secondary">{line}</Text>
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
        {bullets.length > COLLAPSED_BULLETS ? (
          <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={8}>
            <Text className="text-xs font-bold text-primary">
              {expanded ? 'Show less' : `Show all (${bullets.length})`}
            </Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => router.push('/account/terms')} hitSlop={8}>
          <Text className="text-xs font-bold text-primary">{t('viewFullTerms')}</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => onToggle(!accepted)}
        className="mt-3 flex-row items-center gap-2">
        <Ionicons
          name={accepted ? 'checkbox' : 'square-outline'}
          size={20}
          color={accepted ? '#FEB623' : '#888888'}
        />
        <Text className="flex-1 text-sm font-semibold text-text">{t('deliveryTermsAccept')}</Text>
      </Pressable>
      {showRequiredHint && !accepted ? (
        <Text className="mt-1 text-xs text-error">{t('deliveryTermsRequired')}</Text>
      ) : null}
    </View>
  );
}
