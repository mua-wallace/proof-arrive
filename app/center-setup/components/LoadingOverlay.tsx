/**
 * Loading Overlay Component
 * Shows a loading overlay when processing geozone confirmation
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export function LoadingOverlay() {
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.overlay}>
      <View style={[styles.content, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText type="title" style={styles.title}>
          Verifying...
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Checking center information.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.8,
  },
});

