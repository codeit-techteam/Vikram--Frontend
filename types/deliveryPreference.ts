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
  isHoliday?: boolean;
  holidayReason?: string | null;
}

export interface DeliveryScheduledDay {
  date: string;
  dateLabel: string;
  available: boolean;
  isHoliday?: boolean;
  holidayReason?: string | null;
  slots: DeliverySlotOption[];
}

export interface DeliveryCalendarDay {
  dateKey: string;
  dateLabel: string;
  isHoliday: boolean;
  holidayReason?: string | null;
  weekday: number;
}

export interface DeliveryOperatingWindow {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  slotDurationMinutes: number;
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
  operatingWindow?: DeliveryOperatingWindow | null;
  calendar?: DeliveryCalendarDay[];
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
    hubName?: string | null;
  } | null;
}

export interface DeliveryInstructionsPayload {
  text?: string;
  callOnArrival: boolean;
  leaveAtSecurity: boolean;
  heavyVehicleAccess: boolean;
  openAreaConfirmed?: boolean | null;
}

export const HEAVY_VEHICLE_TYPES = new Set([
  'THREE_WHEELER_LOADER',
  'FULL_TRUCK',
  'HEAVY_LOADER',
  'RMC_TRANSIT_MIXER',
]);
