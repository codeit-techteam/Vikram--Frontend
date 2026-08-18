import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export type BulkDeliveryRequirement =
  | 'IMMEDIATE'
  | 'TODAY'
  | 'TOMORROW'
  | 'WITHIN_3_DAYS'
  | 'WITHIN_1_WEEK'
  | 'FLEXIBLE';

export type BulkPreferredContact = 'CALL' | 'WHATSAPP';
export type BulkPreferredContactValue = BulkPreferredContact | 'BOTH';

export type BulkEnquiryStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'QUOTE_PREPARED'
  | 'QUOTE_SENT'
  | 'QUOTED'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'ORDER_CREATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface BulkFormConfigCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
}

export interface BulkFormConfigOption {
  value: string;
  label: string;
}

export interface BulkFormConfig {
  categories: BulkFormConfigCategory[];
  deliveryRequirements: BulkFormConfigOption[];
  preferredContacts: BulkFormConfigOption[];
  units: string[];
  brickProductTypes: BulkFormConfigOption[];
  brickGrades: BulkFormConfigOption[];
}

export interface BulkQuotation {
  id: string;
  quotationNumber: string;
  status: string;
  materialLabel: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  deliveryCharge: number;
  gstPercent: number;
  discountAmount: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string | null;
  validUntil?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface BulkAssignedExecutive {
  name: string;
}

export interface BulkMaterialCategoryRef {
  id: string;
  slug: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface BulkEnquiry {
  id: string;
  enquiryNumber: string;
  customerId: string;
  companyName: string;
  projectName: string;
  siteType?: string | null;
  expectedStartDate?: string | null;
  materialCategoryId?: string | null;
  materialCategorySlug?: string | null;
  materialCategoryName?: string | null;
  isMixedLoad: boolean;
  materialCategories?: BulkMaterialCategoryRef[] | null;
  productType?: string | null;
  grade?: string | null;
  materialTypeLabel?: string | null;
  expectedQuantity: number;
  expectedUnit: string;
  deliveryRequirement?: BulkDeliveryRequirement | null;
  deliveryDate?: string | null;
  location: string;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  additionalNotes?: string | null;
  preferredContact: BulkPreferredContactValue;
  status: BulkEnquiryStatus | string;
  customerFacingStatus: string;
  assignedExecutive?: BulkAssignedExecutive | null;
  quotations?: BulkQuotation[];
  createdAt: string;
  updatedAt: string;
}

export interface BulkEnquiryListResult {
  items: BulkEnquiry[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CreateBulkEnquiryPayload {
  materialCategoryId?: string;
  materialCategorySlug?: string;
  materialCategoryIds?: string[];
  materialCategorySlugs?: string[];
  isMixedLoad?: boolean;
  productType?: string;
  grade?: string;
  materialTypeLabel?: string;
  estimatedQuantity: number;
  unit: string;
  deliveryRequirement: BulkDeliveryRequirement;
  deliveryDate?: string;
  location: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  addressId?: string;
  additionalNotes?: string;
  preferredContact?: BulkPreferredContact;
  /** Contact details for this enquiry (synced to admin snapshots). */
  contactPhone?: string;
  contactEmail?: string;
  projectName?: string;
  siteType?: string;
  expectedStartDate?: string;
  companyName?: string;
  materialQuantities?: Array<{
    slug: string;
    quantity: number;
    unit: string;
  }>;
}

export const bulkApi = {
  getFormConfig: async (): Promise<BulkFormConfig> => {
    const { data } = await api.get<ApiResponse<BulkFormConfig>>('/bulk/form-config');
    return data.data;
  },

  create: async (payload: CreateBulkEnquiryPayload): Promise<BulkEnquiry> => {
    const { data } = await api.post<ApiResponse<BulkEnquiry>>('/bulk', payload);
    return data.data;
  },

  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<BulkEnquiryListResult> => {
    const { data } = await api.get<ApiResponse<BulkEnquiryListResult>>('/bulk', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      },
    });
    return data.data;
  },

  getById: async (id: string): Promise<BulkEnquiry> => {
    const { data } = await api.get<ApiResponse<BulkEnquiry>>(`/bulk/${id}`);
    return data.data;
  },

  cancel: async (id: string): Promise<BulkEnquiry> => {
    const { data } = await api.patch<ApiResponse<BulkEnquiry>>(
      `/bulk/${id}/cancel`,
    );
    return data.data;
  },
};
