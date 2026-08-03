/**
 * Bajriwala Terms & Conditions content.
 * Update this file only when legal copy changes.
 */

export interface TermsSection {
  id: string;
  title: string;
  /** Bullet points for most sections */
  bullets?: string[];
  /** Key-value rows (e.g. Support contact details) */
  details?: { label: string; value: string }[];
}

export const TERMS_STORAGE_KEY = 'bajriwala_terms_accepted_v1';

export const TERMS_META = {
  title: 'Bajriwala Terms & Conditions',
  lastUpdated: 'August 3, 2026',
  intro:
    'Please read these Terms & Conditions carefully before using Bajriwala. By placing an order, creating an account, or using any service, you agree to these terms.',
  supportEmail: 'support@bajriwala.com',
  supportPhone: '+91 99999 99999',
  supportPhoneTel: '+919999999999',
  workingHours: '9 AM – 8 PM',
} as const;

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'account-registration',
    title: 'Account Registration',
    bullets: [
      'User must provide accurate information.',
      'Mobile verification required.',
      'GST details must be genuine.',
      'User is responsible for account security.',
    ],
  },
  {
    id: 'ordering-payments',
    title: 'Ordering & Payments',
    bullets: [
      'Orders are subject to product availability.',
      'Prices may change without notice.',
      'Bulk pricing applies only after quantity thresholds.',
      'Orders may be cancelled if payment fails.',
    ],
  },
  {
    id: 'delivery-policy',
    title: 'Delivery Policy',
    bullets: [
      'Delivery ETA depends on location.',
      'Heavy materials may require truck allocation.',
      'Small orders may use bike delivery.',
      'Delays due to weather or force majeure are possible.',
    ],
  },
  {
    id: 'returns-refunds',
    title: 'Returns & Refunds',
    bullets: [
      'Damaged materials should be reported within 24 hours.',
      'Refunds processed after verification.',
      'Bulk custom orders may not be refundable.',
    ],
  },
  {
    id: 'gst-billing',
    title: 'GST & Billing',
    bullets: [
      'GST invoice generated after successful order.',
      'Incorrect GST information is user\'s responsibility.',
      'Invoice available in Profile → Invoices.',
    ],
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    bullets: [
      'Do not misuse platform.',
      'Fake orders prohibited.',
      'Fraudulent activity may suspend account.',
    ],
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    bullets: [
      'Customer information remains secure.',
      'Data used only for service improvement.',
      'Bajriwala never sells customer data.',
    ],
  },
  {
    id: 'support',
    title: 'Support',
    details: [
      { label: 'Email', value: 'support@bajriwala.com' },
      { label: 'Phone', value: '+91 XXXXX XXXXX' },
      { label: 'Working Hours', value: '9 AM – 8 PM' },
    ],
  },
];
