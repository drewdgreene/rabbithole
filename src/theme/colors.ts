// Light theme color palette - Earthy Rabbit Hole aesthetic
export const lightColors = {
  // Primary Colors
  primary: '#6B4226',       // Earth brown
  primaryLight: '#F5E6D3',  // Light warm tan
  primaryDark: '#4A2E1A',   // Deep earth brown

  // Secondary Colors
  secondary: '#8B7355',     // Warm khaki
  accent: '#D4A574',        // Golden amber
  link: '#2E7D6F',          // Deep teal (Wikipedia links feel)

  // Main backgrounds
  background: '#FAF6F0',       // Parchment
  backgroundSecondary: '#F0E8DC', // Slightly darker parchment
  backgroundTertiary: '#FFFDF9',  // Warm white

  // Surface (cards, elevated elements)
  surface: '#FFFDF9',       // Warm white

  // Text colors
  textPrimary: '#2C1810',   // Dark brown
  textSecondary: '#5C4033',  // Medium brown
  textTertiary: '#8B7355',   // Warm khaki

  // Borders & Dividers
  border: '#DDD4C8',
  divider: '#E8E0D4',
  separator: '#DDD4C8',

  // UI elements
  icon: '#6B4226',
  iconActive: '#6B4226',

  // Status & Semantic Colors
  success: '#5B8C5A',       // Forest green
  error: '#C75B4A',         // Terracotta red
  warning: '#D4A574',       // Golden amber
  info: '#2E7D6F',          // Deep teal

  // Input & Interactive Elements
  inputBackground: '#FFFDF9',
  inputBorder: '#DDD4C8',
  inputFocusBorder: '#6B4226',
  placeholder: '#8B7355',

  // FAB (Floating Action Button)
  fabBackground: '#6B4226',
  fabIcon: '#FFFDF9',

  // Context menu
  menuBackground: '#FFFDF9',
  menuSeparator: '#E8E0D4',

  // Overlays
  overlay: 'rgba(44, 24, 16, 0.5)',
  overlayLight: 'rgba(44, 24, 16, 0.3)',

  // Shadows
  shadowColor: '#2C1810',

  // Selection mode
  selectionOverlay: 'rgba(107, 66, 38, 0.15)',
  selectionBorder: '#6B4226',

  // Category badge colors
  categoryBadge: '#E8DED2',
  categoryBadgeText: '#6B4226',
} as const;

// Dark theme color palette - Deep Tunnel aesthetic
export const darkColors = {
  // Primary Colors
  primary: '#D4A574',        // Golden amber
  primaryLight: '#3D2A1A',   // Warm dark brown
  primaryDark: '#C49464',    // Darker amber

  // Secondary Colors
  secondary: '#8B7355',      // Warm khaki
  accent: '#D4A574',         // Golden amber
  link: '#5CC4B0',           // Bright teal

  // Main backgrounds
  background: '#1A120B',        // Deep tunnel
  backgroundSecondary: '#261A10', // Slightly lighter tunnel
  backgroundTertiary: '#2D1F14',  // Card surface

  // Surface (cards, elevated elements)
  surface: '#2D1F14',

  // Text colors
  textPrimary: '#EDE4D8',    // Warm parchment
  textSecondary: '#C4B49E',   // Muted parchment
  textTertiary: '#8B7355',    // Warm khaki

  // Borders & Dividers
  border: '#3D2A1A',
  divider: '#332210',
  separator: '#3D2A1A',

  // UI elements
  icon: '#D4A574',
  iconActive: '#D4A574',

  // Status & Semantic Colors
  success: '#7BAF7A',
  error: '#E08070',
  warning: '#D4A574',
  info: '#5CC4B0',

  // Input & Interactive Elements
  inputBackground: '#2D1F14',
  inputBorder: '#3D2A1A',
  inputFocusBorder: '#D4A574',
  placeholder: '#8B7355',

  // FAB (Floating Action Button)
  fabBackground: '#D4A574',
  fabIcon: '#1A120B',

  // Context menu
  menuBackground: '#2D1F14',
  menuSeparator: '#332210',

  // Overlays
  overlay: 'rgba(26, 18, 11, 0.85)',
  overlayLight: 'rgba(26, 18, 11, 0.6)',

  // Shadows
  shadowColor: '#000000',

  // Selection mode
  selectionOverlay: 'rgba(212, 165, 116, 0.2)',
  selectionBorder: '#D4A574',

  // Category badge colors
  categoryBadge: '#3D2A1A',
  categoryBadgeText: '#D4A574',
} as const;

export const colors = lightColors;
