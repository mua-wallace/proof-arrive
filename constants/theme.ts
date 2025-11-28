/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4FC3F7';

/**
 * Background color options - Easy to switch by changing these values
 * 
 * To change the background color, simply update the 'currentLightBg' and 'currentDarkBg'
 * variables below to use any of the alternatives:
 * 
 * Light mode options:
 * - primary: '#F0F9FF' (Soft blue-white - current, matches splash screen)
 * - alternative1: '#F5F7FA' (Cool gray-white)
 * - alternative2: '#FEF3E2' (Warm cream)
 * - alternative3: '#F0FDF4' (Soft green-white)
 * - alternative4: '#FDF2F8' (Soft pink-white)
 * 
 * Dark mode options:
 * - primary: '#0F172A' (Deep blue-dark - current)
 * - alternative1: '#1A1B23' (Dark gray-blue)
 * - alternative2: '#1E1E2E' (Dark purple-gray)
 * - alternative3: '#0D1117' (GitHub dark)
 * - alternative4: '#1C1C1E' (iOS dark)
 */
export const BackgroundColors = {
  light: {
    primary: '#F0F9FF', // Soft blue-white (current - matches splash)
    alternative1: '#F5F7FA', // Cool gray-white
    alternative2: '#FEF3E2', // Warm cream
    alternative3: '#F0FDF4', // Soft green-white
    alternative4: '#FDF2F8', // Soft pink-white
  },
  dark: {
    primary: '#0F172A', // Deep blue-dark (current)
    alternative1: '#1A1B23', // Dark gray-blue
    alternative2: '#1E1E2E', // Dark purple-gray
    alternative3: '#0D1117', // GitHub dark
    alternative4: '#1C1C1E', // iOS dark
  },
};

// Current background selection - Easy to switch by changing 'primary' to 'alternative1', etc.
// Example: Change to BackgroundColors.light.alternative2 for warm cream background
const currentLightBg = BackgroundColors.light.primary;
const currentDarkBg = BackgroundColors.dark.primary;

export const Colors = {
  light: {
    text: '#11181C',
    background: currentLightBg, // Changed from '#fff'
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    cardBackground: 'rgba(255, 255, 255, 0.7)', // More visible on colored background
    cardBorder: 'rgba(10, 126, 164, 0.15)', // Subtle tint border
    divider: 'rgba(0, 0, 0, 0.08)',
    shadow: '#000',
    disabled: '#ccc',
  },
  dark: {
    text: '#ECEDEE',
    background: currentDarkBg, // Changed from '#151718'
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    cardBackground: 'rgba(255, 255, 255, 0.08)', // Slightly more visible
    cardBorder: 'rgba(79, 195, 247, 0.2)', // Subtle tint border
    divider: 'rgba(255, 255, 255, 0.1)',
    shadow: '#000',
    disabled: '#666',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
