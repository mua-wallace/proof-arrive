/**
 * Zone Parser Utilities
 * Parses raw zone data from API into structured format
 */

import type { CoordinatePair, ParsedZone, RawZoneData } from '@/types/geozone';
import { logger } from '@/utils/logger';

/**
 * Parse path string into coordinate pairs
 * Format: "lat:lng!lat:lng!..."
 */
function parsePath(s: string): CoordinatePair[] {
  if (!s || typeof s !== 'string') {
    return [];
  }

  return s
    .split('!')
    .map((pair) => {
      const parts = pair.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]] as CoordinatePair;
      }
      return undefined;
    })
    .filter((item): item is CoordinatePair => Array.isArray(item));
}

/**
 * Calculate bounding box for coordinates
 */
function getBounds(coords: CoordinatePair[]) {
  if (!coords || coords.length === 0) {
    return {
      minLat: 0,
      maxLat: 0,
      minLng: 0,
      maxLng: 0,
    };
  }

  const lats = coords.map(([lat]) => lat);
  const lngs = coords.map(([, lng]) => lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * Parse raw zones from API into structured format
 */
export function parseZones(rawZones: RawZoneData[]): ParsedZone[] {
  if (!Array.isArray(rawZones)) {
    logger.warn('parseZones: Invalid input, expected array');
    return [];
  }

  let autoId = 1;
  const parsed: ParsedZone[] = [];

  for (const zone of rawZones) {
    try {
      const coords = parsePath(zone.s ?? '');
      
      if (coords.length === 0) {
        logger.warn(`Skipping zone with no valid coordinates: ${zone.n || 'unnamed'}`);
        continue;
      }

      const bounds = getBounds(coords);

      // Use zone.i if present and valid, otherwise assign incremental id
      let id = Number(zone.i);
      if (!id || isNaN(id)) {
        id = autoId++;
      }

      parsed.push({
        id,
        name: String(zone.n ?? `Zone ${id}`),
        color: String(zone.c ?? '#1d4ed8'),
        speedLimit: Number(zone.l ?? 0),
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng,
        path: JSON.stringify(coords),
        centerId: id.toString(), // Zone ID is the center ID
      });
    } catch (error) {
      logger.error(`Error parsing zone ${zone.n || 'unnamed'}:`, error instanceof Error ? error.message : String(error));
      // Continue with next zone
    }
  }

  logger.log(`✅ Parsed ${parsed.length} zones from ${rawZones.length} raw zones`);
  return parsed;
}

