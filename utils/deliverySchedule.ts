import type { DeliveryCalendarDay } from '@/types/deliveryPreference';

/** Upcoming non-delivery dates from the backend calendar, e.g. "Sun, 4 Oct". */
export function describeClosedDays(
  calendar: DeliveryCalendarDay[] | undefined,
  limit = 3,
): string | null {
  const labels = (calendar ?? [])
    .filter((day) => day.isHoliday)
    .slice(0, limit)
    .map((day) => day.dateLabel);
  return labels.length > 0 ? labels.join(', ') : null;
}
