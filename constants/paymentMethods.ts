import type { Ionicons } from '@expo/vector-icons';

export type PaymentMethodId = 'upi' | 'cards' | 'cash_on_delhivery';

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  titleKey:
    | 'payWithUpi'
    | 'payWithCards'
    | 'cashOnDelhivery';
  subtitleKey:
    | 'upiSubtitle'
    | 'cardsSubtitle'
    | 'cashOnDelhiverySubtitle';
  descriptionKey:
    | 'upiDescription'
    | 'cardsDescription'
    | 'cashOnDelhiveryDescription';
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  comingSoon: boolean;
  comingSoonTitleKey: 'payWithUpi' | 'payWithCards';
  comingSoonMessageKey: 'upiComingSoonMessage' | 'cardsComingSoonMessage';
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'upi',
    titleKey: 'payWithUpi',
    subtitleKey: 'upiSubtitle',
    descriptionKey: 'upiDescription',
    icon: 'qr-code-outline',
    enabled: false,
    comingSoon: true,
    comingSoonTitleKey: 'payWithUpi',
    comingSoonMessageKey: 'upiComingSoonMessage',
  },
  {
    id: 'cards',
    titleKey: 'payWithCards',
    subtitleKey: 'cardsSubtitle',
    descriptionKey: 'cardsDescription',
    icon: 'card-outline',
    enabled: false,
    comingSoon: true,
    comingSoonTitleKey: 'payWithCards',
    comingSoonMessageKey: 'cardsComingSoonMessage',
  },
  {
    id: 'cash_on_delhivery',
    titleKey: 'cashOnDelhivery',
    subtitleKey: 'cashOnDelhiverySubtitle',
    descriptionKey: 'cashOnDelhiveryDescription',
    icon: 'cash-outline',
    enabled: true,
    comingSoon: false,
    comingSoonTitleKey: 'payWithUpi',
    comingSoonMessageKey: 'upiComingSoonMessage',
  },
];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = 'cash_on_delhivery';

export function getPaymentMethodById(id: PaymentMethodId) {
  return PAYMENT_METHODS.find((method) => method.id === id);
}
