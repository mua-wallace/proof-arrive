/**
 * Permission Step Component
 * Requests location permission from the user
 */

import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

interface PermissionStepProps {
  isLoading: boolean;
  isChangingCenter: boolean;
  onRequestPermission: () => void;
  onGoBack?: () => void;
}

export function PermissionStep({
  isLoading,
  isChangingCenter,
  onRequestPermission,
  onGoBack,
}: PermissionStepProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      {isChangingCenter && onGoBack && (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={onGoBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="location-on" size={80} color={tintColor} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Location Access Required
        </ThemedText>

        <ThemedText type="default" style={styles.description}>
          ProofArrive needs access to your location to determine which center you're working at.
        </ThemedText>

        <ThemedText type="default" style={styles.description}>
          This helps us:
        </ThemedText>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={tintColor} />
            <ThemedText style={styles.benefitText}>Automatically detect your center</ThemedText>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={tintColor} />
            <ThemedText style={styles.benefitText}>Show relevant incoming vehicles</ThemedText>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={tintColor} />
            <ThemedText style={styles.benefitText}>Track vehicle locations accurately</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={onRequestPermission}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="location-on" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Grant Location Access</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsList: {
    marginBottom: 32,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

