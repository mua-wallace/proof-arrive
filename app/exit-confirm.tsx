import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { saveExit } from '@/services/storage';
import { DEFAULT_CENTER_ID, DEFAULT_AGENT_ID } from '@/constants/config';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { ExitType } from '@/types/arrival';

function ExitConfirmScreen() {
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    saveExitData();
  }, []);

  const saveExitData = async () => {
    if (saving || saved) return;

    setSaving(true);

    try {
      const arrivalId = params.id as string;
      const exitType = params.exitType as ExitType;
      const exitDestination = (params.exitDestination as string) || undefined;
      const exitTime = Date.now();

      // Get current location for exit
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for exit confirmation');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const exitAgentLatitude = location.coords.latitude;
      const exitAgentLongitude = location.coords.longitude;
      const exitAgentAccuracy = location.coords.accuracy || undefined;

      // Get vehicle GPS device from QR scan if available
      const exitVehicleGPSDevice = (params.vehicleGPSDevice as string) || undefined;

      await saveExit({
        id: arrivalId,
        exitType,
        exitDestination,
        exitTime,
        exitAgentLatitude,
        exitAgentLongitude,
        exitAgentAccuracy,
        exitVehicleGPSDevice,
      });

      // Check network status
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      setSaved(true);
      setIsOffline(!isOnline);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setSaving(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Failed to save exit record');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDone = () => {
    router.replace('/(tabs)/list');
  };

  const handleScanAnother = () => {
    router.replace('/scan');
  };

  if (saving && !saved) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Recording exit...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.errorIconContainer, { backgroundColor: '#FF5252' + '20' }]}>
            <MaterialIcons name="error-outline" size={64} color="#FF5252" />
          </View>

          <ThemedText type="title" style={styles.errorTitle}>
            Error
          </ThemedText>

          <ThemedText style={styles.errorMessage}>
            {error}
          </ThemedText>
        </View>

        <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: tintColor }]}
            onPress={() => router.back()}
            activeOpacity={0.8}>
            <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
          <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
        </View>

        <ThemedText type="title" style={styles.title}>
          Exit Confirmed
        </ThemedText>

        {isOffline && (
          <View style={[styles.offlineContainer, { backgroundColor: '#FF9800' + '20', borderColor: '#FF9800' }]}>
            <MaterialIcons name="cloud-off" size={20} color="#FF9800" />
            <ThemedText style={[styles.offlineText, { color: '#FF9800' }]}>
              Saved offline. Will sync when connection is restored.
            </ThemedText>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <DetailRow label="Vehicle ID" value={params.vehicleId as string} />
          <DetailRow label="Exit Type" value={(params.exitType as string).toUpperCase()} />
          {params.exitDestination && (
            <DetailRow label="Destination" value={params.exitDestination as string} />
          )}
          <DetailRow
            label="Exit Time"
            value={formatTimestamp(Date.now())}
          />
        </View>
      </View>

      <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: tintColor }]}
          onPress={handleScanAnother}
          activeOpacity={0.8}>
          <MaterialIcons name="qr-code-scanner" size={20} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
            Scan Another
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: colors.cardBorder }]}
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
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
    paddingHorizontal: 24,
    lineHeight: 24,
    opacity: 0.8,
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
    gap: 8,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
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

export default ExitConfirmScreen;

