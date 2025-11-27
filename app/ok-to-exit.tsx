import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { updateArrivalStatus } from '@/services/storage';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OkToExitScreen() {
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  const handleOkToExit = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const arrivalId = params.id as string;

      await updateArrivalStatus(arrivalId, 'ready_to_exit');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Validated',
        'Vehicle is OK to exit. You can now proceed with exit confirmation.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      setSaving(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to validate exit',
        [{ text: 'OK' }]
      );
    }
  };

  if (saving) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.savingText}>Validating...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
          <ThemedText style={styles.checkmark} lightColor={tintColor} darkColor={tintColor}>
            ✓
          </ThemedText>
        </View>

        <ThemedText type="title" style={styles.title}>
          OK to Exit
        </ThemedText>

        <ThemedText style={styles.description}>
          Validate that this vehicle is ready to exit the center. You can then proceed with exit confirmation.
        </ThemedText>

        <View style={styles.detailsContainer}>
          <DetailRow label="Vehicle ID" value={params.vehicleId as string} />
          <DetailRow label="Operation" value={(params.operationType as string).toUpperCase()} />
        </View>
      </View>

      <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: tintColor }]}
          onPress={handleOkToExit}
          activeOpacity={0.8}>
          <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
            Validate OK to Exit
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.back()}
          activeOpacity={0.8}>
          <ThemedText style={styles.buttonText}>Cancel</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}:</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    fontSize: 16,
    paddingHorizontal: 24,
  },
  detailsContainer: {
    width: '100%',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    gap: 12,
    paddingTop: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  savingText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

