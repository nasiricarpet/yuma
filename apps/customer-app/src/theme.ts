export const theme = {
  colors: {
    brand: '#0f766e',
    brandLight: '#ccfbf1',
    brandDark: '#115e59',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    danger: '#dc2626',
  },
  radius: { sm: 8, md: 12, lg: 16 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fonts: {
    regular: 'Vazirmatn_400Regular',
    bold: 'Vazirmatn_700Bold',
  },
} as const;

export type Theme = typeof theme;
