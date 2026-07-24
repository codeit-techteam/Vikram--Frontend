import * as Location from 'expo-location';

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

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(', ');
}

async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number,
): Promise<ResolvedAddress | null> {
  if (!GOOGLE_KEY) return null;

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results?: Array<{
      formatted_address?: string;
      place_id?: string;
      address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
    }>;
  };

  if (json.status !== 'OK' || !json.results?.[0]) return null;

  const result = json.results[0];
  const components = result.address_components ?? [];
  const pick = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ??
    '';

  return {
    fullAddress: result.formatted_address ?? '',
    city: pick('locality', 'administrative_area_level_2', 'sublocality'),
    state: pick('administrative_area_level_1'),
    country: pick('country') || 'India',
    pincode: pick('postal_code'),
    latitude,
    longitude,
    placeId: result.place_id,
  };
}

async function reverseGeocodeExpo(
  latitude: number,
  longitude: number,
): Promise<ResolvedAddress> {
  const results = await Location.reverseGeocodeAsync({ latitude, longitude });
  const first = results[0];

  const fullAddress = joinParts([
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
    city: first?.city ?? first?.subregion ?? '',
    state: first?.region ?? '',
    country: first?.country ?? 'India',
    pincode: first?.postalCode ?? '',
    latitude,
    longitude,
  };
}

export const LocationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  },

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ResolvedAddress> {
    try {
      const google = await reverseGeocodeGoogle(latitude, longitude);
      if (google) return google;
    } catch {
      // fall through to Expo geocoder
    }
    return reverseGeocodeExpo(latitude, longitude);
  },

  async fetchCurrentAddress(): Promise<ResolvedAddress> {
    const granted = await this.requestPermission();
    if (!granted) {
      throw new Error('LOCATION_PERMISSION_DENIED');
    }
    const coords = await this.getCurrentPosition();
    return this.reverseGeocode(coords.latitude, coords.longitude);
  },

  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    if (!GOOGLE_KEY) {
      // Offline/dev fallback — return typed query as a single suggestion
      return [
        {
          placeId: `manual:${trimmed}`,
          description: trimmed,
          mainText: trimmed,
          secondaryText: 'Enter manually on map',
        },
      ];
    }

    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(trimmed)}` +
      `&components=country:in` +
      `&key=${GOOGLE_KEY}`;

    const res = await fetch(url);
    const json = (await res.json()) as {
      predictions?: Array<{
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text?: string;
          secondary_text?: string;
        };
      }>;
    };

    return (json.predictions ?? []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
    }));
  },

  async resolvePlace(placeId: string): Promise<ResolvedAddress> {
    if (placeId.startsWith('manual:')) {
      const q = placeId.replace(/^manual:/, '');
      // Geocode the typed query when possible
      if (GOOGLE_KEY) {
        const url =
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_KEY}`;
        const res = await fetch(url);
        const json = (await res.json()) as {
          results?: Array<{
            formatted_address?: string;
            geometry?: { location?: { lat: number; lng: number } };
            address_components?: Array<{
              long_name: string;
              types: string[];
            }>;
          }>;
        };
        const result = json.results?.[0];
        if (result?.geometry?.location) {
          const components = result.address_components ?? [];
          const pick = (...types: string[]) =>
            components.find((c) => types.some((t) => c.types.includes(t)))
              ?.long_name ?? '';
          return {
            fullAddress: result.formatted_address ?? q,
            city: pick('locality', 'administrative_area_level_2'),
            state: pick('administrative_area_level_1'),
            country: pick('country') || 'India',
            pincode: pick('postal_code'),
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          };
        }
      }
      return {
        fullAddress: q,
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        latitude: 22.5726,
        longitude: 88.3639,
      };
    }

    if (!GOOGLE_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY_MISSING');
    }

    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=formatted_address,geometry,address_component` +
      `&key=${GOOGLE_KEY}`;

    const res = await fetch(url);
    const json = (await res.json()) as {
      result?: {
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
        address_components?: Array<{ long_name: string; types: string[] }>;
      };
    };

    const result = json.result;
    const loc = result?.geometry?.location;
    if (!loc) {
      throw new Error('PLACE_DETAILS_FAILED');
    }

    const components = result?.address_components ?? [];
    const pick = (...types: string[]) =>
      components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ??
      '';

    return {
      fullAddress: result?.formatted_address ?? '',
      city: pick('locality', 'administrative_area_level_2', 'sublocality'),
      state: pick('administrative_area_level_1'),
      country: pick('country') || 'India',
      pincode: pick('postal_code'),
      latitude: loc.lat,
      longitude: loc.lng,
      placeId,
    };
  },
};
