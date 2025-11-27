import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { updateArrivalStatus } from '@/services/storage';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export default function OkToExitScreen() {
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleOkToExit = async () => {
    if (saving || success) return;

    setSaving(true);
    setError(null);

    try {
      const arrivalId = params.id as string;

      await updateArrivalStatus(arrivalId, 'ready_to_exit');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setSaving(false);
      setSuccess(true);
    } catch (err) {
      setSaving(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Failed to validate exit');
    }
  };

  const handleDone = () => {
    router.back();
  };

  if (saving) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Validating...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (success) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.successIconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
            <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
          </View>

          <ThemedText type="title" style={styles.successTitle}>
            Validated
          </ThemedText>

          <ThemedText style={styles.successMessage}>
            Vehicle is OK to exit. You can now proceed with exit confirmation.
          </ThemedText>

          <View style={styles.detailsContainer}>
            <DetailRow label="Vehicle ID" value={params.vehicleId as string} />
            <DetailRow label="Operation" value={(params.operationType as string).toUpperCase()} />
            <DetailRow label="Status" value="READY TO EXIT" />
          </View>
        </View>

        <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: tintColor }]}
            onPress={handleDone}
            activeOpacity={0.8}>
            <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
              Done
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
          <MaterialIcons name="verified" size={64} color={tintColor} />
        </View>

        <ThemedText type="title" style={styles.title}>
          OK to Exit
        </ThemedText>

        <ThemedText style={styles.description}>
          Validate that this vehicle is ready to exit the center. You can then proceed with exit confirmation.
        </ThemedText>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#FF5252' + '20', borderColor: '#FF5252' }]}>
            <MaterialIcons name="error-outline" size={20} color="#FF5252" />
            <ThemedText style={[styles.errorText, { color: '#FF5252' }]}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <DetailRow label="Vehicle ID" value={params.vehicleId as string} />
          <DetailRow label="Operation" value={(params.operationType as string).toUpperCase()} />
        </View>
      </View>

      <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: tintColor }]}
          onPress={handleOkToExit}
          activeOpacity={0.8}
          disabled={saving}>
          <MaterialIcons name="verified" size={20} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
            Validate OK to Exit
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: colors.cardBorder }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
          disabled={saving}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  successTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    fontSize: 16,
    paddingHorizontal: 24,
    lineHeight: 24,
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
    paddingHorizontal: 24,
    lineHeight: 24,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

