import type { CmsPromoSlide } from '@utils/cmsAdapters';

export interface PromoBannerTheme {
  gradient: [string, string];
  leadColor: string;
  accentColor: string;
  subtitleColor: string;
  badgeBg: string;
  badgeText: string;
  ctaBg: string;
  ctaText: string;
}

const BULK: PromoBannerTheme = {
  gradient: ['#FFF8F0', '#FFE4C2'],
  leadColor: '#111111',
  accentColor: '#C62828',
  subtitleColor: '#3F3F46',
  badgeBg: '#C62828',
  badgeText: '#FFFFFF',
  ctaBg: '#111111',
  ctaText: '#FEB623',
};

const BIDDER: PromoBannerTheme = {
  gradient: ['#FFF4E8', '#FFD7A3'],
  leadColor: '#111111',
  accentColor: '#E65100',
  subtitleColor: '#3F3F46',
  badgeBg: '#E65100',
  badgeText: '#FFFFFF',
  ctaBg: '#FFFFFF',
  ctaText: '#C62828',
};

const SAVING: PromoBannerTheme = {
  gradient: ['#FFF9E6', '#FFE082'],
  leadColor: '#7A1212',
  accentColor: '#C62828',
  subtitleColor: '#3F3F46',
  badgeBg: '#C62828',
  badgeText: '#FFFFFF',
  ctaBg: '#FFFFFF',
  ctaText: '#C62828',
};

const DEFAULT_THEME = BULK;

function isLightHex(hex: string): boolean {
  const value = hex.replace('#', '');
  if (value.length !== 6) return true;
  const n = Number.parseInt(value, 16);
  if (!Number.isFinite(n)) return true;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 168;
}

function darkenHex(hex: string, amount = 0.12): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const n = Number.parseInt(value, 16);
  if (!Number.isFinite(n)) return hex;
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function splitPromoHeadline(title: string): {
  lead: string;
  accent: string;
} {
  const trimmed = title.trim();
  if (!trimmed) return { lead: '', accent: '' };

  if (trimmed.includes('|')) {
    const [lead, ...rest] = trimmed.split('|');
    return { lead: lead.trim(), accent: rest.join('|').trim() };
  }

  const newline = trimmed.split(/\n+/);
  if (newline.length > 1) {
    return { lead: newline[0].trim(), accent: newline.slice(1).join(' ').trim() };
  }

  const match = trimmed.match(
    /^(.*?)\s+((?:bigger|flat|off|save|bid|win|saving).+)$/i,
  );
  if (match?.[1] && match[2]) {
    return { lead: match[1].trim(), accent: match[2].trim() };
  }

  return { lead: trimmed, accent: '' };
}

export function resolvePromoTheme(slide: CmsPromoSlide): PromoBannerTheme {
  const haystack = `${slide.title} ${slide.badge} ${slide.subtitle}`.toLowerCase();
  let theme = DEFAULT_THEME;
  if (/\bbid/.test(haystack)) theme = BIDDER;
  else if (/\bsav/.test(haystack) && !haystack.includes('bulk')) theme = SAVING;
  else if (haystack.includes('bulk')) theme = BULK;

  const background = slide.backgroundColor?.trim();
  const cta = slide.ctaColor?.trim();

  if (background && /^#([0-9a-f]{6})$/i.test(background)) {
    theme = {
      ...theme,
      gradient: [background, darkenHex(background, 0.1)],
    };
  }

  if (cta && /^#([0-9a-f]{6})$/i.test(cta)) {
    theme = {
      ...theme,
      ctaBg: cta,
      ctaText: isLightHex(cta) ? theme.accentColor : theme.ctaText,
    };
  }

  return theme;
}
