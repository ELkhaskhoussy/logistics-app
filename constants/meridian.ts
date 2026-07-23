/**
 * Meridian design system — colors, gradients, fonts, radii.
 * Warm (Tunis) ↔ cool (France) accents on deep "ink" surfaces.
 * Shared by every redesigned screen. Keep this the single source of truth.
 */
import { Platform } from 'react-native';

export const M = {
  // ink / dark surfaces
  ink: '#0A1626',
  inkHi: '#12325C',
  // light surfaces
  surface: '#FFFFFF',
  surfaceAlt: '#F3F5F8',
  page: '#EEF1F5',
  line: '#EAEEF3',
  hair: '#F0F2F6',
  // text on light
  text: '#0A1626',
  textMut: '#6B7280',
  textFaint: '#8A93A3',
  // text on ink
  onInk: '#FFFFFF',
  onInkMut: '#8FA0B8',
  onInkFaint: '#5B6577',
  // accents
  warm1: '#EC5B43',
  warm2: '#F5A623',
  cool: '#38BDF8',
  blue: '#2563EB',
  // semantic
  green: '#16A34A',
  greenBg: '#E7F7EE',
  amber: '#B8863B',
  amberBg: '#FBF3E1',
  danger: '#EC5B43',
} as const;

// Gradients (expo-linear-gradient expects string[])
export const warmGrad = ['#EC5B43', '#F5A623'];
export const coolGrad = ['#2563EB', '#38BDF8'];
export const inkGrad = [M.inkHi, M.ink];

export const fonts = {
  // On web we can supply CSS fallbacks; on native the exact family name is required.
  display: Platform.select({ web: "'Space Grotesk', system-ui, sans-serif", default: 'Space Grotesk' }) as string,
  body: Platform.select({ web: "'Inter Tight', system-ui, sans-serif", default: 'Inter Tight' }) as string,
};

export const radii = { field: 14, card: 20, cta: 16, pill: 9999 };
