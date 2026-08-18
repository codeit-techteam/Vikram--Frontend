import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type {
  DeliveryOptions,
  DeliveryPreferenceType,
  DeliverySlotOption,
} from '@/types/deliveryPreference';
import { useTranslation } from '@store/languageStore';

type PreferenceCard = {
  type: DeliveryPreferenceType;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: 'deliverAsap' | 'deliverToday' | 'deliverTomorrow' | 'scheduleDelivery';
  subtitle: string;
  disabled: boolean;
};

interface DeliveryPreferenceSectionProps {
  options: DeliveryOptions | null;
  loading?: boolean;
  selectedType: DeliveryPreferenceType;
  selectedSlotId: string | null;
  selectedDate: string | null;
  onSelectType: (type: DeliveryPreferenceType) => void;
  onSelectSlot: (slot: DeliverySlotOption) => void;
  onSelectScheduleDate: (date: string) => void;
}

export function DeliveryPreferenceSection({
  options,
  loading,
  selectedType,
  selectedSlotId,
  selectedDate,
  onSelectType,
  onSelectSlot,
  onSelectScheduleDate,
}: DeliveryPreferenceSectionProps) {
  const { t } = useTranslation();

  if (loading && !options) {
    return (
      <View className="mb-3 rounded-card border border-border bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#FEB623" />
          <Text className="font-bold text-text">{t('calculatingDelivery')}</Text>
        </View>
      </View>
    );
  }

  if (!options || !options.serviceable) {
    return null;
  }

  const cards: PreferenceCard[] = [
    {
      type: 'ASAP',
      icon: 'flash-outline',
      titleKey: 'deliverAsap',
      subtitle: options.asap.available
        ? options.asap.etaLabel || t('fastestAvailableDelivery')
        : options.asap.reason || t('fastestDeliveryUnavailable'),
      disabled: !options.asap.available,
    },
    {
      type: 'TODAY',
      icon: 'sunny-outline',
      titleKey: 'deliverToday',
      subtitle: options.today.available
        ? t('availableDeliverySlots')
        : options.today.reason || t('noSameDaySlots'),
      disabled: !options.today.available,
    },
    {
      type: 'TOMORROW',
      icon: 'calendar-outline',
      titleKey: 'deliverTomorrow',
      subtitle: options.tomorrow.available
        ? `${options.tomorrow.dateLabel} · ${t('chooseATime')}`
        : options.tomorrow.reason || t('noTomorrowSlots'),
      disabled: !options.tomorrow.available,
    },
    {
      type: 'SCHEDULED',
      icon: 'time-outline',
      titleKey: 'scheduleDelivery',
      subtitle: t('chooseAnotherDateTime'),
      disabled: options.scheduled.length === 0,
    },
  ];

  const slots =
    selectedType === 'TODAY'
      ? options.today.slots
      : selectedType === 'TOMORROW'
        ? options.tomorrow.slots
        : selectedType === 'SCHEDULED'
          ? options.scheduled.find((day) => day.date === selectedDate)?.slots ??
            options.scheduled[0]?.slots ??
            []
          : [];

  return (
    <View className="mb-3 rounded-card border border-border bg-surface p-4">
      <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
        {t('whenWouldYouLikeDelivery')}
      </Text>
      <Text className="mt-1 mb-3 text-xs text-text-secondary">
        {t('deliveryPreferenceHint')}
      </Text>

      {options.hubClosed && options.hubClosedMessage ? (
        <View className="mb-3 rounded-lg bg-trust px-3 py-2">
          <Text className="text-xs text-text">{options.hubClosedMessage}</Text>
          {options.nextAvailable ? (
            <Text className="mt-1 text-xs text-text-secondary">
              {t('nextAvailableDelivery')}: {options.nextAvailable.dateLabel},{' '}
              {options.nextAvailable.slotLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="gap-2">
        {cards.map((card) => {
          const selected = selectedType === card.type;
          return (
            <Pressable
              key={card.type}
              disabled={card.disabled}
              onPress={() => onSelectType(card.type)}
              className={`rounded-2xl border px-3 py-3 ${
                selected
                  ? 'border-primary bg-primary/10'
                  : card.disabled
                    ? 'border-border bg-background opacity-60'
                    : 'border-border bg-background'
              }`}>
              <View className="flex-row items-start gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                  <Ionicons name={card.icon} size={18} color="#FEB623" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text">{t(card.titleKey)}</Text>
                  <Text className="mt-0.5 text-xs text-text-secondary">{card.subtitle}</Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color="#FEB623" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedType === 'SCHEDULED' && options.scheduled.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}>
          {options.scheduled.map((day) => {
            const active = (selectedDate ?? options.scheduled[0]?.date) === day.date;
            return (
              <ScaledPressable
                key={day.date}
                onPress={() => onSelectScheduleDate(day.date)}
                className={`rounded-full border px-3 py-2 ${
                  active ? 'border-primary bg-primary' : 'border-border bg-background'
                }`}>
                <Text
                  className={`text-xs font-bold ${active ? 'text-onPrimary' : 'text-text'}`}>
                  {day.dateLabel}
                </Text>
              </ScaledPressable>
            );
          })}
        </ScrollView>
      ) : null}

      {selectedType !== 'ASAP' && slots.length > 0 ? (
        <View className="mt-3 gap-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {t('chooseATime')}
          </Text>
          {slots.map((slot) => {
            const active = selectedSlotId === slot.slotId;
            return (
              <Pressable
                key={slot.slotId}
                disabled={!slot.available}
                onPress={() => onSelectSlot(slot)}
                className={`flex-row items-center justify-between rounded-xl border px-3 py-2.5 ${
                  active
                    ? 'border-primary bg-primary/10'
                    : slot.available
                      ? 'border-border bg-background'
                      : 'border-border bg-background opacity-50'
                }`}>
                <Text className="text-sm font-semibold text-text">{slot.label}</Text>
                {active ? (
                  <Ionicons name="checkmark" size={16} color="#FEB623" />
                ) : (
                  <View className="h-4 w-4 rounded-full border border-border" />
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {options.splitDelivery ? (
        <Text className="mt-3 text-xs text-text-secondary">
          {options.splitDeliveryMessage || t('itemsMayArriveSeparately')}
        </Text>
      ) : null}
    </View>
  );
}
