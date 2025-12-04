/**
 * Loading Step Component
 * Displays a loading indicator with message
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface LoadingStepProps {
  title: string;
  message: string;
}

export function LoadingStep({ title, message }: LoadingStepProps) {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, styles.centerContent, { paddingTop: insets.top + 100 }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          {message}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});

