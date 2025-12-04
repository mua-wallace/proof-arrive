/**
 * Constants for Center Setup Screen
 */

export const INITIALIZATION_MIN_DISPLAY_TIME = 800; // Minimum 800ms to ensure loader is visible
export const SUCCESS_MESSAGE_DELAY = 1000; // Delay before navigation after success
export const DEFAULT_CUSTOM_CENTER_ID = 9999; // Default ID for custom testing centers

export const SETUP_STEPS = {
  PERMISSION: 'permission',
  CHECKING: 'checking',
  SELECT_GEOZONE: 'select-geozone',
  CUSTOM_CENTER: 'custom-center',
  SAVING: 'saving',
  COMPLETE: 'complete',
} as const;

export type SetupStep = typeof SETUP_STEPS[keyof typeof SETUP_STEPS];

export const TOAST_MESSAGES = {
  NO_GEOZONES: {
    type: 'error' as const,
    text1: 'No Geozones Available',
    text2: 'Please ensure geozones are loaded. You may need to log in again.',
  },
  ERROR_LOADING_GEOZONES: (error: string) => ({
    type: 'error' as const,
    text1: 'Error Loading Geozones',
    text2: error,
  }),
  PERMISSION_ERROR: (error: string) => ({
    type: 'error' as const,
    text1: 'Permission Error',
    text2: error,
  }),
  LOCATION_ERROR: (error: string) => ({
    type: 'error' as const,
    text1: 'Location Error',
    text2: error,
  }),
  NO_CENTER_FOUND: {
    type: 'info' as const,
    text1: 'No Center Found',
    text2: 'Please select your geozone manually or enter a custom center.',
  },
  LOCATION_NOT_IN_GEOZONE: {
    type: 'info' as const,
    text1: 'Location Not in Geozone',
    text2: 'Please select your geozone manually or enter a custom center.',
  },
  SELECTION_REQUIRED: {
    type: 'error' as const,
    text1: 'Selection Required',
    text2: 'Please select a geozone.',
  },
  CENTER_NOT_FOUND: {
    type: 'error' as const,
    text1: 'Center Not Found',
    text2: 'No center found for the selected geozone. You can try another geozone or enter a custom center.',
  },
  CENTER_NAME_REQUIRED: {
    type: 'error' as const,
    text1: 'Center Name Required',
    text2: 'Please enter a center name.',
  },
  CENTER_SAVED: (centerName: string) => ({
    type: 'success' as const,
    text1: 'Center Set Successfully',
    text2: `Welcome to ${centerName}!`,
  }),
  SAVE_ERROR: (error: string) => ({
    type: 'error' as const,
    text1: 'Save Error',
    text2: error,
  }),
} as const;

