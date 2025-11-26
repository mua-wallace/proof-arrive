import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { initDatabase } from '@/services/storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'theme_mode';

async function getStoredTheme(): Promise<ThemeMode | null> {
  try {
    const db = await initDatabase();
    // Ensure settings table exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [THEME_KEY]
    );
    if (result && (result.value === 'light' || result.value === 'dark' || result.value === 'auto')) {
      return result.value as ThemeMode;
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
  return null;
}

async function saveTheme(mode: ThemeMode): Promise<void> {
  try {
    const db = await initDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [THEME_KEY, mode]
    );
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load saved theme preference on mount
    getStoredTheme().then((saved) => {
      if (saved) {
        setThemeModeState(saved);
      }
      setIsInitialized(true);
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveTheme(mode);
  };

  const getEffectiveColorScheme = (): 'light' | 'dark' => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const colorScheme = getEffectiveColorScheme();
  const isDark = colorScheme === 'dark';

  // Don't render until theme is loaded
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider');
  }
  return context;
}

