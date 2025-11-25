import * as SQLite from 'expo-sqlite';

const DB_NAME = 'proofarrive.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);
  
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
      agentLatitude, agentLongitude, agentAccuracy, vehicleGPSDevice, synced, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
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
    synced: number;
    createdAt: number;
  }>('SELECT * FROM arrivals ORDER BY createdAt DESC');

  return result;
}

