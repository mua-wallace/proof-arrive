/**
 * Geozone Storage Service
 * Handles storing and retrieving geozones from SQLite database
 */

import type { ParsedZone } from '@/types/geozone';
import { logger } from '@/utils/logger';

import { initDatabase } from './storage';

/**
 * Initialize geozones table
 */
export async function initGeozonesTable() {
  try {
    const db = await initDatabase();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS geozones (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        speedLimit REAL DEFAULT 0,
        minLat REAL NOT NULL,
        maxLat REAL NOT NULL,
        minLng REAL NOT NULL,
        maxLng REAL NOT NULL,
        path TEXT NOT NULL,
        centerId TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
    logger.log('✅ Geozones table initialized');
  } catch (error) {
    logger.error('Error initializing geozones table:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Save zones to database (replaces all existing zones)
 */
export async function saveZones(zones: ParsedZone[]): Promise<void> {
  try {
    const db = await initDatabase();
    const now = Date.now();

    logger.log(`💾 Starting to save ${zones.length} zones to database...`);

    // Use transaction for better performance
    await db.withTransactionAsync(async () => {
      // Clear existing zones
      const deleteResult = await db.execAsync('DELETE FROM geozones');
      logger.log('🗑️  Cleared existing zones from database');

      // Insert new zones
      let savedCount = 0;
      for (const zone of zones) {
        await db.runAsync(
          `INSERT INTO geozones (
            id, name, color, speedLimit, minLat, maxLat, minLng, maxLng, path, centerId, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            zone.id,
            zone.name,
            zone.color,
            zone.speedLimit,
            zone.minLat,
            zone.maxLat,
            zone.minLng,
            zone.maxLng,
            zone.path,
            zone.centerId || null,
            now,
            now,
          ]
        );
        
        savedCount++;
        logger.log(
          `  ✓ Saved zone [${savedCount}/${zones.length}]: ID=${zone.id}, Name="${zone.name}", ` +
          `CenterID=${zone.id} (zone ID = center ID), Bounds=[${zone.minLat},${zone.minLng}] to [${zone.maxLat},${zone.maxLng}]`
        );
      }
    });

    logger.log(`✅ Successfully saved ${zones.length} zones to database`);
    
    // Log summary (all zones have centerId since zone ID = center ID)
    logger.log(`📊 Summary: ${zones.length} zones saved (zone ID = center ID for all zones)`);
  } catch (error) {
    logger.error('Error saving zones:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get all zones from database
 */
export async function getAllZones(): Promise<ParsedZone[]> {
  try {
    const db = await initDatabase();
    const result = await db.getAllAsync<{
      id: number;
      name: string;
      color: string;
      speedLimit: number;
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
      path: string;
      centerId: string | null;
    }>('SELECT * FROM geozones ORDER BY id');

    // DEBUG: Log retrieved data from SQLite
    logger.log(`📖 [SQLite DEBUG] Retrieved ${result.length} geozones from database`);
    result.forEach((zone, index) => {
      logger.log(`  [${index + 1}/${result.length}] Zone ID: ${zone.id}`);
      logger.log(`    - Name: ${zone.name}`);
      logger.log(`    - Center ID: ${zone.centerId || 'N/A'}`);
      logger.log(`    - Bounds: [${zone.minLat},${zone.minLng}] to [${zone.maxLat},${zone.maxLng}]`);
      logger.log(`    - Full zone: ${JSON.stringify(zone, null, 2)}`);
    });

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      speedLimit: row.speedLimit,
      minLat: row.minLat,
      maxLat: row.maxLat,
      minLng: row.minLng,
      maxLng: row.maxLng,
      path: row.path,
      centerId: row.centerId || undefined,
    }));
  } catch (error) {
    logger.error('Error fetching zones from database:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Get zone by ID
 */
export async function getZoneById(id: number): Promise<ParsedZone | null> {
  try {
    const db = await initDatabase();
    const result = await db.getFirstAsync<{
      id: number;
      name: string;
      color: string;
      speedLimit: number;
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
      path: string;
      centerId: string | null;
    }>('SELECT * FROM geozones WHERE id = ?', [id]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      color: result.color,
      speedLimit: result.speedLimit,
      minLat: result.minLat,
      maxLat: result.maxLat,
      minLng: result.minLng,
      maxLng: result.maxLng,
      path: result.path,
      centerId: result.centerId || undefined,
    };
  } catch (error) {
    logger.error('Error fetching zone by ID:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Clear all zones from database
 */
export async function clearZones(): Promise<void> {
  try {
    const db = await initDatabase();
    await db.execAsync('DELETE FROM geozones');
    logger.log('✅ Cleared all zones from database');
  } catch (error) {
    logger.error('Error clearing zones:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get count of zones in database
 */
export async function getZoneCount(): Promise<number> {
  try {
    const db = await initDatabase();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM geozones');
    return result?.count || 0;
  } catch (error) {
    logger.error('Error getting zone count:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

