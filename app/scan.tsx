import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { parseQRCodeData } from '@/services/qr-scanner';
import { getCurrentLocation } from '@/services/location';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
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

      // Get GPS location
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
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.message}>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Camera Permission Required
        </ThemedText>
        <ThemedText style={styles.message}>
          Please grant camera permission to scan QR codes
        </ThemedText>
        <View style={[styles.button, { backgroundColor: tintColor }]}>
          <ThemedText
            style={styles.buttonText}
            onPress={requestPermission}
            lightColor="#fff"
            darkColor="#fff">
            Grant Permission
          </ThemedText>
        </View>
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
        }}>
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
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
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
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

