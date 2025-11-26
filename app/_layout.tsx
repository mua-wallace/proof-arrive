import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ThemeContextProvider, useThemeContext } from '@/contexts/theme-context';
import { initDatabase } from '@/services/storage';
import { checkAndSync } from '@/services/sync';

function AppContent() {
  const { colorScheme } = useThemeContext();

  useEffect(() => {
    // Initialize database on app start
    initDatabase()
      .then(() => {
        // Try to sync any pending records when app starts
        checkAndSync();
      })
      .catch(console.error);
  }, []);

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="operation-type" options={{ title: 'Operation Type', presentation: 'modal' }} />
        <Stack.Screen name="confirm" options={{ title: 'Confirmation', presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeContextProvider>
        <AppContent />
      </ThemeContextProvider>
    </GestureHandlerRootView>
  );
}
