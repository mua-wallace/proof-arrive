import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeContext } from '@/contexts/theme-context';

export function useColorScheme(): 'light' | 'dark' | null {
  try {
    const { colorScheme } = useThemeContext();
    return colorScheme;
  } catch {
    // Fallback to system color scheme if context not available
    return useRNColorScheme();
  }
}
