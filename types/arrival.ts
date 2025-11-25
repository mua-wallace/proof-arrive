export type OperationType = 'loading' | 'unloading';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface VehicleArrivalRecord {
  id: string;
  vehicleId: string;
  centerId: string;
  agentId?: string;
  operationType: OperationType;
  scanTimestamp: number;
  agentGPS: GPSPosition;
  vehicleGPSDevice?: string;
  synced: boolean;
  createdAt: number;
}

export interface QRCodeData {
  vehicleId: string;
  centerId?: string;
  vehicleGPSDevice?: string;
}

