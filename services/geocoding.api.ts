import { api } from '@services/api';
import type { ApiResponse } from '@/types';

/**
 * Backend proxy for Google Geocoding and Places. The server holds an
 * IP-restricted key and caches results, so the app never spends the billable
 * key it ships with.
 */

export interface GeocodedAddress {
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export interface GeocodedSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodedAddress> {
  const query = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
  });
  const { data } = await api.get<ApiResponse<GeocodedAddress>>(
    `/geocoding/reverse?${query.toString()}`,
  );
  return data.data;
}

export async function forwardGeocode(address: string): Promise<GeocodedAddress> {
  const query = new URLSearchParams({ address });
  const { data } = await api.get<ApiResponse<GeocodedAddress>>(
    `/geocoding/forward?${query.toString()}`,
  );
  return data.data;
}

export async function autocompleteAddress(
  input: string,
  sessionToken: string,
): Promise<GeocodedSuggestion[]> {
  const query = new URLSearchParams({ input, sessionToken });
  const { data } = await api.get<ApiResponse<GeocodedSuggestion[]>>(
    `/geocoding/autocomplete?${query.toString()}`,
  );
  return data.data;
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<GeocodedAddress> {
  const query = new URLSearchParams({ placeId, sessionToken });
  const { data } = await api.get<ApiResponse<GeocodedAddress>>(
    `/geocoding/place?${query.toString()}`,
  );
  return data.data;
}
