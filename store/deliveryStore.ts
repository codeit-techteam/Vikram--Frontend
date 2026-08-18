import { create } from 'zustand';

import type { CustomerAddress } from '@services/customer.api';
import type { DeliverySite as ApiDeliverySite } from '@services/sites.api';

export interface DeliverySite {
  id: string;
  name: string;
  address: string;
}

export interface ProfileSite {
  id: string;
  name: string;
  address: string;
  isPrimary?: boolean;
  icon: 'person' | 'business';
  siteType?: string | null;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProjectSite {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  status: 'active' | 'pending';
  warehouseDist: string;
  estDelivery: string;
  gateNote?: string;
  lat: number;
  lng: number;
}

/** Maps `/customer/address` records onto the account screen's `ProfileSite` shape. */
export function mapAddressesToProfileSites(addresses: CustomerAddress[]): ProfileSite[] {
  return addresses.map((addr, index) => {
    const addressLine =
      addr.address ??
      [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode ?? addr.postalCode]
        .filter(Boolean)
        .join(', ');

    return {
      id: addr.id ?? `addr-${index}`,
      name: addr.label ?? addr.name ?? `Site ${index + 1}`,
      address: addressLine,
      isPrimary: Boolean(addr.isDefault ?? addr.isPrimary),
      icon: addr.type === 'business' || addr.type === 'PROJECT_SITE' ? 'business' : 'person',
      latitude: typeof addr.latitude === 'number' ? addr.latitude : undefined,
      longitude: typeof addr.longitude === 'number' ? addr.longitude : undefined,
    };
  });
}

export function mapDeliverySitesToProfileSites(sites: ApiDeliverySite[]): ProfileSite[] {
  return sites.map((site) => ({
    id: site.id,
    name: site.siteName,
    address: [site.fullAddress, site.city, site.state, site.pincode]
      .filter(Boolean)
      .join(', '),
    isPrimary: site.isPrimary,
    icon: 'business' as const,
    siteType: site.siteType,
    city: site.city,
    latitude: site.latitude,
    longitude: site.longitude,
  }));
}

interface DeliveryState {
  sites: DeliverySite[];
  selectedSiteId: string | null;
  profileSites: ProfileSite[];
  projectSites: ProjectSite[];
  assignedHubId: string | null;
  assignedHubName: string | null;
  assignedHubCode: string | null;
  setSelectedSite: (id: string) => void;
  setSites: (sites: DeliverySite[]) => void;
  setAssignedHub: (hub: {
    id: string;
    name: string;
    code?: string;
  } | null) => void;
  setProfileSitesFromAddresses: (addresses: CustomerAddress[]) => void;
  setProfileSitesFromDeliverySites: (sites: ApiDeliverySite[]) => void;
  updateProfileSite: (id: string, data: Partial<ProfileSite>) => void;
  addProfileSite: (site: Omit<ProfileSite, 'id'>) => void;
  addProjectSite: (site: Omit<ProjectSite, 'id'>) => void;
  updateProjectSite: (id: string, data: Partial<ProjectSite>) => void;
  reset: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  sites: [],
  selectedSiteId: null,
  profileSites: [],
  projectSites: [],
  assignedHubId: null,
  assignedHubName: null,
  assignedHubCode: null,

  setSelectedSite: (id) => set({ selectedSiteId: id }),

  setSites: (sites) =>
    set((state) => ({
      sites,
      selectedSiteId:
        sites.find((s) => s.id === state.selectedSiteId)?.id ??
        sites[0]?.id ??
        null,
    })),

  setAssignedHub: (hub) =>
    set({
      assignedHubId: hub?.id ?? null,
      assignedHubName: hub?.name ?? null,
      assignedHubCode: hub?.code ?? null,
    }),

  setProfileSitesFromAddresses: (addresses) =>
    set({ profileSites: mapAddressesToProfileSites(addresses) }),

  setProfileSitesFromDeliverySites: (sites) =>
    set({ profileSites: mapDeliverySitesToProfileSites(sites) }),

  updateProfileSite: (id, data) =>
    set((state) => ({
      profileSites: state.profileSites.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),

  addProfileSite: (site) =>
    set((state) => ({
      profileSites: [...state.profileSites, { ...site, id: `ps-${Date.now()}` }],
    })),

  addProjectSite: (site) =>
    set((state) => ({
      projectSites: [
        ...state.projectSites,
        { ...site, id: `site-${Date.now()}`, status: site.status ?? 'pending' },
      ],
    })),

  updateProjectSite: (id, data) =>
    set((state) => ({
      projectSites: state.projectSites.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),

  reset: () =>
    set({
      sites: [],
      selectedSiteId: null,
      profileSites: [],
      projectSites: [],
      assignedHubId: null,
      assignedHubName: null,
      assignedHubCode: null,
    }),
}));

/** @deprecated Use empty defaults — kept for any leftover demo imports */
export const DEFAULT_PROJECT_SITES: ProjectSite[] = [];
