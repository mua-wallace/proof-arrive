import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    isDark,
    colorScheme,
  };
}

