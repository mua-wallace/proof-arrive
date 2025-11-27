import * as SQLite from 'expo-sqlite';

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
    
    console.log('Migrating database schema...');
    
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
            console.log(`${column.name} column may already exist`);
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
        console.log('Error updating existing records:', e);
      }
    });
    
    migrationCompleted = true;
    console.log('Database migration completed');
  } catch (error) {
    console.error('Migration error:', error);
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
  
  await database.runAsync(
    `INSERT INTO arrivals (
      id, vehicleId, centerId, agentId, operationType, scanTimestamp,
      agentLatitude, agentLongitude, agentAccuracy, vehicleGPSDevice, 
      status, processingStartTime, synced, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_processing', ?, 0, ?)`,
    [
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
    ]
  );
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

  return result;
}

export async function markAsSynced(id: string) {
  const database = await initDatabase();
  
  await database.runAsync('UPDATE arrivals SET synced = 1 WHERE id = ?', [id]);
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
    [
      record.exitType,
      record.exitDestination || null,
      record.exitTime,
      record.exitAgentLatitude,
      record.exitAgentLongitude,
      record.exitAgentAccuracy || null,
      record.exitVehicleGPSDevice || null,
      record.id,
    ]
  );
}

