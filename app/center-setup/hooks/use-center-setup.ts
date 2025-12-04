/**
 * Custom hook for Center Setup business logic
 */

import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { getCurrentCenter, saveCurrentCenter } from '@/services/center-info';
import { getCenterByZoneId } from '@/services/center-service';
import { findZoneForLocation, getStoredZones } from '@/services/geozone-service';
import { getCurrentLocation } from '@/services/location';
import type { ParsedZone } from '@/types/geozone';
import { parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { useLocationPermissions } from '@/hooks/use-location-permissions';

import {
  INITIALIZATION_MIN_DISPLAY_TIME,
  SUCCESS_MESSAGE_DELAY,
  DEFAULT_CUSTOM_CENTER_ID,
  type SetupStep,
  TOAST_MESSAGES,
} from '../constants';

interface UseCenterSetupReturn {
  // State
  step: SetupStep;
  geozones: ParsedZone[];
  selectedGeozone: ParsedZone | null;
  showGeozoneModal: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  isChangingCenter: boolean;
  locationCheckFailed: boolean;
  showCustomCenter: boolean;
  customCenterName: string;
  customCenterId: string;

  // Actions
  setSelectedGeozone: (geozone: ParsedZone | null) => void;
  setShowGeozoneModal: (show: boolean) => void;
  setShowCustomCenter: (show: boolean) => void;
  setCustomCenterName: (name: string) => void;
  setCustomCenterId: (id: string) => void;
  handleRequestPermission: () => Promise<void>;
  handleSelectGeozone: (geozone: ParsedZone) => void;
  handleConfirmGeozone: () => Promise<void>;
  handleSaveCustomCenter: () => Promise<void>;
  loadGeozones: () => Promise<void>;
}

export function useCenterSetup(): UseCenterSetupReturn {
  const router = useRouter();
  const { requestForegroundPermission, checkForegroundPermission } = useLocationPermissions();

  const [step, setStep] = useState<SetupStep>('permission');
  const [geozones, setGeozones] = useState<ParsedZone[]>([]);
  const [selectedGeozone, setSelectedGeozone] = useState<ParsedZone | null>(null);
  const [showGeozoneModal, setShowGeozoneModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isChangingCenter, setIsChangingCenter] = useState(false);
  const [locationCheckFailed, setLocationCheckFailed] = useState(false);
  const [showCustomCenter, setShowCustomCenter] = useState(false);
  const [customCenterName, setCustomCenterName] = useState('');
  const [customCenterId, setCustomCenterId] = useState('');

  const checkExistingCenter = useCallback(async () => {
    try {
      const center = await getCurrentCenter();
      if (center) {
        logger.log(`Center already set: ${center.name} (ID: ${center.id})`);
        setIsChangingCenter(true);
        setStep('select-geozone');
      } else {
        logger.log('No center set, proceeding with setup');
        setIsChangingCenter(false);
      }
    } catch (error) {
      logger.error('Error checking existing center:', parseErrorMessage(error));
    }
  }, []);

  const loadGeozones = useCallback(async () => {
    try {
      const zones = await getStoredZones();
      if (zones.length > 0) {
        setGeozones(zones);
        logger.log(`Loaded ${zones.length} geozones for selection`);
      } else {
        logger.warn('No geozones found in database');
        Toast.show(TOAST_MESSAGES.NO_GEOZONES);
      }
    } catch (error) {
      logger.error('Error loading geozones:', parseErrorMessage(error));
      Toast.show(TOAST_MESSAGES.ERROR_LOADING_GEOZONES(parseErrorMessage(error)));
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      const startTime = Date.now();

      try {
        await Promise.all([loadGeozones(), checkExistingCenter()]);
      } catch (error) {
        logger.error('Error during initialization:', parseErrorMessage(error));
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, INITIALIZATION_MIN_DISPLAY_TIME - elapsed);
        setTimeout(() => {
          setIsInitializing(false);
        }, remaining);
      }
    };

    initialize();
  }, [loadGeozones, checkExistingCenter]);

  const checkLocationAndGeozone = useCallback(async () => {
    setStep('checking');
    setIsLoading(true);

    try {
      logger.log('Getting current location and checking geozone...');
      const location = await getCurrentLocation();
      logger.log(`Location obtained: (${location.latitude}, ${location.longitude})`);

      const matchResult = await findZoneForLocation(location);

      if (matchResult.found && matchResult.zone) {
        logger.log(`Found geozone: ${matchResult.zone.name} (ID: ${matchResult.zone.id})`);
        const center = await getCenterByZoneId(matchResult.zone.id);

        if (center) {
          logger.log(`Found center: ${center.name} (ID: ${center.id})`);
          await saveCenterAndComplete(center);
        } else {
          logger.warn('No center found for geozone, showing selection');
          setLocationCheckFailed(true);
          Toast.show(TOAST_MESSAGES.NO_CENTER_FOUND);
          setStep('select-geozone');
        }
      } else {
        logger.warn('Location does not match any geozone, showing selection');
        setLocationCheckFailed(true);
        Toast.show(TOAST_MESSAGES.LOCATION_NOT_IN_GEOZONE);
        setStep('select-geozone');
      }
    } catch (error) {
      logger.error('Error checking location:', parseErrorMessage(error));
      Toast.show(TOAST_MESSAGES.LOCATION_ERROR(parseErrorMessage(error)));
      setLocationCheckFailed(true);
      setStep('select-geozone');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCenterAndComplete = useCallback(
    async (center: any) => {
      setStep('saving');
      setIsLoading(true);

      try {
        await saveCurrentCenter(center);
        logger.log('Center saved successfully');

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show(TOAST_MESSAGES.CENTER_SAVED(center.name));

        await new Promise((resolve) => setTimeout(resolve, SUCCESS_MESSAGE_DELAY));
        router.replace('/(tabs)' as any);
      } catch (error) {
        logger.error('Error saving center:', parseErrorMessage(error));
        Toast.show(TOAST_MESSAGES.SAVE_ERROR(parseErrorMessage(error)));
        setIsLoading(false);
        setStep('select-geozone');
      }
    },
    [router]
  );

  const handleRequestPermission = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await checkForegroundPermission();
      const granted = await requestForegroundPermission();

      if (granted) {
        logger.log('Location permission granted');
        await checkLocationAndGeozone();
      } else {
        logger.warn('Location permission denied');
        setLocationCheckFailed(true);
        setStep('select-geozone');
      }
    } catch (error) {
      logger.error('Error requesting permission:', parseErrorMessage(error));
      Toast.show(TOAST_MESSAGES.PERMISSION_ERROR(parseErrorMessage(error)));
      setLocationCheckFailed(true);
      setStep('select-geozone');
    } finally {
      setIsLoading(false);
    }
  }, [checkForegroundPermission, requestForegroundPermission, checkLocationAndGeozone]);

  const handleSelectGeozone = useCallback((geozone: ParsedZone) => {
    setSelectedGeozone(geozone);
    setShowGeozoneModal(false);
    logger.log(`Selected geozone: ${geozone.name} (ID: ${geozone.id})`);
  }, []);

  const handleConfirmGeozone = useCallback(async () => {
    if (!selectedGeozone) {
      Toast.show(TOAST_MESSAGES.SELECTION_REQUIRED);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      logger.log('Checking center for selected geozone...');
      const center = await getCenterByZoneId(selectedGeozone.id);

      if (center) {
        logger.log(`Found center for selected geozone: ${center.name} (ID: ${center.id})`);
        await saveCenterAndComplete(center);
      } else {
        logger.error('No center found for selected geozone');
        Toast.show(TOAST_MESSAGES.CENTER_NOT_FOUND);
        setShowCustomCenter(true);
      }
    } catch (error) {
      logger.error('Error getting center from geozone:', parseErrorMessage(error));
      Toast.show(TOAST_MESSAGES.SAVE_ERROR(parseErrorMessage(error)));
    } finally {
      setIsLoading(false);
    }
  }, [selectedGeozone, saveCenterAndComplete]);

  const handleSaveCustomCenter = useCallback(async () => {
    if (!customCenterName.trim()) {
      Toast.show(TOAST_MESSAGES.CENTER_NAME_REQUIRED);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const customCenter = {
        id: customCenterId ? parseInt(customCenterId, 10) : DEFAULT_CUSTOM_CENTER_ID,
        name: customCenterName.trim(),
        fullname: customCenterName.trim(),
        geozone: 'Custom (Testing)',
        manager: undefined,
        gzone_id: 0,
        groupname: 'Testing',
      };

      logger.log(`Saving custom center: ${customCenter.name} (ID: ${customCenter.id})`);
      await saveCenterAndComplete(customCenter);
    } catch (error) {
      logger.error('Error saving custom center:', parseErrorMessage(error));
      Toast.show(TOAST_MESSAGES.SAVE_ERROR(parseErrorMessage(error)));
      setIsLoading(false);
    }
  }, [customCenterName, customCenterId, saveCenterAndComplete]);

  return {
    // State
    step,
    geozones,
    selectedGeozone,
    showGeozoneModal,
    isLoading,
    isInitializing,
    isChangingCenter,
    locationCheckFailed,
    showCustomCenter,
    customCenterName,
    customCenterId,

    // Actions
    setSelectedGeozone,
    setShowGeozoneModal,
    setShowCustomCenter,
    setCustomCenterName,
    setCustomCenterId,
    handleRequestPermission,
    handleSelectGeozone,
    handleConfirmGeozone,
    handleSaveCustomCenter,
    loadGeozones,
  };
}

