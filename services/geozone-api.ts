/**
 * Geozone API Service
 * Handles fetching geozones from the backend API
 */

import { API_BASE_URL } from '@/constants/config';
import type { RawZoneData, ZoneApiResponse } from '@/types/geozone';
import { NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { AuthStorageService } from './auth-storage';

/**
 * Build zone URL with authentication parameters
 */
export const buildZoneUrl = async (query = '%', page = 1, limit = 1000): Promise<string> => {
  const credentials = await AuthStorageService.getCredentials();
  if (!credentials || !credentials.token || !credentials.accid || !credentials.subid) {
    throw new Error('Missing required credentials. Please log in again.');
  }

  const params = new URLSearchParams({
    sys: 'MapVars',
    task: 'zone',
    edit: 'true',
    _dc: Date.now().toString(),
    acc_token: credentials.token,
    acc_id: credentials.accid,
    acc_sid: credentials.subid,
    page: page.toString(),
    start: '0',
    limit: limit.toString(),
    query,
  });

  return `${API_BASE_URL}?${params.toString()}`;
};

/**
 * Fetch zones from the API
 */
export async function fetchZones(query = '%', page = 1, limit = 1000): Promise<RawZoneData[]> {
  try {
    const url = await buildZoneUrl(query, page, limit);
    logger.log(`📡 Fetching zones from: ${url}`);

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
    let data: ZoneApiResponse;

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
    const zones = data.rows || [];
    logger.log(`✅ Fetched ${zones.length} zones from API`);
    return zones;
  } catch (error) {
    // Re-throw if it's already a NetworkError
    if (error instanceof NetworkError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = parseErrorMessage(error);
    logger.error('📡 Failed to fetch zones:', errorMessage);
    throw new NetworkError(`Failed to fetch zones: ${errorMessage}`);
  }
}

export default { buildZoneUrl, fetchZones };







