import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCurrentLocation } from '@/services/location';
import { parseQRCodeData } from '@/services/qr-scanner';
import { getAllArrivals } from '@/services/storage';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRequestPermission = async () => {
    try {
      setPermissionError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await requestPermission();
      if (!result.granted) {
        if (!result.canAskAgain) {
          setPermissionError(
            'Camera permission was denied. Please enable it in your device settings to scan QR codes.'
          );
        } else {
          setPermissionError('Camera permission is required to scan QR codes. Please grant permission.');
        }
      }
    } catch (error) {
      setPermissionError(
        error instanceof Error ? error.message : 'Failed to request camera permission. Please try again.'
      );
    }
  };

  useEffect(() => {
    // Auto-request permission on mount if not granted
    if (permission && !permission.granted && !permission.canAskAgain) {
      // Permission was denied permanently, show the button
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (processing) return;

    setScanning(false);
    setProcessing(true);

    try {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Parse QR code
      const qrData = parseQRCodeData(data);

      // Check if vehicle already exists and is ready to exit
      const allArrivals = await getAllArrivals();
      const existingArrival = allArrivals.find(
        (arrival) => arrival.vehicleId === qrData.vehicleId && arrival.status === 'ready_to_exit'
      );

      if (existingArrival) {
        // Vehicle is ready to exit, navigate to exit flow
        router.push({
          pathname: '/exit-type' as any,
          params: {
            id: existingArrival.id,
            vehicleId: qrData.vehicleId,
            centerId: qrData.centerId || existingArrival.centerId,
            operationType: existingArrival.operationType,
            vehicleGPSDevice: qrData.vehicleGPSDevice || '',
          },
        });
        return;
      }

      // New arrival - get GPS location
      const agentGPS = await getCurrentLocation();

      // Navigate to operation type selection with data
      router.push({
        pathname: '/operation-type',
        params: {
          vehicleId: qrData.vehicleId,
          centerId: qrData.centerId || '',
          vehicleGPSDevice: qrData.vehicleGPSDevice || '',
          agentLatitude: agentGPS.latitude.toString(),
          agentLongitude: agentGPS.longitude.toString(),
          agentAccuracy: agentGPS.accuracy?.toString() || '',
          scanTimestamp: agentGPS.timestamp.toString(),
        },
      });
    } catch (error) {
      setScanning(true);
      setProcessing(false);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Scan Error',
        error instanceof Error ? error.message : 'Failed to process QR code',
        [
          {
            text: 'Try Again',
            onPress: () => setScanning(true),
          },
        ]
      );
    }
  };

  if (!permission) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.message}>Requesting camera permission...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView
          contentContainerStyle={styles.permissionContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.permissionContainer}>
            <ThemedText type="title" style={styles.title}>
              Camera Permission Required
            </ThemedText>
            <ThemedText style={styles.message}>
              ProofArrive needs access to your camera to scan QR codes on vehicles. This allows us to:
            </ThemedText>
            <View style={styles.reasonsList}>
              <View style={styles.reasonItem}>
                <ThemedText style={styles.reasonBullet}>•</ThemedText>
                <ThemedText style={styles.reasonText}>Record vehicle arrivals accurately</ThemedText>
              </View>
              <View style={styles.reasonItem}>
                <ThemedText style={styles.reasonBullet}>•</ThemedText>
                <ThemedText style={styles.reasonText}>Track vehicle movements through the center</ThemedText>
              </View>
              <View style={styles.reasonItem}>
                <ThemedText style={styles.reasonBullet}>•</ThemedText>
                <ThemedText style={styles.reasonText}>Verify vehicle identity via QR codes</ThemedText>
              </View>
            </View>
            
            {permissionError && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{permissionError}</ThemedText>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleRequestPermission}
              activeOpacity={0.8}>
              <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                Grant Permission
              </ThemedText>
            </TouchableOpacity>

            {!permission?.canAskAgain && (
              <ThemedText style={styles.settingsHint}>
                If permission was denied, please enable it in your device Settings → ProofArrive → Camera
              </ThemedText>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 10 }]}
          onPress={handleClose}
          activeOpacity={0.7}>
          <View style={styles.closeButtonContainer}>
            <ThemedText style={styles.closeButtonText} lightColor="#fff" darkColor="#fff">
              ✕
            </ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <ThemedText style={styles.instruction} lightColor="#fff" darkColor="#fff">
          Position QR code within the frame
        </ThemedText>
        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <ThemedText style={styles.processingText} lightColor="#fff" darkColor="#fff">
              Processing...
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  closeButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 24,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  processingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 14,
  },
  permissionContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  permissionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 28,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  reasonsList: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reasonBullet: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  errorContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF5252' + '20',
    borderWidth: 1,
    borderColor: '#FF5252',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsHint: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});

