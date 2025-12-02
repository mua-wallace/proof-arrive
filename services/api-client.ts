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
    if (formData) {
      logger.log(`📡 [API] FormData fields: ${Array.from((formData as any)._parts || []).map((p: any) => `${p[0]}=${typeof p[1] === 'string' ? p[1].substring(0, 20) + '...' : '[File]'}`).join(', ')}`);
    }

    const config: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    };

    // When using FormData, don't set Content-Type header - let fetch set it with boundary
    if (formData && method !== 'GET') {
      config.body = formData;
      // Remove Content-Type from headers if it exists - fetch will set it automatically
      if (config.headers && 'Content-Type' in config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
          logger.error(`📡 [API] HTTP Error: ${errorMessage}`);
          logger.error(`  - URL: ${url}`);
          logger.error(`  - Method: ${method}`);
          
          // Provide more specific error messages based on status code
          if (response.status === 401 || response.status === 403) {
            throw new NetworkError('Authentication failed. Please check your credentials and try again.');
          } else if (response.status === 404) {
            throw new NetworkError('API endpoint not found. Please check the server configuration.');
          } else if (response.status >= 500) {
            throw new NetworkError('Server error. Please try again later.');
          } else {
            throw new NetworkError(errorMessage);
          }
        }

      const contentType = response.headers.get('content-type');
      const responseStatus = response.status;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const jsonData = await response.json();
          // Log response for debugging
          logger.log(`📡 [API] Response received (JSON): ${JSON.stringify(jsonData).substring(0, 200)}`);
          return jsonData;
        } catch (parseError) {
          logger.error('Failed to parse JSON response:', parseError);
          logger.error(`  - URL: ${url}`);
          logger.error(`  - Status: ${responseStatus} ${response.statusText}`);
          throw new NetworkError('Invalid response format from server');
        }
      } else {
        const text = await response.text();
        logger.log(`📡 [API] Response received (text): "${text}" (length: ${text.length})`);
        
        // Handle empty string
        if (!text || text.trim() === '') {
          logger.error('📡 [API] Empty response received from server');
          logger.error(`  - URL: ${url}`);
          logger.error(`  - Method: ${method}`);
          logger.error(`  - Status: ${responseStatus} ${response.statusText}`);
          logger.error(`  - Content-Type: ${contentType || 'not set'}`);
          logger.error(`  - This usually indicates: invalid credentials, server error, or API endpoint issue`);
          
          // Provide more specific error based on status code
          if (responseStatus === 401 || responseStatus === 403) {
            throw new NetworkError('Authentication failed. Please check your username and password.');
          } else if (responseStatus >= 500) {
            throw new NetworkError('Server error. The server is experiencing issues. Please try again later.');
          } else if (responseStatus === 200 || responseStatus === 201) {
            // OK status but empty body - likely invalid credentials or API issue
            throw new NetworkError('Empty response from server. This may indicate invalid credentials. Please check your login details and try again.');
          } else {
            throw new NetworkError(`Empty response from server (Status: ${responseStatus}). This may indicate invalid credentials or a server issue.`);
          }
        }
        
        try {
          const parsed = JSON.parse(text);
          return parsed;
        } catch {
          // Return text as-is if it's not JSON (might be an error message)
          return text;
        }
      }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Check if it's an abort (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logger.error('📡 [API] Request timeout after 30 seconds');
          throw new NetworkError('Request timeout. Please check your internet connection and try again.');
        }
        
        // Re-throw NetworkError as-is
        if (fetchError instanceof NetworkError) {
          throw fetchError;
        }
        
        // Log detailed error information
        const errorMessage = parseErrorMessage(fetchError);
        logger.error('📡 [API] Request failed with error:');
        logger.error(`  - Error type: ${fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError}`);
        logger.error(`  - Error message: ${errorMessage}`);
        logger.error(`  - URL: ${url}`);
        logger.error(`  - Method: ${method}`);
        logger.error(`  - Full error: ${JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError))}`);
        
        // Provide more specific error messages
        if (errorMessage.toLowerCase().includes('network request failed') || 
            errorMessage.toLowerCase().includes('failed to fetch')) {
          throw new NetworkError(
            'Unable to connect to the server. Please check:\n' +
            '1. Your internet connection\n' +
            '2. The server is accessible\n' +
            '3. No firewall is blocking the request'
          );
        }
        
        throw new NetworkError(errorMessage);
      }
    } catch (error) {
      // Re-throw if it's already a NetworkError
      if (error instanceof NetworkError) {
        throw error;
      }
      
      // Wrap other errors
      const errorMessage = parseErrorMessage(error);
      logger.error('📡 [API] Unexpected error:', errorMessage);
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

