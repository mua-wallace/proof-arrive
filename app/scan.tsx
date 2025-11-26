import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator, TouchableOpacity, Platform, ScrollView } from 'react-native';
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

  const handleRequestPermission = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to scan QR codes. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Permission Error',
        'Failed to request camera permission. Please try again.',
        [{ text: 'OK' }]
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
              Please grant camera permission to scan QR codes
            </ThemedText>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleRequestPermission}
              activeOpacity={0.8}>
              <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                Grant Permission
              </ThemedText>
            </TouchableOpacity>
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
    marginBottom: 32,
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

