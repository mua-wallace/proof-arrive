/**
 * Data Cleanup Service
 * Handles clearing all user-specific data on logout
 */

import { logger } from '@/utils/logger';
import { parseErrorMessage } from '@/utils/error-handler';

import { clearGeozones } from './geozone-service';
import { clearCenters } from './center-service';

/**
 * Clear all user-specific data (geozones and centers)
 * Called on logout to ensure clean state for next user
 */
export async function clearAllUserData(): Promise<void> {
  try {
    logger.log('🧹 Clearing all user-specific data (geozones and centers)...');
    
    // Clear geozones
    try {
      await clearGeozones();
    } catch (geozoneError) {
      logger.error('Error clearing geozones:', parseErrorMessage(geozoneError));
      // Continue with centers even if geozones fail
    }
    
    // Clear centers
    try {
      await clearCenters();
    } catch (centerError) {
      logger.error('Error clearing centers:', parseErrorMessage(centerError));
      // Continue even if centers fail
    }
    
    logger.log('✅ All user-specific data cleared successfully');
  } catch (error) {
    logger.error('Error clearing user data:', parseErrorMessage(error));
    // Don't throw - cleanup should be best effort
  }
}







