import { create } from 'zustand';

export type UserRole =
  | 'individual'
  | 'contractor'
  | 'interior_designer'
  | 'builder_developer';

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  recommended?: boolean;
}

export const LANGUAGES: Language[] = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', recommended: true },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

interface AuthState {
  phoneNumber: string;
  selectedRole: UserRole | null;
  companyName: string;
  gstNumber: string;
  selectedLanguage: string;
  setPhoneNumber: (phone: string) => void;
  setSelectedRole: (role: UserRole) => void;
  setCompanyName: (name: string) => void;
  setGstNumber: (gst: string) => void;
  setSelectedLanguage: (lang: string) => void;
  reset: () => void;
}

const initialState = {
  phoneNumber: '',
  selectedRole: null as UserRole | null,
  companyName: '',
  gstNumber: '',
  selectedLanguage: 'hi',
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setPhoneNumber: (phone) => set({ phoneNumber: phone }),
  setSelectedRole: (role) => set({ selectedRole: role }),
  setCompanyName: (name) => set({ companyName: name }),
  setGstNumber: (gst) => set({ gstNumber: gst }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  reset: () => set(initialState),
}));
