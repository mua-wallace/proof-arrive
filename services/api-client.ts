/**
 * API Client for ProofArrive
 * Handles all HTTP requests to the backend API
 */

import { API_BASE_URL } from '@/constants/config';
import { NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

// Get API base URL from config or use default
const getBaseUrl = (): string => {
  // Use the config constant as the default
  // You can override this by passing baseUrl to ApiClient constructor
  return API_BASE_URL;
};

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getBaseUrl();
  }

  async makeRequest(
    endpoint: string = '',
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: Record<string, string | number>;
      formData?: FormData;
      headers?: Record<string, string>;
      useTimestamp?: boolean;
    } = {}
  ): Promise<any> {
    const {
      method = 'GET',
      params = {},
      formData = null,
      headers = {},
      useTimestamp = true,
    } = options;

    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    const queryParams = new URLSearchParams();

    // Add timestamp for cache busting if needed
    if (useTimestamp) {
      queryParams.set('_dc', Date.now().toString());
    }

    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.set(key, value.toString());
      }
    });

    if (queryParams.toString()) {
      url += '?' + queryParams.toString();
    }

    logger.log(`📡 API Request: ${method} ${url}`);

    const config: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    };

    if (formData && method !== 'GET') {
      config.body = formData;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        throw new NetworkError(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          return await response.json();
        } catch (parseError) {
          logger.error('Failed to parse JSON response:', parseError);
          throw new NetworkError('Invalid response format from server');
        }
      } else {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    } catch (error) {
      // Re-throw if it's already a NetworkError
      if (error instanceof NetworkError) {
        throw error;
      }
      
      // Wrap other errors
      const errorMessage = parseErrorMessage(error);
      logger.error('📡 API Request failed:', errorMessage);
      throw new NetworkError(errorMessage);
    }
  }

  // Backward compatibility method for existing patterns
  async request(
    config: {
      accToken: string;
      accountId: string | number;
      accountSubId: string | number;
    },
    params: Record<string, any>
  ): Promise<any> {
    const timestamp = Date.now();
    const queryParams = {
      _dc: timestamp.toString(),
      acc_token: config.accToken,
      acc_id: config.accountId.toString(),
      acc_sid: config.accountSubId.toString(),
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, value.toString()])
      ),
    };

    return await this.makeRequest('', {
      method: 'GET',
      params: queryParams,
      useTimestamp: false,
    });
  }
}

