/**
 * Zone Matcher Utilities
 * Determines if a point is within a zone polygon
 */

import type { CoordinatePair, ParsedZone } from '@/types/geozone';
import { logger } from '@/utils/logger';

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(lat: number, lng: number, polygon: CoordinatePair[]): boolean {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi + 0.0000001) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Find which zone contains the given location
 */
export function findZoneForLocation(
  lat: number,
  lng: number,
  zones: ParsedZone[]
): ParsedZone | null {
  if (!zones || zones.length === 0) {
    logger.warn('No zones provided for location matching');
    return null;
  }

  // First, filter zones by bounding box (quick check)
  const candidates = zones.filter(
    (z) =>
      lat >= z.minLat &&
      lat <= z.maxLat &&
      lng >= z.minLng &&
      lng <= z.maxLng
  );

  if (candidates.length === 0) {
    logger.log(`❌ ${lat}, ${lng} not found in any geozone`);
    return null;
  }

  logger.log(`🔍 Checking ${candidates.length} candidate zone(s) for point (${lat}, ${lng})...`);

  // Then check each candidate with polygon intersection
  for (const zone of candidates) {
    try {
      const polygon = JSON.parse(zone.path) as CoordinatePair[];
      if (isPointInPolygon(lat, lng, polygon)) {
        logger.log(`✅ Found geozone: ${zone.name} (ID: ${zone.id}) for location (${lat}, ${lng})`);
        return zone;
      } else {
        logger.log(`  ⚪ Point not in zone: ${zone.name} (ID: ${zone.id})`);
      }
    } catch (error) {
      logger.error(`Error parsing zone path for ${zone.name}:`, error instanceof Error ? error.message : String(error));
      // Continue with next zone
    }
  }

  logger.log(`❌ ${lat}, ${lng} not found in any geozone`);
  return null;
}


