/**
 * Location Service
 * Handles location permissions and getting current location
 */

import * as Location from 'expo-location';
import type { CurrentLocation } from '@/types/geozone';
import { GPSPosition } from '@/types/arrival';
import { logger } from '@/utils/logger';

import { getCenterIdFromLocation } from './geozone-service';

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    logger.error('Error requesting location permissions:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

export async function getCurrentLocation(): Promise<GPSPosition> {
  const hasPermission = await requestLocationPermissions();
  
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };
  } catch (error) {
    logger.error('Error getting current location:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get current location with zone matching
 * Returns location and center ID if found in a zone
 */
export async function getCurrentLocationWithZone(): Promise<{
  location: CurrentLocation;
  centerId: string | null;
}> {
  const hasPermission = await requestLocationPermissions();
  
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  try {
    logger.log('📍 Getting current device location...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const currentLocation: CurrentLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };

    logger.log(
      `📍 Device location obtained: (${currentLocation.latitude}, ${currentLocation.longitude}) ` +
      `Accuracy: ${currentLocation.accuracy ? `${currentLocation.accuracy}m` : 'N/A'}`
    );

    // Try to find center ID from zone
    const centerId = await getCenterIdFromLocation(currentLocation);

    if (centerId) {
      logger.log(`✅ Found geozone, Center ID: ${centerId}`);
    } else {
      logger.log(`❌ ${currentLocation.latitude}, ${currentLocation.longitude} not found in any geozone`);
    }

    return {
      location: currentLocation,
      centerId,
    };
  } catch (error) {
    logger.error('Error getting current location with zone:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

