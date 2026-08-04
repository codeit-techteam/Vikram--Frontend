export type CmsRedirectType =
  | 'ROUTE'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'EXTERNAL'
  | 'NONE'
  | 'OFFER'
  | 'BRAND'
  | 'SEARCH'
  | 'WHATSAPP'
  | 'BULK_INQUIRY'
  | 'MEMBERSHIP'
  | 'MATERIAL_EXPERT';

export interface CmsBanner {
  id: string;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  buttonAction: string | null;
  bannerType: string;
  imageUrl: string;
  mobileUrl?: string | null;
  tabletUrl?: string | null;
  desktopUrl?: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  badge: string | null;
  ctaColor?: string | null;
  backgroundColor?: string | null;
  priority: number;
  displayOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  linkUrl: string | null;
  linkType: string | null;
  linkTarget: string | null;
  secondaryButtonText: string | null;
  secondaryLinkUrl: string | null;
  secondaryLinkType: string | null;
  secondaryLinkTarget: string | null;
  placement: string;
}

export interface CmsAdvertisement {
  id: string;
  title: string;
  brandName: string;
  description: string | null;
  imageUrl: string;
  logoUrl?: string | null;
  buttonText: string | null;
  redirectType: CmsRedirectType | string;
  redirectId: string | null;
  displayOrder: number;
  priority: number;
  isActive: boolean;
}

export interface CmsTestimonial {
  id: string;
  customerName: string;
  designation: string | null;
  city: string | null;
  location: string | null;
  rating: number;
  review: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  profileImage: string | null;
  imageUrl: string | null;
  displayOrder: number;
  featured: boolean;
  isActive: boolean;
  type: 'VIDEO' | 'IMAGE' | 'TEXT' | string;
}

export interface CmsPromotion {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  badge: string | null;
  benefits: string[] | null;
  redirectType: CmsRedirectType | string;
  redirectId: string | null;
  cardType: string;
  priority: number;
  displayOrder: number;
  isActive: boolean;
}

export interface CmsHomeSection {
  id: string;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  displayOrder: number;
  enabled: boolean;
  apiSource: string | null;
  layoutType: string | null;
}

export interface CmsOffer {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountLabel: string | null;
  badge: string | null;
  offerType: string;
  displayOrder: number;
  priority: number;
  endsAt: string | null;
}

export interface CmsQuickAction {
  id: string;
  label: string;
  iconUrl: string | null;
  iconKey: string | null;
  redirectType: CmsRedirectType | string;
  redirectId: string | null;
  displayOrder: number;
}

export interface CmsEmergencyBanner {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkTarget: string | null;
  dismissible: boolean;
}

export interface CmsHomeResponse {
  sections: CmsHomeSection[];
  banners: CmsBanner[];
  heroBanners?: CmsBanner[];
  ads: CmsAdvertisement[];
  brandAdvertisements?: CmsAdvertisement[];
  testimonials: CmsTestimonial[];
  promotions: CmsPromotion[];
  videoBanners: CmsBanner[];
  heroVideo?: CmsBanner | null;
  offers?: CmsOffer[];
  quickActions?: CmsQuickAction[];
  emergencyBanner?: CmsEmergencyBanner | null;
  emergencyDelivery: CmsPromotion | null;
  bulkProcurement: CmsPromotion | null;
  priorityExpress: CmsPromotion | null;
  membership: CmsPromotion | null;
}
