export type DeliveryPreferenceType = 'ASAP' | 'TODAY' | 'TOMORROW' | 'SCHEDULED';

export interface DeliverySlotOption {
  slotId: string;
  date: string;
  dateLabel: string;
  startMinutes: number;
  endMinutes: number;
  label: string;
  startAt: string;
  endAt: string;
  available: boolean;
  capacity: number;
  reservedCapacity: number;
  availableCapacity: number;
}

export interface DeliveryDayOption {
  available: boolean;
  date: string;
  dateLabel: string;
  slots: DeliverySlotOption[];
  reason?: string | null;
}

export interface DeliveryScheduledDay {
  date: string;
  dateLabel: string;
  available: boolean;
  slots: DeliverySlotOption[];
}

export interface DeliveryOptions {
  serviceable: boolean;
  unavailableReason?: string | null;
  hubClosed?: boolean;
  hubClosedMessage?: string | null;
  hubId?: string | null;
  hubName?: string | null;
  vehicleType?: string | null;
  vehicleDisplayName?: string | null;
  vehicleImageUrl?: string | null;
  logisticsType?: string | null;
  splitDelivery?: boolean;
  splitDeliveryMessage?: string | null;
  timezone?: string;
  asap: {
    available: boolean;
    etaMinMinutes?: number | null;
    etaMaxMinutes?: number | null;
    etaLabel?: string | null;
    reason?: string | null;
  };
  today: DeliveryDayOption;
  tomorrow: DeliveryDayOption;
  scheduled: DeliveryScheduledDay[];
  nextAvailable?: {
    date: string;
    dateLabel: string;
    slotId: string;
    slotLabel: string;
  } | null;
  defaultPreference?: DeliveryPreferenceType;
}

export interface DeliveryPreferenceView {
  type: DeliveryPreferenceType;
  label: string;
  scheduledDate?: string | null;
  scheduledDateLabel?: string | null;
  scheduledSlotId?: string | null;
  scheduledSlotLabel?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  customerRemark?: string | null;
  etaMinMinutes?: number | null;
  etaMaxMinutes?: number | null;
  snapshot?: {
    etaLabel?: string | null;
    vehicleDisplayName?: string | null;
  } | null;
}
