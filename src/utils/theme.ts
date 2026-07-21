import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// ============================================================
// SMS Vault v2.0 - Design System
// Premium Dark Mode with Glassmorphism & Neon Accents
// ============================================================

export const theme = {
  colors: {
    // Primary Palette
    primary: '#6C63FF',
    primaryDark: '#5249D8',
    primaryLight: '#8F88FF',
    primarySurface: 'rgba(108, 99, 255, 0.12)',
    
    // Accent Colors
    secondary: '#00E5FF',
    secondaryDark: '#00B8D4',
    success: '#00E676',
    successDark: '#00C853',
    warning: '#FFD600',
    warningDark: '#FFC400',
    error: '#FF1744',
    errorDark: '#D50000',
    info: '#29B6F6',
    infoDark: '#0288D1',
    
    // Backgrounds
    background: '#0B0F19',
    backgroundGradientStart: '#0B0F19',
    backgroundGradientEnd: '#151A28',
    surface: '#151A28',
    surfaceVariant: '#1D2436',
    surfaceHighlight: '#252D42',
    
    // Glassmorphism
    glassBackground: 'rgba(21, 26, 40, 0.7)',
    glassBackgroundLight: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderLight: 'rgba(255, 255, 255, 0.15)',
    
    // Text
    text: '#F8F9FA',
    textPrimary: '#F8F9FA',
    textSecondary: '#A0AABF',
    textTertiary: '#64748B',
    textInverse: '#0B0F19',
    
    // Borders & Dividers
    border: '#2C344A',
    borderLight: '#3D4A63',
    divider: '#1D2436',
    
    // Semantic
    encryption: '#FF007F',
    encryptionLight: 'rgba(255, 0, 127, 0.2)',
    cloud: '#00BCD4',
    cloudLight: 'rgba(0, 188, 212, 0.2)',
    
    // Utility
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Cloud Provider Colors
    googleDrive: '#34A853',
    onedrive: '#0078D4',
    dropbox: '#0061FF',
  },
  
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  
  typography: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontFamilyMono: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    
    // Display
    displayLarge: {
      fontSize: 40,
      fontWeight: '800',
      lineHeight: 48,
      letterSpacing: -1.5,
    } as const,
    displayMedium: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 42,
      letterSpacing: -1,
    } as const,
    displaySmall: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      letterSpacing: -0.5,
    } as const,
    
    // Headlines
    headlineLarge: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.25,
    } as const,
    headlineMedium: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    } as const,
    
    // Titles
    titleLarge: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 26,
    } as const,
    titleMedium: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    } as const,
    titleSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    } as const,
    
    // Body
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    } as const,
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    } as const,
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    } as const,
    
    // Labels
    labelLarge: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.2,
    } as const,
    labelMedium: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 0.5,
    } as const,
    labelSmall: {
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 0.5,
    } as const,
    
    // Caption
    caption: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    } as const,
  },
  
  shadow: {
    none: Platform.select({
      ios: {},
      android: { elevation: 0 },
    }),
    xs: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
        shadowColor: '#6C63FF',
      },
    }),
    glowSuccess: Platform.select({
      ios: {
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
        shadowColor: '#00E676',
      },
    }),
    glowEncryption: Platform.select({
      ios: {
        shadowColor: '#FF007F',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
        shadowColor: '#FF007F',
      },
    }),
  },
  
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      damping: 15,
      stiffness: 150,
    },
  },
} as const;

// ============================================================
// Screen Dimensions & Helpers
// ============================================================

export const screenPadding = theme.spacing.md;
export const screenWidth = width;
export const screenHeight = height;
export const isSmallScreen = width < 375;
export const isMediumScreen = width >= 375 && width < 768;
export const isLargeScreen = width >= 768;

// ============================================================
// Pre-built Styles
// ============================================================

export const glassCard = {
  backgroundColor: theme.colors.glassBackground,
  borderRadius: theme.borderRadius.xl,
  borderWidth: 1,
  borderColor: theme.colors.glassBorder,
  ...theme.shadow.md,
};

export const primaryButton = {
  backgroundColor: theme.colors.primary,
  borderRadius: theme.borderRadius.lg,
  paddingVertical: theme.spacing.md,
  paddingHorizontal: theme.spacing.lg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  ...theme.shadow.glow,
};

export const secondaryButton = {
  backgroundColor: 'transparent',
  borderRadius: theme.borderRadius.lg,
  borderWidth: 2,
  borderColor: theme.colors.primary,
  paddingVertical: theme.spacing.md,
  paddingHorizontal: theme.spacing.lg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export const inputStyle = {
  backgroundColor: theme.colors.surfaceVariant,
  borderRadius: theme.borderRadius.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  color: theme.colors.text,
  fontSize: 16,
};

export default theme;
