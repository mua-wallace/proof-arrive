/**
 * Center Verification Service
 * Checks if user's current location matches their setup center
 * This is done silently in the background before allowing actions
 */

import type { RawCenterData } from '@/types/center';
import { logger } from '@/utils/logger';
import { parseErrorMessage } from '@/utils/error-handler';

import { getCurrentCenter } from './center-info';
import { getCenterFromLocation } from './geozone-service';
import { getCurrentLocation } from './location';

export interface CenterVerificationResult {
  isInCenter: boolean;
  setupCenter: RawCenterData | null;
  currentCenter: RawCenterData | null;
  error?: string;
}

/**
 * Verify if user is currently in their setup center
 * This check is done silently in the background
 * Returns true if user is in their setup center, false otherwise
 */
export async function verifyUserInCenter(): Promise<CenterVerificationResult> {
  try {
    // Get the setup center (stored center)
    const setupCenter = await getCurrentCenter();
    
    if (!setupCenter) {
      logger.warn('⚠️  [CenterVerification] No setup center found');
      return {
        isInCenter: false,
        setupCenter: null,
        currentCenter: null,
        error: 'No center has been set up. Please set up your center first.',
      };
    }

    logger.log(`🔍 [CenterVerification] Checking if user is in setup center: ${setupCenter.name} (ID: ${setupCenter.id})`);

    // Get current location
    try {
      const location = await getCurrentLocation();
      
      // Get center from current location
      const currentCenter = await getCenterFromLocation(location);

      if (!currentCenter) {
        logger.warn('⚠️  [CenterVerification] Current location does not match any center');
        return {
          isInCenter: false,
          setupCenter,
          currentCenter: null,
          error: 'Your current location does not match any center.',
        };
      }

      // Compare center IDs
      const isInCenter = currentCenter.id === setupCenter.id;

      if (isInCenter) {
        logger.log(`✅ [CenterVerification] User is in setup center: ${setupCenter.name}`);
      } else {
        logger.warn(
          `⚠️  [CenterVerification] User is NOT in setup center. ` +
          `Setup: ${setupCenter.name} (ID: ${setupCenter.id}), ` +
          `Current: ${currentCenter.name} (ID: ${currentCenter.id})`
        );
      }

      return {
        isInCenter,
        setupCenter,
        currentCenter,
      };
    } catch (locationError) {
      logger.error('❌ [CenterVerification] Error getting location:', parseErrorMessage(locationError));
      
      // If location permission is denied or error, we can't verify
      // For now, we'll allow the action but log the warning
      // In production, you might want to be more strict
      return {
        isInCenter: false,
        setupCenter,
        currentCenter: null,
        error: parseErrorMessage(locationError),
      };
    }
  } catch (error) {
    logger.error('❌ [CenterVerification] Error verifying center:', parseErrorMessage(error));
    return {
      isInCenter: false,
      setupCenter: null,
      currentCenter: null,
      error: parseErrorMessage(error),
    };
  }
}

/**
 * Check if user is in their setup center before allowing an action
 * This is a convenience wrapper that throws an error if not in center
 */
export async function requireUserInCenter(): Promise<void> {
  const result = await verifyUserInCenter();
  
  if (!result.isInCenter) {
    if (result.setupCenter && result.currentCenter) {
      throw new Error(
        `You are currently at ${result.currentCenter.name}, but your setup center is ${result.setupCenter.name}. ` +
        `Please change your center to perform this action.`
      );
    } else if (result.setupCenter) {
      throw new Error(
        `Your current location does not match your setup center (${result.setupCenter.name}). ` +
        `Please change your center to perform this action.`
      );
    } else {
      throw new Error(
        result.error || 'No center has been set up. Please set up your center first.'
      );
    }
  }
}



