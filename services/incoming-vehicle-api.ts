/**
 * Incoming Vehicle API Service
 * Handles fetching incoming vehicles from the backend API
 */

import { API_BASE_URL } from '@/constants/config';
import type { IncomingVehicleApiResponse, RawIncomingVehicleData } from '@/types/incoming-vehicle';
import { NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { AuthStorageService } from './auth-storage';
import { getCurrentCenter } from './center-info';

/**
 * Build incoming vehicles URL with authentication parameters
 */
export const buildIncomingVehiclesUrl = async (
  centerId?: number,
  limit = 100
): Promise<string> => {
  const credentials = await AuthStorageService.getCredentials();
  if (!credentials || !credentials.token || !credentials.accid || !credentials.subid) {
    throw new Error('Missing required credentials. Please log in again.');
  }

  // If centerId not provided, get from current center
  let targetCenterId = centerId;
  if (!targetCenterId) {
    const currentCenter = await getCurrentCenter();
    if (!currentCenter) {
      throw new Error('No center found. Please ensure you are in a valid geozone.');
    }
    targetCenterId = currentCenter.id;
  }

  const params = new URLSearchParams({
    sys: 'IncomingVehicles', // TODO: Update with actual API endpoint name
    task: 'list',
    _dc: Date.now().toString(),
    center_id: targetCenterId.toString(),
    limit: limit.toString(),
    acc_token: credentials.token,
    acc_id: credentials.accid,
    acc_sid: credentials.subid,
  });

  return `${API_BASE_URL}?${params.toString()}`;
};

/**
 * Fetch incoming vehicles from the API
 */
export async function fetchIncomingVehicles(
  centerId?: number,
  limit = 100
): Promise<RawIncomingVehicleData[]> {
  try {
    const url = await buildIncomingVehiclesUrl(centerId, limit);
    logger.log(`📡 Fetching incoming vehicles from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
      throw new NetworkError(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    let data: IncomingVehicleApiResponse;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        logger.error('Failed to parse JSON response:', parseErrorMessage(parseError));
        throw new NetworkError('Invalid response format from server');
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new NetworkError('Invalid response format from server');
      }
    }

    // Extract rows from response
    const vehicles = data.rows || [];
    logger.log(`✅ Fetched ${vehicles.length} incoming vehicles from API (totalCount: ${data.totalCount || vehicles.length})`);
    
    // Log sample vehicles
    if (vehicles.length > 0) {
      logger.log('📋 Sample incoming vehicles:');
      vehicles.slice(0, 3).forEach((vehicle, index) => {
        logger.log(
          `  [${index + 1}] Vehicle ID: ${vehicle.vehicleId}, ` +
          `Status: ${vehicle.status}, Exit Center: ${vehicle.exitCenterId}, ` +
          `Exit Time: ${new Date(vehicle.exitTime).toISOString()}`
        );
      });
    }
    
    return vehicles;
  } catch (error) {
    // Re-throw if it's already a NetworkError
    if (error instanceof NetworkError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = parseErrorMessage(error);
    logger.error('📡 Failed to fetch incoming vehicles:', errorMessage);
    throw new NetworkError(`Failed to fetch incoming vehicles: ${errorMessage}`);
  }
}

export default { buildIncomingVehiclesUrl, fetchIncomingVehicles };




