/**
 * Incoming Vehicle Service
 * Main service for managing incoming vehicles - fetching, parsing, and formatting
 */

import type { IncomingVehicle, RawIncomingVehicleData } from '@/types/incoming-vehicle';
import { logger } from '@/utils/logger';
import { getCenterById, getCenterByName } from './center-service';
import { fetchIncomingVehicles } from './incoming-vehicle-api';
import { getAllArrivals } from './storage';
import { getCurrentCenter } from './center-info';

/**
 * Calculate estimated arrival time based on distance and average speed
 * @param exitTime Timestamp when vehicle left exit center
 * @param distance Distance in km (optional)
 * @param averageSpeed Average speed in km/h (default: 60 km/h)
 * @returns Estimated arrival timestamp
 */
export function calculateEstimatedArrivalTime(
  exitTime: number,
  distance?: number,
  averageSpeed: number = 60
): number | undefined {
  if (!distance || distance <= 0) {
    return undefined;
  }

  // Calculate time in hours: distance / speed
  const timeInHours = distance / averageSpeed;
  // Convert to milliseconds and add to exit time
  const estimatedArrival = exitTime + timeInHours * 60 * 60 * 1000;
  
  return estimatedArrival;
}

/**
 * Format timestamp to readable date/time string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = timestamp - now.getTime();
  const diffHours = Math.abs(diffMs / (1000 * 60 * 60));

  // If less than 1 hour, show minutes
  if (diffHours < 1) {
    const diffMins = Math.abs(diffMs / (1000 * 60));
    if (diffMins < 1) {
      return 'Now';
    }
    return diffMs > 0 
      ? `In ${Math.round(diffMins)} min`
      : `${Math.round(diffMins)} min ago`;
  }

  // If less than 24 hours, show hours
  if (diffHours < 24) {
    return diffMs > 0
      ? `In ${Math.round(diffHours)} hour${Math.round(diffHours) !== 1 ? 's' : ''}`
      : `${Math.round(diffHours)} hour${Math.round(diffHours) !== 1 ? 's' : ''} ago`;
  }

  // Otherwise show date and time
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse and format incoming vehicle data
 */
export async function parseIncomingVehicle(
  raw: RawIncomingVehicleData
): Promise<IncomingVehicle> {
  // Get center names - use provided names or fetch them
  let exitCenterName = raw.exitCenterName;
  let destinationCenterName = raw.destinationCenterName;

  // Fetch exit center name if not provided
  if (!exitCenterName && raw.exitCenterId) {
    try {
      const exitCenter = await getCenterById(raw.exitCenterId);
      if (exitCenter) {
        exitCenterName = exitCenter.name;
      } else {
        // Fallback to center ID if center not found
        exitCenterName = `Center ${raw.exitCenterId}`;
        logger.warn(`Exit center ${raw.exitCenterId} not found, using ID as fallback`);
      }
    } catch (error) {
      logger.warn(`Failed to fetch exit center ${raw.exitCenterId}:`, error);
      exitCenterName = `Center ${raw.exitCenterId}`;
    }
  }

  // Fetch destination center name if not provided
  if (!destinationCenterName && raw.destinationCenterId) {
    try {
      const destCenter = await getCenterById(raw.destinationCenterId);
      if (destCenter) {
        destinationCenterName = destCenter.name;
      } else {
        // Fallback to center ID if center not found
        destinationCenterName = `Center ${raw.destinationCenterId}`;
        logger.warn(`Destination center ${raw.destinationCenterId} not found, using ID as fallback`);
      }
    } catch (error) {
      logger.warn(`Failed to fetch destination center ${raw.destinationCenterId}:`, error);
      destinationCenterName = `Center ${raw.destinationCenterId}`;
    }
  }

  // Final fallback if still no name
  if (!exitCenterName) {
    exitCenterName = raw.exitCenterId ? `Center ${raw.exitCenterId}` : 'Unknown Center';
  }
  if (!destinationCenterName) {
    destinationCenterName = raw.destinationCenterId ? `Center ${raw.destinationCenterId}` : 'Unknown Center';
  }

  // Calculate estimated arrival if not provided
  let estimatedArrivalTime = raw.estimatedArrivalTime;
  if (!estimatedArrivalTime && raw.distance) {
    estimatedArrivalTime = calculateEstimatedArrivalTime(
      raw.exitTime,
      raw.distance
    );
  }

  return {
    vehicleId: raw.vehicleId,
    vehicleName: raw.vehicleName || raw.vehicleId,
    vehiclePlate: raw.vehiclePlate,
    status: raw.status,
    exitCenterId: raw.exitCenterId,
    exitCenterName,
    exitTime: raw.exitTime,
    exitTimeFormatted: formatDateTime(raw.exitTime),
    destinationCenterId: raw.destinationCenterId,
    destinationCenterName,
    estimatedArrivalTime,
    estimatedArrivalTimeFormatted: estimatedArrivalTime
      ? formatDateTime(estimatedArrivalTime)
      : undefined,
    distance: raw.distance,
    currentLocation: raw.currentLocation,
  };
}

/**
 * Get mock incoming vehicles from exited vehicles
 * This is a temporary solution until the API is ready
 * Shows vehicles that exited from other centers and are coming to the current center
 */
async function getMockIncomingVehicles(
  centerId?: number,
  limit = 100
): Promise<RawIncomingVehicleData[]> {
  try {
    logger.log('📦 [MOCK] Generating incoming vehicles from exited vehicles...');
    
    // Get current center
    let currentCenter = centerId 
      ? await getCenterById(centerId)
      : await getCurrentCenter();
    
    // If no current center, try to get it from location
    if (!currentCenter) {
      logger.warn('⚠️  [MOCK] No current center found in storage, trying to get from location...');
      try {
        const { getCenterFromLocation } = await import('./geozone-service');
        const { getCurrentLocation } = await import('./location');
        const location = await getCurrentLocation();
        currentCenter = await getCenterFromLocation(location);
      } catch (error) {
        logger.warn('⚠️  [MOCK] Could not get center from location:', error);
      }
    }

    // If still no current center, show all exited vehicles (they might be coming to any center)
    const showAllExitedVehicles = !currentCenter;
    
    if (!currentCenter) {
      logger.warn('⚠️  [MOCK] No current center found - will show all exited vehicles');
      logger.warn('  - This usually means the user is not in a valid geozone or center info is not set');
    } else {
      logger.log(`📦 [MOCK] Current center: ${currentCenter.name} (ID: ${currentCenter.id})`);
      logger.log(`  - Full name: ${currentCenter.fullname}`);
    }

    // Get all exited vehicles
    const allArrivals = await getAllArrivals();
    
    // Filter for vehicles that have an exit destination
    const exitedVehicles = allArrivals.filter(
      (arrival) => {
        return (
          arrival.status === 'exited' &&
          arrival.exitTime &&
          arrival.exitDestination &&
          arrival.exitDestination.trim().length > 0
        );
      }
    );

    logger.log(`📦 [MOCK] Found ${exitedVehicles.length} exited vehicles with destinations`);
    
    // Log all exited vehicles for debugging
    exitedVehicles.forEach((arrival, index) => {
      logger.log(`  [${index + 1}] Vehicle: ${arrival.vehicleId}, Exit Destination: "${arrival.exitDestination}", Exit Center ID: ${arrival.centerId}`);
    });

    // Convert exited vehicles to incoming vehicles
    // Match exitDestination to a center name, and if it matches current center, show as incoming
    const mockVehicles: RawIncomingVehicleData[] = [];
    
    // First, fetch all exit center names in batch to avoid repeated lookups
    const exitCenterIds = new Set<number>();
    exitedVehicles.forEach((arrival) => {
      const centerId = parseInt(arrival.centerId, 10);
      if (!isNaN(centerId)) {
        exitCenterIds.add(centerId);
      }
    });

    // Create a map of center IDs to center names
    const centerNameMap = new Map<number, string>();
    await Promise.all(
      Array.from(exitCenterIds).map(async (centerId) => {
        try {
          const center = await getCenterById(centerId);
          if (center) {
            centerNameMap.set(centerId, center.name);
          }
        } catch (error) {
          logger.warn(`Failed to fetch center ${centerId}:`, error);
        }
      })
    );

    logger.log(`📋 [MOCK] Loaded ${centerNameMap.size} exit center names`);
    
    // Process ALL exited vehicles, not just a limited subset
    for (const arrival of exitedVehicles) {
      try {
        logger.log(`🔍 [MOCK] Processing vehicle ${arrival.vehicleId}:`);
        logger.log(`  - Exit Destination: "${arrival.exitDestination}"`);
        logger.log(`  - Exit Center ID: ${arrival.centerId}`);
        logger.log(`  - Current Center: "${currentCenter.name}" (ID: ${currentCenter.id})`);
        
        // If no current center, show all exited vehicles
        let shouldInclude = false;
        
        if (showAllExitedVehicles) {
          // No current center - show all exited vehicles
          shouldInclude = true;
          logger.log(`  ✅ No current center set - including all exited vehicles`);
        } else if (currentCenter) {
          // Try to find a center that matches the exit destination
          const destinationCenter = await getCenterByName(arrival.exitDestination!);
          
          // Check if destination matches current center (either by ID match or direct name match)
          if (destinationCenter) {
            logger.log(`  ✅ Found matching center: "${destinationCenter.name}" (ID: ${destinationCenter.id})`);
            if (destinationCenter.id === currentCenter.id) {
              shouldInclude = true;
              logger.log(`  ✅ Destination center ID matches current center`);
            } else {
              logger.log(`  ❌ Destination center ID (${destinationCenter.id}) does not match current center (${currentCenter.id})`);
            }
          } else {
            logger.log(`  ❌ No center found matching "${arrival.exitDestination}"`);
            // Try direct name comparison as fallback (more flexible matching)
            const exitDestLower = arrival.exitDestination!.toLowerCase().trim();
            const currentNameLower = currentCenter.name.toLowerCase().trim();
            const currentFullNameLower = currentCenter.fullname.toLowerCase().trim();
            
            logger.log(`  🔄 Trying direct comparison: "${exitDestLower}" vs "${currentNameLower}" or "${currentFullNameLower}"`);
            
            // More flexible matching: check if exit destination contains center name or vice versa
            const nameContains = exitDestLower.includes(currentNameLower) || currentNameLower.includes(exitDestLower);
            const fullNameContains = exitDestLower.includes(currentFullNameLower) || currentFullNameLower.includes(exitDestLower);
            const exactMatch = exitDestLower === currentNameLower || exitDestLower === currentFullNameLower;
            
            if (exactMatch || nameContains || fullNameContains) {
              shouldInclude = true;
              logger.log(`  ✅ Match found! (exact: ${exactMatch}, name contains: ${nameContains}, fullname contains: ${fullNameContains})`);
            } else {
              logger.log(`  ❌ No match found`);
            }
          }
        }
        
        if (shouldInclude) {
          logger.log(`  ✅ Adding vehicle ${arrival.vehicleId} to incoming vehicles`);
          
          // Use exited vehicle information directly
          const exitCenterId = parseInt(arrival.centerId, 10);
          
          if (!isNaN(exitCenterId)) {
            // Get exit center name from the map we created
            const exitCenterName = centerNameMap.get(exitCenterId) || `Center ${exitCenterId}`;
            
            // Determine status based on exit type from the exited vehicle
            const status: 'loaded' | 'unloaded' = 
              arrival.exitType === 'loaded' ? 'loaded' : 'unloaded';

            // Calculate distance (mock: use a random distance between 10-100 km)
            const distance = 10 + Math.random() * 90;

            // Determine destination center - use current center if available, otherwise use exit destination
            let destinationCenterId: number;
            let destinationCenterName: string;
            
            if (currentCenter) {
              destinationCenterId = currentCenter.id;
              destinationCenterName = currentCenter.name;
            } else {
              // No current center - try to find destination center from exit destination
              const destCenter = await getCenterByName(arrival.exitDestination!);
              if (destCenter) {
                destinationCenterId = destCenter.id;
                destinationCenterName = destCenter.name;
              } else {
                // Fallback: use exit destination as name and 0 as ID
                destinationCenterId = 0;
                destinationCenterName = arrival.exitDestination!;
              }
            }

            mockVehicles.push({
              vehicleId: arrival.vehicleId,
              vehicleName: arrival.vehicleId, // Use vehicle ID from exited vehicle
              vehiclePlate: undefined, // Can be enhanced if available in future
              status, // Use exit type from exited vehicle
              exitCenterId, // Use center ID from exited vehicle
              exitCenterName, // Use center name from our map
              exitTime: arrival.exitTime!, // Use exit time from exited vehicle
              destinationCenterId,
              destinationCenterName,
              estimatedArrivalTime: undefined, // Will be calculated in parseIncomingVehicle
              distance,
              currentLocation: arrival.exitAgentLatitude && arrival.exitAgentLongitude
                ? {
                    latitude: arrival.exitAgentLatitude, // Use exit location from exited vehicle
                    longitude: arrival.exitAgentLongitude, // Use exit location from exited vehicle
                    timestamp: arrival.exitTime!, // Use exit time from exited vehicle
                  }
                : undefined,
            });
            
            logger.log(`  ✅ Created incoming vehicle with exit center: ${exitCenterName} (ID: ${exitCenterId})`);
          } else {
            logger.warn(`  ⚠️  Invalid exit center ID: ${arrival.centerId}`);
          }
        }
      } catch (error) {
        logger.warn(`⚠️  [MOCK] Error processing vehicle ${arrival.vehicleId}:`, error);
        // Continue with next vehicle
      }
    }

    logger.log(`✅ [MOCK] Generated ${mockVehicles.length} mock incoming vehicles for ${currentCenter.name}`);
    logger.log(`  - Processed ${exitedVehicles.length} exited vehicles`);
    logger.log(`  - Matched ${mockVehicles.length} vehicles to current center`);
    
    if (mockVehicles.length === 0 && exitedVehicles.length > 0) {
      logger.warn('⚠️  [MOCK] No vehicles matched current center, but exited vehicles exist:');
      logger.warn('  - This might mean the exitDestination does not match the current center name');
      logger.warn('  - Check that exitDestination matches either center name or fullname');
      logger.warn('  - Current center name:', currentCenter.name);
      logger.warn('  - Current center fullname:', currentCenter.fullname);
      logger.warn('  - Sample exit destinations:');
      exitedVehicles.slice(0, 5).forEach((v) => {
        logger.warn(`    - Vehicle ${v.vehicleId}: "${v.exitDestination}"`);
      });
    } else if (mockVehicles.length < exitedVehicles.length) {
      logger.warn(`⚠️  [MOCK] Only ${mockVehicles.length} out of ${exitedVehicles.length} vehicles matched`);
      logger.warn('  - Some vehicles may have exit destinations that don\'t match the current center');
    }
    
    // Apply limit only at the end, after processing all vehicles
    const limitedVehicles = mockVehicles.slice(0, limit);
    if (limitedVehicles.length < mockVehicles.length) {
      logger.log(`  - Limited to ${limit} vehicles (found ${mockVehicles.length} total matches)`);
    }
    
    return limitedVehicles;
  } catch (error) {
    logger.error('❌ [MOCK] Error generating mock incoming vehicles:', error);
    return [];
  }
}

/**
 * Fetch incoming vehicles and parse them
 * Currently uses mock data from exited vehicles until API is ready
 */
export async function fetchAndParseIncomingVehicles(
  centerId?: number,
  limit = 100
): Promise<IncomingVehicle[]> {
  try {
    // TODO: Replace with actual API call when ready
    // For now, use mock data from exited vehicles
    logger.log('📡 Fetching incoming vehicles (using mock data from exited vehicles)...');
    
    // Uncomment below when API is ready:
    // const rawVehicles = await fetchIncomingVehicles(centerId, limit);
    
    // Using mock data for now:
    const rawVehicles = await getMockIncomingVehicles(centerId, limit);

    if (!rawVehicles || rawVehicles.length === 0) {
      logger.log('ℹ️  No incoming vehicles found');
      return [];
    }

    logger.log(`🔧 Parsing ${rawVehicles.length} incoming vehicles...`);
    const parsedVehicles = await Promise.all(
      rawVehicles.map(parseIncomingVehicle)
    );

    logger.log(`✅ Successfully parsed ${parsedVehicles.length} incoming vehicles`);
    return parsedVehicles;
  } catch (error) {
    logger.error('❌ Error fetching and parsing incoming vehicles:', error);
    throw error;
  }
}

