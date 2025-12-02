/**
 * Center Storage Service
 * Handles storing and retrieving centers from SQLite database
 */

import type { RawCenterData } from '@/types/center';
import { logger } from '@/utils/logger';

import { initDatabase } from './storage';

/**
 * Initialize centers table
 */
export async function initCentersTable() {
  try {
    const db = await initDatabase();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS centers (
        id INTEGER PRIMARY KEY,
        manager TEXT,
        geozone TEXT NOT NULL,
        name TEXT NOT NULL,
        fullname TEXT NOT NULL,
        gzone_id INTEGER NOT NULL,
        groupname TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
    logger.log('✅ Centers table initialized');
  } catch (error) {
    logger.error('Error initializing centers table:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Save centers to database (replaces all existing centers)
 */
export async function saveCenters(centers: RawCenterData[]): Promise<void> {
  try {
    const db = await initDatabase();
    const now = Date.now();

    logger.log(`💾 [DEBUG] Starting to save ${centers.length} centers to database...`);
    logger.log(`  - Timestamp: ${new Date(now).toISOString()}`);

    // Use transaction for better performance
    await db.withTransactionAsync(async () => {
      // Clear existing centers
      await db.execAsync('DELETE FROM centers');
      logger.log('🗑️  Cleared existing centers from database');

      // Insert new centers
      let savedCount = 0;
      for (const center of centers) {
        // DEBUG: Log full center data before saving
        logger.log(`📝 [DEBUG] Saving center [${savedCount + 1}/${centers.length}]:`);
        logger.log(`  - ID: ${center.id}`);
        logger.log(`  - Name: "${center.name}"`);
        logger.log(`  - Full Name: "${center.fullname}"`);
        logger.log(`  - Geozone: "${center.geozone}"`);
        logger.log(`  - Gzone ID: ${center.gzone_id}`);
        logger.log(`  - Group: "${center.groupname}"`);
        logger.log(`  - Manager: "${center.manager || 'N/A'}"`);
        logger.log(`  - Raw data: ${JSON.stringify(center)}`);
        
        await db.runAsync(
          `INSERT INTO centers (
            id, manager, geozone, name, fullname, gzone_id, groupname, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            center.id,
            center.manager || null,
            center.geozone || '',
            center.name || '',
            center.fullname || '',
            center.gzone_id || 0,
            center.groupname || '',
            now,
            now,
          ]
        );
        
        savedCount++;
        logger.log(
          `  ✓ Saved center [${savedCount}/${centers.length}]: ID=${center.id}, Name="${center.name}", ` +
          `FullName="${center.fullname}", Geozone="${center.geozone}", GzoneID=${center.gzone_id}, ` +
          `Group="${center.groupname}", Manager="${center.manager || 'N/A'}"`
        );
      }
    });

    logger.log(`✅ Successfully saved ${centers.length} centers to database`);
    
    // Log summary with debug details
    const centersWithManager = centers.filter(c => c.manager).length;
    logger.log(`📊 [DEBUG] Center save summary:`);
    logger.log(`  - Total centers: ${centers.length}`);
    logger.log(`  - Centers with manager: ${centersWithManager}`);
    logger.log(`  - Centers without manager: ${centers.length - centersWithManager}`);
    logger.log(`  - Unique geozones: ${new Set(centers.map(c => c.geozone)).size}`);
    logger.log(`  - Unique groups: ${new Set(centers.map(c => c.groupname)).size}`);
  } catch (error) {
    logger.error('Error saving centers:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get all centers from database
 */
export async function getAllCenters(): Promise<RawCenterData[]> {
  try {
    const db = await initDatabase();
    const result = await db.getAllAsync<{
      id: number;
      manager: string | null;
      geozone: string;
      name: string;
      fullname: string;
      gzone_id: number;
      groupname: string;
    }>('SELECT * FROM centers ORDER BY id');

    // DEBUG: Log retrieved data from SQLite
    logger.log(`📖 [SQLite DEBUG] Retrieved ${result.length} centers from database`);
    result.forEach((center, index) => {
      logger.log(`  [${index + 1}/${result.length}] Center ID: ${center.id}`);
      logger.log(`    - Name: ${center.name}`);
      logger.log(`    - Full Name: ${center.fullname}`);
      logger.log(`    - Geozone: ${center.geozone}`);
      logger.log(`    - Gzone ID: ${center.gzone_id}`);
      logger.log(`    - Group: ${center.groupname}`);
      logger.log(`    - Manager: ${center.manager || 'N/A'}`);
      logger.log(`    - Full center: ${JSON.stringify(center, null, 2)}`);
    });

    return result.map((row) => ({
      id: row.id,
      manager: row.manager || undefined,
      geozone: row.geozone,
      name: row.name,
      fullname: row.fullname,
      gzone_id: row.gzone_id,
      groupname: row.groupname,
    }));
  } catch (error) {
    logger.error('Error fetching centers from database:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Get center by ID
 */
export async function getCenterById(id: number): Promise<RawCenterData | null> {
  try {
    const db = await initDatabase();
    const result = await db.getFirstAsync<{
      id: number;
      manager: string | null;
      geozone: string;
      name: string;
      fullname: string;
      gzone_id: number;
      groupname: string;
    }>('SELECT * FROM centers WHERE id = ?', [id]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      manager: result.manager || undefined,
      geozone: result.geozone,
      name: result.name,
      fullname: result.fullname,
      gzone_id: result.gzone_id,
      groupname: result.groupname,
    };
  } catch (error) {
    logger.error('Error fetching center by ID:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Get center by gzone_id (geozone ID)
 * This is used to match a zone with its center
 */
export async function getCenterByGzoneId(gzoneId: number): Promise<RawCenterData | null> {
  try {
    const db = await initDatabase();
    const result = await db.getFirstAsync<{
      id: number;
      manager: string | null;
      geozone: string;
      name: string;
      fullname: string;
      gzone_id: number;
      groupname: string;
    }>('SELECT * FROM centers WHERE gzone_id = ?', [gzoneId]);

    if (!result) {
      return null;
    }

    logger.log(`✅ Found center for gzone_id ${gzoneId}: ${result.name} (ID: ${result.id})`);

    return {
      id: result.id,
      manager: result.manager || undefined,
      geozone: result.geozone,
      name: result.name,
      fullname: result.fullname,
      gzone_id: result.gzone_id,
      groupname: result.groupname,
    };
  } catch (error) {
    logger.error('Error fetching center by gzone_id:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Clear all centers from database
 */
export async function clearCenters(): Promise<void> {
  try {
    const db = await initDatabase();
    await db.execAsync('DELETE FROM centers');
    logger.log('✅ Cleared all centers from database');
  } catch (error) {
    logger.error('Error clearing centers:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get count of centers in database
 */
export async function getCenterCount(): Promise<number> {
  try {
    const db = await initDatabase();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM centers');
    return result?.count || 0;
  } catch (error) {
    logger.error('Error getting center count:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}






