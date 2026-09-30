type LogValue = string | number | boolean | null | undefined;

/**
 * Structured checkout diagnostics. Visible in Metro and in `adb logcat -s ReactNativeJS`
 * for release APKs. Only pass ids, statuses and durations — never tokens, phone numbers or addresses.
 */
export function logCheckoutEvent(event: string, fields: Record<string, LogValue> = {}): void {
  console.log(`[checkout] ${JSON.stringify({ event, at: new Date().toISOString(), ...fields })}`);
}
