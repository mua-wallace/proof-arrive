/**
 * Center Info Service
 * Manages the current center information for the logged-in user
 * Stores center info in local storage to avoid repeated API/location calls
 */

import type { RawCenterData } from '@/types/center';
import { logger } from '@/utils/logger';

import { Storage } from './storage-adapter';

// Storage key for current center info
const CURRENT_CENTER_KEY = 'proofarrive_current_center';

/**
 * Save current center information to storage
 */
export async function saveCurrentCenter(center: RawCenterData): Promise<void> {
  try {
    const centerData = JSON.stringify(center);
    await Storage.setItem({
      key: CURRENT_CENTER_KEY,
      value: centerData,
    });
    logger.log('💾 [CenterInfo] Saved current center to storage:');
    logger.log(`  - Name: ${center.name}`);
    logger.log(`  - Manager: ${center.manager || 'N/A'}`);
    logger.log(`  - Geozone: ${center.geozone}`);
    logger.log(`  - ID: ${center.id}`);
  } catch (error) {
    logger.error('❌ [CenterInfo] Error saving current center:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get current center information from storage
 */
export async function getCurrentCenter(): Promise<RawCenterData | null> {
  try {
    const data = await Storage.getItem({ key: CURRENT_CENTER_KEY });
    if (!data) {
      logger.log('📖 [CenterInfo] No current center found in storage');
      return null;
    }

    try {
      const center = JSON.parse(data) as RawCenterData;
      logger.log('📖 [CenterInfo] Retrieved current center from storage:');
      logger.log(`  - Name: ${center.name}`);
      logger.log(`  - Manager: ${center.manager || 'N/A'}`);
      logger.log(`  - Geozone: ${center.geozone}`);
      logger.log(`  - ID: ${center.id}`);
      return center;
    } catch (parseError) {
      logger.error('❌ [CenterInfo] Failed to parse stored center data:', parseError instanceof Error ? parseError.message : String(parseError));
      // Clear corrupted data
      try {
        await Storage.removeItem({ key: CURRENT_CENTER_KEY });
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  } catch (error) {
    logger.error('❌ [CenterInfo] Error retrieving current center:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Clear current center information from storage
 */
export async function clearCurrentCenter(): Promise<void> {
  try {
    await Storage.removeItem({ key: CURRENT_CENTER_KEY });
    logger.log('🧹 [CenterInfo] Cleared current center from storage');
  } catch (error) {
    logger.error('❌ [CenterInfo] Error clearing current center:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Update current center if it's different from stored center
 * This is useful when location changes and a new center is detected
 */
export async function updateCurrentCenterIfChanged(newCenter: RawCenterData): Promise<boolean> {
  try {
    const currentCenter = await getCurrentCenter();
    
    // If no center stored, or center ID changed, update it
    if (!currentCenter || currentCenter.id !== newCenter.id) {
      await saveCurrentCenter(newCenter);
      logger.log(`🔄 [CenterInfo] Center updated: ${currentCenter ? `${currentCenter.name} → ${newCenter.name}` : `New center: ${newCenter.name}`}`);
      return true;
    }
    
    logger.log('ℹ️  [CenterInfo] Center unchanged, no update needed');
    return false;
  } catch (error) {
    logger.error('❌ [CenterInfo] Error updating current center:', error instanceof Error ? error.message : String(error));
    return false;
  }
}


