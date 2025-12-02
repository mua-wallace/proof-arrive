/**
 * Center Service
 * Main service for managing centers - fetching, storing, and retrieving
 */

import type { RawCenterData } from '@/types/center';
import { NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { fetchCenters } from './center-api';
import {
  initCentersTable,
  saveCenters,
  getAllCenters,
  getCenterByGzoneId,
} from './center-storage';

/**
 * Fetch centers from API and save to database
 */
export async function fetchAndSaveCenters(
  filtertype = 1,
  limit = 1000,
  regionid = -1
): Promise<RawCenterData[]> {
  try {
    // Ensure table exists
    await initCentersTable();

    // Fetch from API
    logger.log('📡 [DEBUG] Fetching centers from API...');
    logger.log(`  - Filter type: ${filtertype}`);
    logger.log(`  - Limit: ${limit}`);
    logger.log(`  - Region ID: ${regionid}`);
    const centers = await fetchCenters(filtertype, limit, regionid);

    if (!centers || centers.length === 0) {
      logger.warn('⚠️  [DEBUG] No centers returned from API');
      return [];
    }

    logger.log(`📥 [DEBUG] Received ${centers.length} centers from API`);
    logger.log(`  - First center sample: ${JSON.stringify(centers[0] || {})}`);
    if (centers.length > 1) {
      logger.log(`  - Last center sample: ${JSON.stringify(centers[centers.length - 1] || {})}`);
    }

    // Save to database
    logger.log('💾 [DEBUG] Saving centers to database...');
    await saveCenters(centers);

    logger.log(`✅ Successfully fetched and saved ${centers.length} centers`);
    return centers;
  } catch (error) {
    const errorMessage = parseErrorMessage(error);
    logger.error('❌ Error fetching and saving centers:', errorMessage);
    
    if (error instanceof NetworkError) {
      throw error;
    }
    
    throw new Error(`Failed to fetch and save centers: ${errorMessage}`);
  }
}

/**
 * Get all centers from database
 */
export async function getStoredCenters(): Promise<RawCenterData[]> {
  try {
    await initCentersTable();
    return await getAllCenters();
  } catch (error) {
    logger.error('Error getting stored centers:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Get center by geozone ID
 * This matches a zone (by its ID) with a center (by gzone_id)
 */
export async function getCenterByZoneId(zoneId: number): Promise<RawCenterData | null> {
  try {
    await initCentersTable();
    const center = await getCenterByGzoneId(zoneId);
    
    if (center) {
      logger.log(
        `✅ Found center for zone ID ${zoneId}: ${center.name} ` +
        `(Center ID: ${center.id}, Geozone: ${center.geozone}, Group: ${center.groupname})`
      );
    } else {
      logger.warn(`No center found for zone ID ${zoneId}`);
    }
    
    return center;
  } catch (error) {
    logger.error('Error getting center by zone ID:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Check if centers are already seeded in database
 */
export async function isCentersSeeded(): Promise<boolean> {
  try {
    await initCentersTable();
    const centers = await getStoredCenters();
    const isSeeded = centers.length > 0;
    if (isSeeded) {
      logger.log(`✅ Centers already seeded: ${centers.length} centers found in database`);
    } else {
      logger.log('📭 No centers found in database - needs seeding');
    }
    return isSeeded;
  } catch (error) {
    logger.error('Error checking if centers are seeded:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Initialize centers (fetch and store on first run or after login)
 * Skips if already seeded to avoid duplicates
 */
export async function initializeCenters(
  filtertype = 1,
  limit = 1000,
  regionid = -1
): Promise<boolean> {
  try {
    await initCentersTable();
    
    // Check if already seeded
    const alreadySeeded = await isCentersSeeded();
    if (alreadySeeded) {
      logger.log('⏭️  Centers already seeded - skipping fetch to avoid duplicates');
      return true;
    }
    
    // Fetch and save if not seeded
    const centers = await fetchAndSaveCenters(filtertype, limit, regionid);
    return centers.length > 0;
  } catch (error) {
    logger.error('Error initializing centers:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Clear all centers from database
 */
export async function clearCenters(): Promise<void> {
  try {
    const { clearCenters: clearCentersFromStorage } = await import('./center-storage');
    await clearCentersFromStorage();
    logger.log('✅ All centers cleared from database');
  } catch (error) {
    logger.error('Error clearing centers:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

