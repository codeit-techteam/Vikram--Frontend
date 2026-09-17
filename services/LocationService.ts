import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

import {
  autocompleteAddress,
  forwardGeocode as forwardGeocodeViaBackend,
  getPlaceDetails,
  reverseGeocode as reverseGeocodeViaBackend,
} from '@services/geocoding.api';

export type ResolvedAddress = {
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  placeId?: string;
};

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type LocationErrorCode =
  /** Device location services (GPS toggle) are switched off. */
  | 'SERVICES_DISABLED'
  /** User declined, but the system will still show the prompt next time. */
  | 'PERMISSION_DENIED'
  /** User declined permanently — only the Settings app can re-grant it. */
  | 'PERMISSION_BLOCKED'
  /** Permission is granted but no fix could be obtained. */
  | 'POSITION_UNAVAILABLE'
  | 'GEOCODE_FAILED'
  | 'PLACE_DETAILS_FAILED';

export class LocationError extends Error {
  readonly code: LocationErrorCode;

  constructor(code: LocationErrorCode, message: string) {
    super(message);
    this.name = 'LocationError';
    this.code = code;
  }
}

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/** Google web services stop responding usefully long before fetch would time out. */
const GOOGLE_TIMEOUT_MS = 8000;
/** A GPS fix on a cold start can take a while indoors; beyond this we use last-known. */
const GPS_TIMEOUT_MS = 12000;
/** Coordinates within ~11m reuse the cached address, so dragging the map stays cheap. */
const REVERSE_GEOCODE_PRECISION = 4;
const REVERSE_GEOCODE_CACHE_LIMIT = 80;
/** Google bills an autocomplete session as one request when the token is reused. */
const SESSION_TOKEN_TTL_MS = 3 * 60 * 1000;

const reverseGeocodeCache = new Map<string, ResolvedAddress>();

/**
 * Google returns HTTP 200 with a status string for quota/enablement problems, so
 * surface the cause once per status instead of silently degrading to the
 * on-device geocoder on every call.
 */
const reportedGoogleFailures = new Set<string>();

function reportGoogleFailure(api: string, status: string, detail?: string) {
  const signature = `${api}:${status}`;
  if (reportedGoogleFailures.has(signature)) return;
  reportedGoogleFailures.add(signature);

  const hint =
    status === 'REQUEST_DENIED'
      ? `Enable "${api}" for this key in Google Cloud Console and confirm the key's API restrictions allow it.`
      : status === 'OVER_QUERY_LIMIT'
        ? `Billing or quota is exhausted for "${api}".`
        : 'Falling back to the on-device geocoder.';

  console.warn(`[LocationService] ${api} returned ${status}. ${hint}`, detail ?? '');
}

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(', ');
}

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(REVERSE_GEOCODE_PRECISION)},${longitude.toFixed(
    REVERSE_GEOCODE_PRECISION,
  )}`;
}

function rememberAddress(key: string, address: ResolvedAddress) {
  if (reverseGeocodeCache.size >= REVERSE_GEOCODE_CACHE_LIMIT) {
    const [oldest] = reverseGeocodeCache.keys();
    if (oldest !== undefined) reverseGeocodeCache.delete(oldest);
  }
  reverseGeocodeCache.set(key, address);
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type AddressComponent = { long_name: string; short_name?: string; types: string[] };

function componentPicker(components: AddressComponent[]) {
  return (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? '';
}

function toResolvedAddress(
  formattedAddress: string,
  components: AddressComponent[],
  latitude: number,
  longitude: number,
  placeId?: string,
): ResolvedAddress {
  const pick = componentPicker(components);
  return {
    fullAddress: formattedAddress,
    city: pick('locality', 'administrative_area_level_3', 'administrative_area_level_2', 'sublocality'),
    state: pick('administrative_area_level_1'),
    country: pick('country') || 'India',
    pincode: pick('postal_code'),
    latitude,
    longitude,
    placeId,
  };
}

/**
 * Autocomplete keystrokes and the follow-up Place Details lookup must share a
 * session token, otherwise Google bills every keystroke as its own request.
 */
let sessionToken: string | null = null;
let sessionTokenIssuedAt = 0;

function currentSessionToken(): string {
  const now = Date.now();
  if (!sessionToken || now - sessionTokenIssuedAt > SESSION_TOKEN_TTL_MS) {
    sessionToken = `${now.toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    sessionTokenIssuedAt = now;
  }
  return sessionToken;
}

function endSession() {
  sessionToken = null;
}

async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number,
): Promise<ResolvedAddress | null> {
  if (!GOOGLE_KEY) return null;

  const json = await fetchJson<{
    status: string;
    error_message?: string;
    results?: Array<{
      formatted_address?: string;
      place_id?: string;
      address_components?: AddressComponent[];
    }>;
  }>(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}` +
      `&region=in&key=${GOOGLE_KEY}`,
  );

  if (json.status !== 'OK' || !json.results?.[0]) {
    if (json.status !== 'ZERO_RESULTS') {
      reportGoogleFailure('Geocoding API', json.status, json.error_message);
    }
    return null;
  }

  const result = json.results[0];
  return toResolvedAddress(
    result.formatted_address ?? '',
    result.address_components ?? [],
    latitude,
    longitude,
    result.place_id,
  );
}

async function reverseGeocodeExpo(
  latitude: number,
  longitude: number,
): Promise<ResolvedAddress> {
  const results = await Location.reverseGeocodeAsync({ latitude, longitude });
  const first = results[0];

  const fullAddress =
    first?.formattedAddress ??
    joinParts([
      first?.name,
      first?.streetNumber,
      first?.street,
      first?.district,
      first?.city,
      first?.region,
      first?.postalCode,
      first?.country,
    ]);

  return {
    fullAddress: fullAddress || 'Selected location',
    city: first?.city ?? first?.subregion ?? first?.district ?? '',
    state: first?.region ?? '',
    country: first?.country ?? 'India',
    pincode: first?.postalCode ?? '',
    latitude,
    longitude,
  };
}

export const LocationService = {
  /**
   * Resolves only when the device can actually produce a fix. Separating the
   * "services off" and "blocked forever" cases lets the UI offer the right
   * recovery action instead of a generic retry.
   */
  async ensureReady(): Promise<void> {
    if (!(await Location.hasServicesEnabledAsync())) {
      throw new LocationError(
        'SERVICES_DISABLED',
        'Location services are turned off on this device.',
      );
    }

    const existing = await Location.getForegroundPermissionsAsync();
    const permission = existing.granted
      ? existing
      : await Location.requestForegroundPermissionsAsync();

    if (permission.granted) return;

    throw permission.canAskAgain
      ? new LocationError('PERMISSION_DENIED', 'Location permission was denied.')
      : new LocationError(
          'PERMISSION_BLOCKED',
          'Location permission is blocked. Enable it from Settings.',
        );
  },

  /** Deep-links to the OS screen where a blocked permission can be re-granted. */
  async openSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
      return;
    }
    await Linking.openSettings();
  },

  async requestPermission(): Promise<boolean> {
    try {
      await this.ensureReady();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Returns a cached fix immediately when one is recent enough, then falls back
   * to a fresh GPS read. Mirrors how delivery apps paint an address instantly
   * instead of blocking on a cold GPS lock.
   */
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 2 * 60 * 1000,
      requiredAccuracy: 200,
    });
    if (lastKnown) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }

    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GPS_TIMEOUT_MS)),
    ]);

    if (!fresh) {
      throw new LocationError(
        'POSITION_UNAVAILABLE',
        'Could not get a location fix. Move to an open area and retry.',
      );
    }

    return { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
  },

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ResolvedAddress> {
    const key = cacheKey(latitude, longitude);
    const cached = reverseGeocodeCache.get(key);
    if (cached) return cached;

    let address: ResolvedAddress | null = null;

    // Backend proxy first: it holds the restricted key and caches aggressively.
    try {
      address = await reverseGeocodeViaBackend(latitude, longitude);
    } catch {
      // Backend unreachable or geocoding unconfigured there — try direct.
    }

    if (!address) {
      try {
        address = await reverseGeocodeGoogle(latitude, longitude);
      } catch {
        // Network/timeout — the on-device geocoder still works offline.
      }
    }

    if (!address) {
      try {
        address = await reverseGeocodeExpo(latitude, longitude);
      } catch {
        address = {
          fullAddress: 'Selected location',
          city: '',
          state: '',
          country: 'India',
          pincode: '',
          latitude,
          longitude,
        };
      }
    }

    rememberAddress(key, address);
    return address;
  },

  async fetchCurrentAddress(): Promise<ResolvedAddress> {
    await this.ensureReady();
    const coords = await this.getCurrentPosition();
    return this.reverseGeocode(coords.latitude, coords.longitude);
  },

  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    try {
      const suggestions = await autocompleteAddress(trimmed, currentSessionToken());
      if (suggestions.length > 0) return suggestions;
    } catch {
      // Fall through to the direct Google call.
    }

    if (GOOGLE_KEY) {
      try {
        const json = await fetchJson<{
          status: string;
          error_message?: string;
          predictions?: Array<{
            place_id: string;
            description: string;
            structured_formatting?: { main_text?: string; secondary_text?: string };
          }>;
        }>(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
            `?input=${encodeURIComponent(trimmed)}` +
            `&components=country:in` +
            `&sessiontoken=${currentSessionToken()}` +
            `&key=${GOOGLE_KEY}`,
        );

        if (json.status === 'OK' || json.status === 'ZERO_RESULTS') {
          return (json.predictions ?? []).map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? '',
          }));
        }

        reportGoogleFailure('Places API', json.status, json.error_message);
      } catch {
        // Fall through to the manual entry affordance below.
      }
    }

    // Without Places, the typed text still has to lead somewhere useful, so offer
    // it as a single geocodable suggestion.
    return [
      {
        placeId: `manual:${trimmed}`,
        description: trimmed,
        mainText: trimmed,
        secondaryText: 'Search on map',
      },
    ];
  },

  async resolvePlace(placeId: string): Promise<ResolvedAddress> {
    if (placeId.startsWith('manual:')) {
      return this.geocodeAddress(placeId.replace(/^manual:/, ''));
    }

    try {
      const address = await getPlaceDetails(placeId, currentSessionToken());
      endSession();
      return address;
    } catch {
      // Fall through to the direct Google call.
    }

    if (!GOOGLE_KEY) {
      throw new LocationError(
        'PLACE_DETAILS_FAILED',
        'Google Maps key is missing. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and restart Metro with `npx expo start -c`.',
      );
    }

    const json = await fetchJson<{
      status: string;
      error_message?: string;
      result?: {
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
        address_components?: AddressComponent[];
      };
    }>(
      `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(placeId)}` +
        `&fields=formatted_address,geometry,address_component` +
        `&sessiontoken=${currentSessionToken()}` +
        `&key=${GOOGLE_KEY}`,
    );

    // The session ends with Place Details whether or not it succeeded.
    endSession();

    const loc = json.result?.geometry?.location;
    if (!loc) {
      reportGoogleFailure('Places API', json.status, json.error_message);
      throw new LocationError(
        'PLACE_DETAILS_FAILED',
        'Could not load details for that place.',
      );
    }

    return toResolvedAddress(
      json.result?.formatted_address ?? '',
      json.result?.address_components ?? [],
      loc.lat,
      loc.lng,
      placeId,
    );
  },

  /** Forward-geocodes free text, preferring Google and falling back on-device. */
  async geocodeAddress(query: string): Promise<ResolvedAddress> {
    const trimmed = query.trim();

    try {
      return await forwardGeocodeViaBackend(trimmed);
    } catch {
      // Fall through to the direct Google call.
    }

    if (GOOGLE_KEY) {
      try {
        const json = await fetchJson<{
          status: string;
          error_message?: string;
          results?: Array<{
            formatted_address?: string;
            place_id?: string;
            geometry?: { location?: { lat: number; lng: number } };
            address_components?: AddressComponent[];
          }>;
        }>(
          `https://maps.googleapis.com/maps/api/geocode/json` +
            `?address=${encodeURIComponent(trimmed)}&region=in&key=${GOOGLE_KEY}`,
        );

        const result = json.results?.[0];
        if (result?.geometry?.location) {
          return toResolvedAddress(
            result.formatted_address ?? trimmed,
            result.address_components ?? [],
            result.geometry.location.lat,
            result.geometry.location.lng,
            result.place_id,
          );
        }
        if (json.status !== 'ZERO_RESULTS') {
          reportGoogleFailure('Geocoding API', json.status, json.error_message);
        }
      } catch {
        // Fall through to the on-device geocoder.
      }
    }

    try {
      const [match] = await Location.geocodeAsync(trimmed);
      if (match) {
        const address = await this.reverseGeocode(match.latitude, match.longitude);
        return { ...address, fullAddress: address.fullAddress || trimmed };
      }
    } catch {
      // Nothing resolvable — reported below.
    }

    throw new LocationError(
      'GEOCODE_FAILED',
      `Could not find “${trimmed}”. Try a nearby landmark or pick the spot on the map.`,
    );
  },
};
