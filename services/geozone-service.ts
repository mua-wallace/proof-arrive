/**
 * Geozone Service
 * Main service for managing geozones - fetching, storing, and matching
 */

import type { CurrentLocation, ParsedZone, ZoneMatchResult } from '@/types/geozone';
import type { RawCenterData } from '@/types/center';
import { NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { fetchZones } from './geozone-api';
import { initGeozonesTable, saveZones, getAllZones } from './geozone-storage';
import { getCenterByZoneId } from './center-service';
import { findZoneForLocation as matchZoneForLocation } from '../utils/zone-matcher';
import { parseZones } from '../utils/zone-parser';

/**
 * Fetch zones from API and save to database
 */
export async function fetchAndSaveZones(query = '%', page = 1, limit = 1000): Promise<ParsedZone[]> {
  try {
    // Ensure table exists
    await initGeozonesTable();

    // Fetch from API
    logger.log('📡 Fetching zones from API...');
    const rawZones = await fetchZones(query, page, limit);

    if (!rawZones || rawZones.length === 0) {
      logger.warn('No zones returned from API');
      return [];
    }

    // Parse zones
    logger.log('🔧 Parsing zones...');
    const parsedZones = parseZones(rawZones);

    if (parsedZones.length === 0) {
      logger.warn('No valid zones after parsing');
      return [];
    }

    // Save to database
    logger.log('💾 Saving zones to database...');
    await saveZones(parsedZones);

    logger.log(`✅ Successfully fetched and saved ${parsedZones.length} zones`);
    return parsedZones;
  } catch (error) {
    const errorMessage = parseErrorMessage(error);
    logger.error('❌ Error fetching and saving zones:', errorMessage);
    
    if (error instanceof NetworkError) {
      throw error;
    }
    
    throw new Error(`Failed to fetch and save zones: ${errorMessage}`);
  }
}

/**
 * Get all zones from database
 */
export async function getStoredZones(): Promise<ParsedZone[]> {
  try {
    await initGeozonesTable();
    return await getAllZones();
  } catch (error) {
    logger.error('Error getting stored zones:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Find zone for a given location
 */
export async function findZoneForLocation(
  location: CurrentLocation
): Promise<ZoneMatchResult> {
  try {
    logger.log(`🔍 Checking if device is in a zone for location (${location.latitude}, ${location.longitude})...`);
    
    const zones = await getStoredZones();
    
    if (zones.length === 0) {
      logger.warn('❌ No zones available in database - cannot determine zone status');
      return {
        zone: null,
        location,
        found: false,
      };
    }

    logger.log(`📊 Checking against ${zones.length} stored zones...`);
    const zone = matchZoneForLocation(location.latitude, location.longitude, zones);
    
    if (zone) {
      logger.log(
        `✅ Found geozone: Zone ID=${zone.id}, Name="${zone.name}" ` +
        `for location (${location.latitude}, ${location.longitude})`
      );
    } else {
      logger.log(
        `❌ ${location.latitude}, ${location.longitude} not found in any geozone`
      );
    }
    
    return {
      zone,
      location,
      found: !!zone,
    };
  } catch (error) {
    logger.error('Error finding zone for location:', error instanceof Error ? error.message : String(error));
    logger.log(`❌ DEVICE ZONE STATUS: UNKNOWN (error occurred)`);
    return {
      zone: null,
      location,
      found: false,
    };
  }
}

/**
 * Get center ID from zone
 * This will be used to determine which center the agent is in
 * Matches zone ID with center's gzone_id
 */
export async function getCenterIdFromLocation(location: CurrentLocation): Promise<string | null> {
  try {
    const matchResult = await findZoneForLocation(location);
    
    if (matchResult.found && matchResult.zone) {
      // Match zone ID with center's gzone_id
      const center = await getCenterByZoneId(matchResult.zone.id);
      
      if (center) {
        const centerId = center.id.toString();
        logger.log(
          `✅ Found center ID: ${centerId} (Center: ${center.name}, ` +
          `Zone ID: ${matchResult.zone.id}, Gzone ID: ${center.gzone_id}) ` +
          `for location (${location.latitude}, ${location.longitude})`
        );
        return centerId;
      } else {
        logger.warn(
          `Zone found (ID: ${matchResult.zone.id}) but no matching center found ` +
          `for location (${location.latitude}, ${location.longitude})`
        );
      }
    }

    logger.warn(`No center ID found for location (${location.latitude}, ${location.longitude})`);
    return null;
  } catch (error) {
    logger.error('Error getting center ID from location:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Get full center information from location
 * Returns the complete center data including manager, geozone, name, etc.
 */
export async function getCenterFromLocation(location: CurrentLocation): Promise<RawCenterData | null> {
  try {
    const matchResult = await findZoneForLocation(location);
    
    if (matchResult.found && matchResult.zone) {
      // Match zone ID with center's gzone_id
      const center = await getCenterByZoneId(matchResult.zone.id);
      
      if (center) {
        logger.log(
          `✅ Found center: ${center.name} (ID: ${center.id}, ` +
          `Geozone: ${center.geozone}, Group: ${center.groupname}) ` +
          `for location (${location.latitude}, ${location.longitude})`
        );
        
        // Save center info for reuse (no need to call API again)
        try {
          const { updateCurrentCenterIfChanged } = await import('./center-info');
          await updateCurrentCenterIfChanged(center);
        } catch (saveError) {
          // Log but don't fail - saving center info is optional
          logger.warn('Failed to save center info:', saveError instanceof Error ? saveError.message : String(saveError));
        }
        
        return center;
      } else {
        logger.warn(
          `Zone found (ID: ${matchResult.zone.id}) but no matching center found ` +
          `for location (${location.latitude}, ${location.longitude})`
        );
      }
    }

    logger.warn(`No center found for location (${location.latitude}, ${location.longitude})`);
    return null;
  } catch (error) {
    logger.error('Error getting center from location:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Check if geozones are already seeded in database
 */
export async function isGeozonesSeeded(): Promise<boolean> {
  try {
    await initGeozonesTable();
    const zones = await getStoredZones();
    const isSeeded = zones.length > 0;
    if (isSeeded) {
      logger.log(`✅ Geozones already seeded: ${zones.length} zones found in database`);
    } else {
      logger.log('📭 No geozones found in database - needs seeding');
    }
    return isSeeded;
  } catch (error) {
    logger.error('Error checking if geozones are seeded:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Initialize geozones (fetch and store on first run or after login)
 * Skips if already seeded to avoid duplicates
 */
export async function initializeGeozones(): Promise<boolean> {
  try {
    await initGeozonesTable();
    
    // Check if already seeded
    const alreadySeeded = await isGeozonesSeeded();
    if (alreadySeeded) {
      logger.log('⏭️  Geozones already seeded - skipping fetch to avoid duplicates');
      return true;
    }
    
    // Fetch and save if not seeded
    const zones = await fetchAndSaveZones();
    return zones.length > 0;
  } catch (error) {
    logger.error('Error initializing geozones:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Clear all geozones from database
 */
export async function clearGeozones(): Promise<void> {
  try {
    const { clearZones } = await import('./geozone-storage');
    await clearZones();
    logger.log('✅ All geozones cleared from database');
  } catch (error) {
    logger.error('Error clearing geozones:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

