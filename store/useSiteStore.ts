import { create } from 'zustand';

export interface DeliverySite {
  id: string;
  name: string;
  address: string;
  pincode: string;
  gateInstructions?: string;
}

interface SiteState {
  sites: DeliverySite[];
  addSite: (site: Omit<DeliverySite, 'id'>) => void;
  updateSite: (id: string, site: Partial<DeliverySite>) => void;
  removeSite: (id: string) => void;
}

export const useSiteStore = create<SiteState>((set) => ({
  sites: [],
  addSite: (site) =>
    set((state) => ({
      sites: [...state.sites, { ...site, id: Date.now().toString() }],
    })),
  updateSite: (id, updates) =>
    set((state) => ({
      sites: state.sites.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  removeSite: (id) =>
    set((state) => ({
      sites: state.sites.filter((s) => s.id !== id),
    })),
}));
