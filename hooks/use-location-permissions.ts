/**
 * Location Permissions Hook
 * Handles location permission requests and status checking
 */

import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import type { LocationPermissionStatus } from '@/types/geozone';
import { logger } from '@/utils/logger';

export const useLocationPermissions = () => {
  const [foregroundPermission, setForegroundPermission] = useState<LocationPermissionStatus>({
    granted: false,
    denied: false,
    canAskAgain: true,
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkForegroundPermission = async () => {
    try {
      setIsChecking(true);
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      setForegroundPermission({
        granted: status === 'granted',
        denied: status === 'denied',
        canAskAgain,
      });
    } catch (error) {
      logger.error('Error checking permissions:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsChecking(false);
    }
  };

  const requestForegroundPermission = async (): Promise<boolean> => {
    try {
      // If already granted, return true
      if (foregroundPermission.granted) {
        return true;
      }

      // If cannot ask again, explain to user
      if (!foregroundPermission.canAskAgain) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to determine your current zone and center. Please enable it in the app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open app settings
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return false;
      }

      // Request permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      const newPermissionStatus = {
        granted: status === 'granted',
        denied: status === 'denied',
        canAskAgain,
      };

      setForegroundPermission(newPermissionStatus);

      // If denied, explain why it's important
      if (status === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Location is required to determine which zone and center you are in. Without this permission, the app cannot function properly.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      return status === 'granted';
    } catch (error) {
      logger.error('Error requesting permission:', error instanceof Error ? error.message : String(error));
      Alert.alert(
        'Error',
        'An error occurred while requesting location permission.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
  };

  const showPermissionRationale = (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Location Permission',
        'This app needs access to your location to:\n\n' +
          '• Determine which zone you are currently in\n' +
          '• Identify the correct center for vehicle operations\n' +
          '• Provide accurate location-based services\n\n' +
          'Your location data remains private and is not shared.',
        [
          {
            text: 'Deny',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow',
            style: 'default',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  };

  // Load location data if permission was already granted
  const loadLocationIfGranted = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        return {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy || undefined,
          timestamp: loc.timestamp,
        };
      } catch (error) {
        logger.error('Error loading location:', error instanceof Error ? error.message : String(error));
        return null;
      }
    }
    return null;
  };

  return {
    foregroundPermission,
    isChecking,
    requestForegroundPermission,
    showPermissionRationale,
    checkForegroundPermission,
    loadLocationIfGranted,
  };
};






