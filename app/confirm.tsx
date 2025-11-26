import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { saveArrival } from '@/services/storage';
import { DEFAULT_CENTER_ID, DEFAULT_AGENT_ID } from '@/constants/config';
import { useThemeColor } from '@/hooks/use-theme-color';
import { OperationType } from '@/types/arrival';

function ConfirmScreen() {
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    saveArrivalData();
  }, []);

  const saveArrivalData = async () => {
    if (saving || saved) return;

    setSaving(true);

    try {
      const vehicleId = params.vehicleId as string;
      const centerId = (params.centerId as string) || DEFAULT_CENTER_ID;
      const operationType = params.operationType as OperationType;
      const scanTimestamp = parseInt(params.scanTimestamp as string, 10);
      const agentLatitude = parseFloat(params.agentLatitude as string);
      const agentLongitude = parseFloat(params.agentLongitude as string);
      const agentAccuracy = params.agentAccuracy
        ? parseFloat(params.agentAccuracy as string)
        : undefined;
      const vehicleGPSDevice = (params.vehicleGPSDevice as string) || undefined;

      const recordId = `ARR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await saveArrival({
        id: recordId,
        vehicleId,
        centerId,
        agentId: DEFAULT_AGENT_ID,
        operationType,
        scanTimestamp,
        agentLatitude,
        agentLongitude,
        agentAccuracy,
        vehicleGPSDevice,
      });

      // Check network status
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      setSaved(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (!isOnline) {
        Alert.alert(
          'Saved Offline',
          'Your arrival record has been saved locally and will sync when you regain internet connection.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setSaving(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Save Error',
        error instanceof Error ? error.message : 'Failed to save arrival record',
        [{ text: 'OK' }]
      );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDone = () => {
    router.replace('/');
  };

  const handleScanAnother = () => {
    router.replace('/scan');
  };

  if (saving && !saved) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.savingText}>Saving arrival record...</ThemedText>
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
          Arrival Confirmed
        </ThemedText>

        <View style={styles.detailsContainer}>
          <DetailRow label="Vehicle ID" value={params.vehicleId as string} />
          <DetailRow label="Center ID" value={(params.centerId as string) || DEFAULT_CENTER_ID} />
          <DetailRow
            label="Operation"
            value={(params.operationType as string).toUpperCase()}
          />
          <DetailRow
            label="Arrival Time"
            value={formatTimestamp(parseInt(params.scanTimestamp as string, 10))}
          />
          <DetailRow
            label="Location"
            value={`${parseFloat(params.agentLatitude as string).toFixed(6)}, ${parseFloat(params.agentLongitude as string).toFixed(6)}`}
          />
        </View>
      </View>

      <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: tintColor }]}
          onPress={handleScanAnother}
          activeOpacity={0.8}>
          <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
            Scan Another
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleDone}
          activeOpacity={0.8}>
          <ThemedText style={styles.buttonText}>Done</ThemedText>
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
    marginBottom: 24,
    textAlign: 'center',
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

export default ConfirmScreen;

