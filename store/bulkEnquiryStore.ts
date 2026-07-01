import { create } from 'zustand';

import type { DeliverySite } from '@store/useSiteStore';
import type { UserRole } from '@store/useAuthStore';

export interface BulkEnquiryGpsCoords {
  latitude: number;
  longitude: number;
}

export interface BulkEnquiryPayload {
  id: string;
  submittedAt: string;
  customer: {
    name: string;
    phone: string;
    customerId: string;
    userType: UserRole | 'unknown';
    savedAddresses: DeliverySite[];
  };
  categories: string[];
  quantity: string;
  unit: string;
  city: string;
  locationSource: 'gps' | 'manual';
  gpsCoords?: BulkEnquiryGpsCoords;
  deliveryPreference: string;
  notes: string;
}

interface BulkEnquiryState {
  enquiries: BulkEnquiryPayload[];
  lastSubmitted: BulkEnquiryPayload | null;
  submitEnquiry: (payload: Omit<BulkEnquiryPayload, 'id' | 'submittedAt'>) => BulkEnquiryPayload;
  reset: () => void;
}

function generateEnquiryId() {
  return `BJW-BULK-${Math.floor(10000 + Math.random() * 90000)}`;
}

export const useBulkEnquiryStore = create<BulkEnquiryState>((set) => ({
  enquiries: [],
  lastSubmitted: null,
  submitEnquiry: (payload) => {
    const enquiry: BulkEnquiryPayload = {
      ...payload,
      id: generateEnquiryId(),
      submittedAt: new Date().toISOString(),
    };
    set((state) => ({
      enquiries: [enquiry, ...state.enquiries],
      lastSubmitted: enquiry,
    }));
    return enquiry;
  },
  reset: () => set({ enquiries: [], lastSubmitted: null }),
}));
