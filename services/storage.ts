import * as SQLite from 'expo-sqlite';

import { logger } from '@/utils/logger';

const DB_NAME = 'proofarrive.db';

let db: SQLite.SQLiteDatabase | null = null;

async function columnExists(database: SQLite.SQLiteDatabase, columnName: string): Promise<boolean> {
  try {
    const result = await database.getFirstAsync<{ sql: string }>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='arrivals'"
    );
    if (result && result.sql) {
      return result.sql.toLowerCase().includes(columnName.toLowerCase());
    }
    return false;
  } catch {
    return false;
  }
}

let migrationInProgress = false;
let migrationCompleted = false;

async function runMigration(database: SQLite.SQLiteDatabase): Promise<void> {
  if (migrationCompleted || migrationInProgress) return;
  
  migrationInProgress = true;
  
  try {
    const needsMigration = !(await columnExists(database, 'status'));
    
    if (!needsMigration) {
      migrationCompleted = true;
      migrationInProgress = false;
      return;
    }
    
    logger.log('Migrating database schema...');
    
    // Batch all ALTER TABLE statements in a single transaction for better performance
    await database.withTransactionAsync(async () => {
      const columnsToAdd = [
        { name: 'status', type: 'TEXT DEFAULT \'arrived\'' },
        { name: 'processingStartTime', type: 'INTEGER' },
        { name: 'processingEndTime', type: 'INTEGER' },
        { name: 'exitType', type: 'TEXT' },
        { name: 'exitDestination', type: 'TEXT' },
        { name: 'exitTime', type: 'INTEGER' },
        { name: 'exitAgentLatitude', type: 'REAL' },
        { name: 'exitAgentLongitude', type: 'REAL' },
        { name: 'exitAgentAccuracy', type: 'REAL' },
        { name: 'exitVehicleGPSDevice', type: 'TEXT' },
      ];
      
      for (const column of columnsToAdd) {
        try {
          await database.execAsync(
            `ALTER TABLE arrivals ADD COLUMN ${column.name} ${column.type};`
          );
        } catch (e: any) {
          // Column may already exist, ignore error
          if (!e?.message?.includes('duplicate column')) {
            logger.log(`${column.name} column may already exist`);
          }
        }
      }
      
      // Update existing records in a single statement
      try {
        await database.execAsync(`
          UPDATE arrivals 
          SET status = 'arrived', 
              processingStartTime = scanTimestamp 
          WHERE status IS NULL OR status = '';
        `);
      } catch (e) {
        logger.error('Error updating existing records:', e instanceof Error ? e.message : String(e));
      }
    });
    
    migrationCompleted = true;
    logger.log('Database migration completed');
  } catch (error) {
    logger.error('Migration error:', error instanceof Error ? error.message : String(error));
  } finally {
    migrationInProgress = false;
  }
}

export async function initDatabase() {
  if (db && migrationCompleted) return db;

  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  
  // Create table if it doesn't exist (with old schema first)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS arrivals (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      centerId TEXT NOT NULL,
      agentId TEXT,
      operationType TEXT NOT NULL,
      scanTimestamp INTEGER NOT NULL,
      agentLatitude REAL NOT NULL,
      agentLongitude REAL NOT NULL,
      agentAccuracy REAL,
      vehicleGPSDevice TEXT,
      synced INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL
    );
  `);
  
  // Run migration if needed (only once)
  if (!migrationCompleted) {
    await runMigration(db);
  }

  return db;
}

export async function saveArrival(record: {
  id: string;
  vehicleId: string;
  centerId: string;
  agentId?: string;
  operationType: string;
  scanTimestamp: number;
  agentLatitude: number;
  agentLongitude: number;
  agentAccuracy?: number;
  vehicleGPSDevice?: string;
}) {
  const database = await initDatabase();
  
  const values = [
    record.id,
    record.vehicleId,
    record.centerId,
    record.agentId || null,
    record.operationType,
    record.scanTimestamp,
    record.agentLatitude,
    record.agentLongitude,
    record.agentAccuracy || null,
    record.vehicleGPSDevice || null,
    record.scanTimestamp, // processingStartTime = scanTimestamp (arrival time)
    Date.now(),
  ];
  
  // DEBUG: Log data being saved to SQLite
  logger.log('💾 [SQLite DEBUG] Saving arrival to database:');
  logger.log(`  - ID: ${record.id}`);
  logger.log(`  - Vehicle ID: ${record.vehicleId}`);
  logger.log(`  - Center ID: ${record.centerId}`);
  logger.log(`  - Agent ID: ${record.agentId || 'N/A'}`);
  logger.log(`  - Operation Type: ${record.operationType}`);
  logger.log(`  - Scan Timestamp: ${record.scanTimestamp} (${new Date(record.scanTimestamp).toISOString()})`);
  logger.log(`  - Location: [${record.agentLatitude}, ${record.agentLongitude}]`);
  logger.log(`  - Accuracy: ${record.agentAccuracy || 'N/A'}m`);
  logger.log(`  - Vehicle GPS Device: ${record.vehicleGPSDevice || 'N/A'}`);
  logger.log(`  - Status: in_processing`);
  logger.log(`  - Created At: ${Date.now()} (${new Date().toISOString()})`);
  logger.log(`  - Full record: ${JSON.stringify(record, null, 2)}`);
  
  await database.runAsync(
    `INSERT INTO arrivals (
      id, vehicleId, centerId, agentId, operationType, scanTimestamp,
      agentLatitude, agentLongitude, agentAccuracy, vehicleGPSDevice, 
      status, processingStartTime, synced, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_processing', ?, 0, ?)`,
    values
  );
  
  logger.log('✅ [SQLite DEBUG] Arrival saved successfully to database');
}

export async function getUnsyncedArrivals() {
  const database = await initDatabase();
  
  const result = await database.getAllAsync<{
    id: string;
    vehicleId: string;
    centerId: string;
    agentId: string | null;
    operationType: string;
    scanTimestamp: number;
    agentLatitude: number;
    agentLongitude: number;
    agentAccuracy: number | null;
    vehicleGPSDevice: string | null;
    status: string;
    processingStartTime: number | null;
    processingEndTime: number | null;
    exitType: string | null;
    exitDestination: string | null;
    exitTime: number | null;
    exitAgentLatitude: number | null;
    exitAgentLongitude: number | null;
    exitAgentAccuracy: number | null;
    exitVehicleGPSDevice: string | null;
    synced: number;
    createdAt: number;
  }>('SELECT * FROM arrivals WHERE synced = 0 ORDER BY createdAt ASC');

  // DEBUG: Log retrieved data from SQLite
  logger.log(`📖 [SQLite DEBUG] Retrieved ${result.length} unsynced arrivals from database`);
  result.forEach((arrival, index) => {
    logger.log(`  [${index + 1}/${result.length}] Arrival ID: ${arrival.id}`);
    logger.log(`    - Vehicle ID: ${arrival.vehicleId}`);
    logger.log(`    - Center ID: ${arrival.centerId}`);
    logger.log(`    - Status: ${arrival.status}`);
    logger.log(`    - Scan Time: ${new Date(arrival.scanTimestamp).toISOString()}`);
    logger.log(`    - Full record: ${JSON.stringify(arrival, null, 2)}`);
  });

  return result;
}

export async function markAsSynced(id: string) {
  const database = await initDatabase();
  
  logger.log(`💾 [SQLite DEBUG] Marking arrival as synced: ${id}`);
  await database.runAsync('UPDATE arrivals SET synced = 1 WHERE id = ?', [id]);
  logger.log(`✅ [SQLite DEBUG] Arrival ${id} marked as synced`);
}

export async function getAllArrivals() {
  const database = await initDatabase();
  
  const result = await database.getAllAsync<{
    id: string;
    vehicleId: string;
    centerId: string;
    agentId: string | null;
    operationType: string;
    scanTimestamp: number;
    agentLatitude: number;
    agentLongitude: number;
    agentAccuracy: number | null;
    vehicleGPSDevice: string | null;
    status: string;
    processingStartTime: number | null;
    processingEndTime: number | null;
    exitType: string | null;
    exitDestination: string | null;
    exitTime: number | null;
    exitAgentLatitude: number | null;
    exitAgentLongitude: number | null;
    exitAgentAccuracy: number | null;
    exitVehicleGPSDevice: string | null;
    synced: number;
    createdAt: number;
  }>('SELECT * FROM arrivals ORDER BY createdAt DESC');

  // DEBUG: Log retrieved data from SQLite
  logger.log(`📖 [SQLite DEBUG] Retrieved ${result.length} total arrivals from database`);
  const syncedCount = result.filter(a => a.synced === 1).length;
  const unsyncedCount = result.filter(a => a.synced === 0).length;
  logger.log(`  - Synced: ${syncedCount}`);
  logger.log(`  - Unsynced: ${unsyncedCount}`);
  if (result.length > 0) {
    logger.log(`  - First arrival: ${JSON.stringify(result[0], null, 2)}`);
    if (result.length > 1) {
      logger.log(`  - Last arrival: ${JSON.stringify(result[result.length - 1], null, 2)}`);
    }
  }

  return result;
}

export async function getArrivalById(id: string) {
  const database = await initDatabase();
  
  const result = await database.getFirstAsync<{
    id: string;
    vehicleId: string;
    centerId: string;
    agentId: string | null;
    operationType: string;
    scanTimestamp: number;
    agentLatitude: number;
    agentLongitude: number;
    agentAccuracy: number | null;
    vehicleGPSDevice: string | null;
    status: string;
    processingStartTime: number | null;
    processingEndTime: number | null;
    exitType: string | null;
    exitDestination: string | null;
    exitTime: number | null;
    exitAgentLatitude: number | null;
    exitAgentLongitude: number | null;
    exitAgentAccuracy: number | null;
    exitVehicleGPSDevice: string | null;
    synced: number;
    createdAt: number;
  }>('SELECT * FROM arrivals WHERE id = ?', [id]);

  return result;
}

export async function updateArrivalStatus(
  id: string,
  status: string,
  processingEndTime?: number
) {
  const database = await initDatabase();
  
  logger.log(`💾 [SQLite DEBUG] Updating arrival status:`);
  logger.log(`  - ID: ${id}`);
  logger.log(`  - New Status: ${status}`);
  logger.log(`  - Processing End Time: ${processingEndTime ? `${processingEndTime} (${new Date(processingEndTime).toISOString()})` : 'N/A'}`);
  
  if (processingEndTime !== undefined) {
    await database.runAsync(
      'UPDATE arrivals SET status = ?, processingEndTime = ? WHERE id = ?',
      [status, processingEndTime, id]
    );
  } else {
    await database.runAsync(
      'UPDATE arrivals SET status = ? WHERE id = ?',
      [status, id]
    );
  }
  
  logger.log(`✅ [SQLite DEBUG] Arrival ${id} status updated to ${status}`);
}

export async function saveExit(record: {
  id: string;
  exitType: string;
  exitDestination?: string;
  exitTime: number;
  exitAgentLatitude: number;
  exitAgentLongitude: number;
  exitAgentAccuracy?: number;
  exitVehicleGPSDevice?: string;
}) {
  const database = await initDatabase();
  
  const values = [
    record.exitType,
    record.exitDestination || null,
    record.exitTime,
    record.exitAgentLatitude,
    record.exitAgentLongitude,
    record.exitAgentAccuracy || null,
    record.exitVehicleGPSDevice || null,
    record.id,
  ];
  
  // DEBUG: Log exit data being saved to SQLite
  logger.log('💾 [SQLite DEBUG] Saving exit data to database:');
  logger.log(`  - Arrival ID: ${record.id}`);
  logger.log(`  - Exit Type: ${record.exitType}`);
  logger.log(`  - Exit Destination: ${record.exitDestination || 'N/A'}`);
  logger.log(`  - Exit Time: ${record.exitTime} (${new Date(record.exitTime).toISOString()})`);
  logger.log(`  - Exit Location: [${record.exitAgentLatitude}, ${record.exitAgentLongitude}]`);
  logger.log(`  - Exit Accuracy: ${record.exitAgentAccuracy || 'N/A'}m`);
  logger.log(`  - Exit Vehicle GPS Device: ${record.exitVehicleGPSDevice || 'N/A'}`);
  logger.log(`  - Full exit record: ${JSON.stringify(record, null, 2)}`);
  
  await database.runAsync(
    `UPDATE arrivals SET 
      status = 'exited',
      exitType = ?,
      exitDestination = ?,
      exitTime = ?,
      exitAgentLatitude = ?,
      exitAgentLongitude = ?,
      exitAgentAccuracy = ?,
      exitVehicleGPSDevice = ?
    WHERE id = ?`,
    values
  );
  
  logger.log(`✅ [SQLite DEBUG] Exit data saved for arrival ${record.id}`);
}

