export type OperationType = 'loading' | 'unloading';
export type VehicleStatus = 'arrived' | 'in_processing' | 'ready_to_exit' | 'exited';
export type ExitType = 'loaded' | 'unloaded';

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
  agentLatitude: number;
  agentLongitude: number;
  agentAccuracy?: number;
  vehicleGPSDevice?: string;
  status: VehicleStatus;
  processingStartTime?: number;
  processingEndTime?: number;
  exitType?: ExitType;
  exitDestination?: string;
  exitTime?: number;
  exitAgentLatitude?: number;
  exitAgentLongitude?: number;
  exitAgentAccuracy?: number;
  exitVehicleGPSDevice?: string;
  synced: boolean;
  createdAt: number;
}

export interface QRCodeData {
  vehicleId: string;
  centerId?: string;
  vehicleGPSDevice?: string;
}

