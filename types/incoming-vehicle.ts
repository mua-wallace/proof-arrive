/**
 * Incoming Vehicle types for ProofArrive
 * Types for vehicles coming to the agent's center
 */

/**
 * Raw incoming vehicle data from API
 */
export interface RawIncomingVehicleData {
  vehicleId: string;
  vehicleName?: string;
  vehiclePlate?: string;
  status: 'loaded' | 'unloaded';
  exitCenterId: number;
  exitCenterName?: string;
  exitTime: number; // Timestamp when vehicle left exit center
  destinationCenterId: number; // The center this vehicle is coming to
  destinationCenterName?: string;
  estimatedArrivalTime?: number; // Estimated arrival timestamp
  distance?: number; // Distance in km
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  [key: string]: any;
}

/**
 * Parsed incoming vehicle data for UI
 */
export interface IncomingVehicle {
  vehicleId: string;
  vehicleName: string;
  vehiclePlate?: string;
  status: 'loaded' | 'unloaded';
  exitCenterId: number;
  exitCenterName: string;
  exitTime: number;
  exitTimeFormatted: string;
  destinationCenterId: number;
  destinationCenterName: string;
  estimatedArrivalTime?: number;
  estimatedArrivalTimeFormatted?: string;
  distance?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}

/**
 * Incoming Vehicle API response structure
 */
export interface IncomingVehicleApiResponse {
  success: boolean;
  totalCount: number;
  rows: RawIncomingVehicleData[];
  [key: string]: any;
}

