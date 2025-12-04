/**
 * Center API Service
 * Handles fetching centers/sites from the backend API
 */

import { API_BASE_URL } from '@/constants/config';
import type { CenterApiResponse, RawCenterData } from '@/types/center';
import { NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { AuthStorageService } from './auth-storage';

/**
 * Build centers URL with authentication parameters
 */
export const buildCentersUrl = async (
  filtertype = 1,
  limit = 1000,
  regionid = -1
): Promise<string> => {
  const credentials = await AuthStorageService.getCredentials();
  if (!credentials || !credentials.token || !credentials.accid || !credentials.subid) {
    throw new Error('Missing required credentials. Please log in again.');
  }

  const params = new URLSearchParams({
    plug: 'Sites',
    package: 'tripsanalyzer',
    _dc: Date.now().toString(),
    full: '1',
    task: 'list',
    filtertype: filtertype.toString(),
    limit: limit.toString(),
    regionid: regionid.toString(),
    acc_token: credentials.token,
    acc_id: credentials.accid,
    acc_sid: credentials.subid,
  });

  return `${API_BASE_URL}?${params.toString()}`;
};

/**
 * Fetch centers from the API
 */
export async function fetchCenters(
  filtertype = 1,
  limit = 1000,
  regionid = -1
): Promise<RawCenterData[]> {
  try {
    const url = await buildCentersUrl(filtertype, limit, regionid);
    logger.log(`📡 Fetching centers from: ${url}`);

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
    let data: CenterApiResponse;

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
    const centers = data.rows || [];
    logger.log(`✅ Fetched ${centers.length} centers from API (totalCount: ${data.totalCount || centers.length})`);
    
    // Log each center
    logger.log('📋 Centers list:');
    centers.forEach((center, index) => {
      logger.log(
        `  [${index + 1}/${centers.length}] ID=${center.id}, Name="${center.name}", ` +
        `FullName="${center.fullname}", Geozone="${center.geozone}", ` +
        `GzoneID=${center.gzone_id}, SiteID=${center.siteid}, Group="${center.groupname}"`
      );
    });
    
    return centers;
  } catch (error) {
    // Re-throw if it's already a NetworkError
    if (error instanceof NetworkError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = parseErrorMessage(error);
    logger.error('📡 Failed to fetch centers:', errorMessage);
    throw new NetworkError(`Failed to fetch centers: ${errorMessage}`);
  }
}

export default { buildCentersUrl, fetchCenters };









