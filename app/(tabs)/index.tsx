import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SwipeableTab } from '@/components/swipeable-tab';

const TABS = ['index', 'list', 'profile'];

export default function ScanTabScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  const handleStartScanning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan');
  };

  return (
    <SwipeableTab currentTab="index" tabs={TABS}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.content}>
            <ThemedText type="title" style={styles.welcomeTitle}>
              ProofArrive
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Vehicle arrival tracking system
            </ThemedText>
            <ThemedView style={[styles.divider, { backgroundColor: tintColor }]} />
            <ThemedText style={styles.description}>
              Scan QR codes to record vehicle arrivals and track operations
            </ThemedText>

            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: tintColor }]}
              onPress={handleStartScanning}
              activeOpacity={0.8}>
              <ThemedText style={styles.scanButtonText} lightColor="#fff" darkColor="#fff">
                Start Scanning
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
    lineHeight: 26,
  },
  divider: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 48,
  },
  scanButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
