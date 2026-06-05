import { create } from 'zustand';

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

const DEFAULT_SITES: DeliverySite[] = [
  { id: 's1', name: 'Mumbai North Wing', address: 'Plot 42, Goregaon West' },
  { id: 's2', name: 'Pune IT Tower B', address: 'Hinjewadi Phase 3' },
  { id: 's3', name: 'Pune IT Tower C', address: 'Hinjewadi Phase 3' },
  { id: 's4', name: 'Pune IT Tower D', address: 'Hinjewadi Phase 3' },
];

export const DEFAULT_PROFILE_SITES: ProfileSite[] = [
  {
    id: 'ps1',
    name: 'Andheri East Site',
    address: 'Plot 42, MIDC Industrial Estate, Near Metro Station, Mumbai 400093',
    isPrimary: true,
    icon: 'person',
  },
  {
    id: 'ps2',
    name: 'Worli Project',
    address: 'Senapati Bapat Marg, Opp. Phoenix Mall, Worli, Mumbai 400018',
    icon: 'business',
  },
];

export const DEFAULT_PROJECT_SITES: ProjectSite[] = [
  {
    id: 'site1',
    name: 'Skyline Tower Site',
    contact: 'Vikram Malhotra',
    phone: '+919876543210',
    address: 'Andheri East, Near SEEPZ',
    city: 'Mumbai',
    pincode: '400093',
    status: 'active',
    warehouseDist: '8.4 km',
    estDelivery: '45m',
    gateNote:
      'Gate 4, Heavy vehicle access only. Security clearance required at main entry.',
    lat: 19.076,
    lng: 72.877,
  },
  {
    id: 'site2',
    name: 'Mumbai Metro P-4',
    contact: 'Sanjay Gupta',
    phone: '+919876543211',
    address: 'Hinjewadi Phase 3',
    city: 'Mumbai',
    pincode: '400050',
    status: 'pending',
    warehouseDist: '12.2 km',
    estDelivery: '1h 15m',
    gateNote: 'Flyover construction zone. Restricted hours 22:00 – 05:00 only.',
    lat: 19.12,
    lng: 72.85,
  },
  {
    id: 'site3',
    name: 'New Harbor Bridge',
    contact: 'Anita Desai',
    phone: '+919876543212',
    address: 'Harbor Gate Entrance',
    city: 'Mumbai',
    pincode: '400001',
    status: 'active',
    warehouseDist: '18.5 km',
    estDelivery: '2h 10m',
    gateNote: 'Harbor Gate Entrance. Contact site manager 15 mins prior to arrival.',
    lat: 18.95,
    lng: 72.83,
  },
];

interface DeliveryState {
  sites: DeliverySite[];
  selectedSiteId: string;
  profileSites: ProfileSite[];
  projectSites: ProjectSite[];
  setSelectedSite: (id: string) => void;
  setSites: (sites: DeliverySite[]) => void;
  updateProfileSite: (id: string, data: Partial<ProfileSite>) => void;
  addProfileSite: (site: Omit<ProfileSite, 'id'>) => void;
  addProjectSite: (site: Omit<ProjectSite, 'id'>) => void;
  updateProjectSite: (id: string, data: Partial<ProjectSite>) => void;
  reset: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  sites: DEFAULT_SITES,
  selectedSiteId: DEFAULT_SITES[0].id,
  profileSites: DEFAULT_PROFILE_SITES,
  projectSites: DEFAULT_PROJECT_SITES,

  setSelectedSite: (id) => set({ selectedSiteId: id }),

  setSites: (sites) =>
    set((state) => ({
      sites: sites.length > 0 ? sites : DEFAULT_SITES,
      selectedSiteId: sites.length > 0 ? sites[0].id : state.selectedSiteId,
    })),

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
      sites: DEFAULT_SITES,
      selectedSiteId: DEFAULT_SITES[0].id,
      profileSites: DEFAULT_PROFILE_SITES,
      projectSites: DEFAULT_PROJECT_SITES,
    }),
}));
