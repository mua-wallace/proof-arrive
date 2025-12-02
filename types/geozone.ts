/**
 * Geozone types for ProofArrive
 * Types for geographic zones, coordinates, and zone-related data structures
 */

/**
 * Coordinate pair [latitude, longitude]
 */
export type CoordinatePair = [number, number];

/**
 * Polygon represented as array of coordinate pairs
 */
export type Polygon = CoordinatePair[];

/**
 * Raw zone data from API before parsing
 */
export interface RawZoneData {
  i?: number | string; // id
  n?: string; // name
  c?: string; // color
  l?: number | string; // speed limit (not used in ProofArrive, but kept for compatibility)
  s?: string; // path string (format: "lat:lng!lat:lng!...")
  [key: string]: any;
}

/**
 * Parsed zone data structure
 * Represents a geographic zone with polygon boundaries
 */
export interface ParsedZone {
  id: number;
  name: string;
  color: string;
  speedLimit: number; // Kept for compatibility, may not be used
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  path: string; // JSON string of CoordinatePair[]
  centerId?: string; // Center ID (always set to zone.id.toString() - zone ID is the center ID)
}

/**
 * Zone API response structure
 */
export interface ZoneApiResponse {
  rows?: RawZoneData[];
  success?: boolean;
  [key: string]: any;
}

/**
 * Location permission status interface
 */
export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  canAskAgain: boolean;
}

/**
 * Current location data
 */
export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Zone match result
 */
export interface ZoneMatchResult {
  zone: ParsedZone | null;
  location: CurrentLocation;
  found: boolean;
}

