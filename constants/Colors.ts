export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F4FBF7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6F7ED',
    textSecondary: '#475569',
    primary: '#10B981',
    accent: '#059669',
    border: '#DCFCE7',
    streak: '#10B981',
    tint: '#10B981',
    icon: '#475569',
    tabIconDefault: '#475569',
    tabIconSelected: '#10B981',
  },
  dark: {
    text: '#F8FAFC',
    background: '#091A12',
    backgroundElement: '#132A1E',
    backgroundSelected: '#1E3E2F',
    textSecondary: '#94A3B8',
    primary: '#34D399',
    accent: '#10B981',
    border: '#1A3F2D',
    streak: '#34D399',
    tint: '#34D399',
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#34D399',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
