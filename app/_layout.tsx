import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { CustomSplashScreen } from '@/components/splash-screen';
import { ThemeContextProvider, useThemeContext } from '@/contexts/theme-context';
import { initDatabase } from '@/services/storage';
import { checkAndSync } from '@/services/sync';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const MINIMUM_SPLASH_DURATION = 10000; // 10 seconds in milliseconds

function AppContent() {
  const { colorScheme } = useThemeContext();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const startTime = Date.now();
      
      try {
        // Initialize database on app start
        await initDatabase();
        // Try to sync any pending records when app starts
        await checkAndSync();
      } catch (e) {
        console.warn(e);
      } finally {
        // Always ensure minimum 10 seconds total for users to read the message
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MINIMUM_SPLASH_DURATION - elapsedTime);
        
        // Wait for remaining time to ensure full 10 seconds
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Set app as ready
        setAppIsReady(true);
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return <CustomSplashScreen />;
  }

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="operation-type" options={{ title: 'Operation Type', presentation: 'modal' }} />
        <Stack.Screen name="confirm" options={{ title: 'Confirmation', presentation: 'modal' }} />
        <Stack.Screen name="end-processing" options={{ title: 'End Processing', presentation: 'modal' }} />
        <Stack.Screen name="ok-to-exit" options={{ title: 'OK to Exit', presentation: 'modal' }} />
        <Stack.Screen name="exit-type" options={{ title: 'Exit Type', presentation: 'modal' }} />
        <Stack.Screen name="exit-confirm" options={{ title: 'Exit Confirmation', presentation: 'modal' }} />
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
