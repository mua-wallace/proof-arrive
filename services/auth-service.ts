/**
 * Authentication Service
 * Handles login, logout, and credential verification
 */

import type {
    AuthCredentials,
    AuthResponse,
    AuthVerificationResponse,
    ProofArriveUser,
} from '@/types/auth';

import { AuthError, NetworkError, parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { ApiClient } from './api-client';
import { AuthStorageService } from './auth-storage';
import { clearAllUserData } from './data-cleanup';

export class AuthService {
  private static apiClient = new ApiClient();

  // Login with ProofArrive API
  static async login(
    credentials: AuthCredentials
  ): Promise<ProofArriveUser> {
    if (!credentials.username?.trim() || !credentials.password?.trim()) {
      throw new AuthError('Username and password are required');
    }

    logger.log('🔐 Authenticating user:', credentials.username);

    // Prepare form data according to API specification
    const formData = new FormData();
    try {
      formData.append('auth_u', credentials.username.trim());
      formData.append('auth_p', credentials.password.trim());
      formData.append('code', '');
      formData.append('lt', '0');
      formData.append('lg', '0');
      formData.append('cookie', '0');
      formData.append('keepme', 'on');
    } catch (formError) {
      logger.error('Failed to create form data:', formError);
      throw new AuthError('Failed to prepare login request');
    }

    try {
      const response: AuthResponse = await this.apiClient.makeRequest('', {
        method: 'POST',
        params: { sys: 'CheckAuth' },
        formData: formData,
        useTimestamp: false,
      });

      logger.log('🔐 Login response received');
      
      // DEBUG: Log the full response structure
      logger.log('🔐 [DEBUG] Login response structure:');
      logger.log(`  - Response type: ${typeof response}`);
      logger.log(`  - Is array: ${Array.isArray(response)}`);
      logger.log(`  - Is null: ${response === null}`);
      logger.log(`  - Full response: ${JSON.stringify(response, null, 2)}`);
      
      // Handle different response types
      let responseData: AuthResponse;
      
      if (response === null || response === undefined) {
        logger.error('❌ [DEBUG] Response is null or undefined');
        throw new AuthError('No response from server');
      }
      
      // If response is a string, try to parse it
      if (typeof response === 'string') {
        // Handle empty string
        if (response.trim() === '') {
          logger.error('❌ [DEBUG] Response is an empty string');
          throw new AuthError('Empty response from server. Please check your credentials and try again.');
        }
        
        logger.log('⚠️  [DEBUG] Response is a string, attempting to parse...');
        logger.log(`  - String length: ${response.length}`);
        logger.log(`  - String content: "${response}"`);
        
        try {
          responseData = JSON.parse(response);
          logger.log('✅ [DEBUG] Successfully parsed string response');
        } catch (parseError) {
          logger.error('❌ [DEBUG] Failed to parse string response:', parseErrorMessage(parseError));
          // If it's a plain string error message, use it (but not if it's empty)
          const errorMessage = response.trim() || 'Invalid response from server';
          throw new AuthError(errorMessage);
        }
      }
      // If response is an array, check if it contains error info
      else if (Array.isArray(response)) {
        logger.log('⚠️  [DEBUG] Response is an array');
        logger.log(`  - Array length: ${response.length}`);
        logger.log(`  - First element: ${JSON.stringify(response[0])}`);
        
        // Some APIs return error messages in arrays like [[0, "error message"]]
        if (response.length > 0 && Array.isArray(response[0])) {
          const errorCode = response[0][0];
          const errorMessage = response[0][1] || 'Login failed';
          logger.error(`❌ [DEBUG] Error response in array format: [${errorCode}, "${errorMessage}"]`);
          throw new AuthError(errorMessage);
        }
        
        // If array doesn't match expected format, treat as invalid
        logger.error('❌ [DEBUG] Unexpected array response format');
        throw new AuthError('Invalid response format from server');
      }
      // If response is an object, use it directly
      else if (typeof response === 'object') {
        responseData = response as AuthResponse;
        logger.log(`  - Response keys: ${Object.keys(responseData).join(', ')}`);
      }
      // For other types (number, boolean, etc.), treat as invalid
      else {
        logger.error(`❌ [DEBUG] Invalid response type: ${typeof response}`);
        throw new AuthError('Invalid response format from server');
      }
      
      // Now log the parsed response data
      logger.log(`  - Has username: ${!!responseData?.username}`);
      logger.log(`  - Has accid: ${!!responseData?.accid}`);
      logger.log(`  - Has token: ${!!responseData?.token}`);
      logger.log(`  - Username value: ${responseData?.username || 'N/A'}`);
      logger.log(`  - Accid value: ${responseData?.accid || 'N/A'}`);
      logger.log(`  - Token value: ${responseData?.token ? `${responseData.token.substring(0, 20)}...` : 'N/A'}`);
      logger.log(`  - Has msg: ${!!responseData?.msg}`);
      logger.log(`  - Msg item: ${responseData?.msg?.item || 'N/A'}`);
      logger.log(`  - Has message: ${!!responseData?.message}`);
      logger.log(`  - Message value: ${responseData?.message || 'N/A'}`);

      // Validate response structure
      if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
        logger.error('❌ [DEBUG] Invalid response structure after parsing');
        throw new AuthError('Invalid response from server');
      }

      // Check if login was successful
      if (responseData.username || responseData.accid) {
        logger.log('✅ [DEBUG] Login response validation passed - has username or accid');
        const user: ProofArriveUser = {
          loginUsername: credentials.username.trim(),
          fullName: responseData.username || credentials.username.trim(),
          email: responseData.email || `${credentials.username.trim()}@proofarrive.com`,
          company: responseData.company || 'ProofArrive Client',
          accid: responseData.accid || '',
          subid: responseData.subid || '',
          token: responseData.token || '',
        };

        // Validate required fields
        logger.log('🔐 [DEBUG] Validating user object:');
        logger.log(`  - accid: ${user.accid || 'MISSING'}`);
        logger.log(`  - token: ${user.token ? `${user.token.substring(0, 20)}...` : 'MISSING'}`);
        
        if (!user.accid || !user.token) {
          logger.error('❌ [DEBUG] Validation failed - missing accid or token');
          logger.error(`  - accid present: ${!!user.accid}`);
          logger.error(`  - token present: ${!!user.token}`);
          throw new AuthError('Incomplete authentication data received');
        }
        
        logger.log('✅ [DEBUG] User object validation passed');

        // Save credentials to storage
        try {
          logger.log('💾 [DEBUG] Preparing to save credentials after successful login');
          logger.log(`  - User object keys: ${Object.keys(user).join(', ')}`);
          await AuthStorageService.saveCredentials(user);
          logger.log('✅ Login successful and credentials saved');
        } catch (storageError) {
          logger.error('Failed to save credentials:', storageError);
          // Still return user even if storage fails
        }

        return user;
      } else {
        logger.error('❌ [DEBUG] Login validation failed - no username or accid in response');
        logger.error(`  - Response structure: ${JSON.stringify(responseData)}`);
        const errorMessage =
          responseData?.msg?.item ||
          responseData?.message ||
          'Invalid username or password';
        logger.error(`  - Error message to throw: ${errorMessage}`);
        throw new AuthError(errorMessage);
      }
    } catch (error) {
      // Re-throw AuthError and NetworkError as-is
      if (error instanceof AuthError || error instanceof NetworkError) {
        throw error;
      }

      // Wrap other errors
      const errorMessage = parseErrorMessage(error);
      logger.error('🔐 Login error:', errorMessage);
      
      // Check if it's a network error
      if (errorMessage.toLowerCase().includes('network') ||
          errorMessage.toLowerCase().includes('fetch') ||
          errorMessage.toLowerCase().includes('connection')) {
        throw new NetworkError('Unable to connect to server. Please check your internet connection.');
      }
      
      throw new AuthError(errorMessage);
    }
  }

  // Verify stored credentials with GetLS
  static async checkAuth(
    credentials: ProofArriveUser
  ): Promise<AuthVerificationResponse> {
    if (!credentials?.token || !credentials?.accid) {
      return { success: false, valid: false };
    }

    logger.log('🔍 Verifying credentials with GetLS...');

    try {
      const response = await this.apiClient.makeRequest('', {
        method: 'GET',
        params: {
          sys: 'GetLS',
          acc_token: credentials.token,
          acc_id: credentials.accid,
          acc_sid: credentials.subid || '',
        },
      });

      // Check if response indicates valid session
      // Expecting [[1]] for valid, [[0]] for invalid
      if (
        Array.isArray(response) &&
        response.length > 0 &&
        Array.isArray(response[0]) &&
        typeof response[0][0] === 'number'
      ) {
        const isValid = response[0][0] === 1;
        return {
          success: true,
          valid: isValid,
        };
      }

      return { success: false, valid: false };
    } catch (error) {
      logger.error('🔍 GetLS error:', parseErrorMessage(error));
      // Return invalid on any error (network, parsing, etc.)
      return { success: false, valid: false };
    }
  }

  // Logout from API and clear local data
  static async logout(): Promise<void> {
    logger.log('🚪 Logging out...');

    try {
      const credentials = await AuthStorageService.getCredentials();

      if (credentials?.token) {
        try {
          // Prepare form data for logout
          const formData = new FormData();
          formData.append('acc_token', credentials.token);
          formData.append('acc_id', credentials.accid || '');
          formData.append('acc_sid', credentials.subid || '');

          await this.apiClient.makeRequest('', {
            method: 'POST',
            params: { sys: 'DoLogout' },
            formData: formData,
            useTimestamp: false,
          });

          logger.log('🚪 Server logout successful');
        } catch (apiError) {
          // Log but don't throw - we'll still clear local data
          logger.warn('🚪 Server logout failed, continuing with local cleanup');
        }
      }
    } catch (error) {
      logger.error('🚪 Error during logout:', parseErrorMessage(error));
    } finally {
      // Always clear local data regardless of API response
      try {
        // Clear authentication data
        await AuthStorageService.clearAllData();
        logger.log('🧹 Authentication data cleared');
        
        // Clear current center info
        const { clearCurrentCenter } = await import('./center-info');
        await clearCurrentCenter();
        logger.log('🧹 Current center info cleared');
        
        // Clear user-specific data (geozones and centers)
        await clearAllUserData();
        logger.log('🧹 All user data cleared');
      } catch (clearError) {
        logger.error('🧹 Failed to clear local data:', parseErrorMessage(clearError));
        // Don't throw - logout should always complete
      }
    }
  }

  // Verify stored credentials and return user if valid
  static async verifyStoredCredentials(): Promise<ProofArriveUser | null> {
    logger.log('🔍 Verifying stored credentials...');

    try {
      const credentials = await AuthStorageService.getCredentials();
      if (!credentials?.token || !credentials?.accid) {
        logger.log('🔍 No stored credentials found');
        return null;
      }

      logger.log('🔍 Found stored credentials for user:', credentials.loginUsername);

      // Verify credentials are still valid using GetLS
      const verification = await this.checkAuth(credentials);

      if (verification.valid) {
        logger.log('✅ Stored credentials are valid');
        return credentials;
      } else {
        logger.log('❌ Stored credentials are invalid, clearing...');
        try {
          await AuthStorageService.clearAllData();
        } catch (clearError) {
          logger.error('Failed to clear invalid credentials:', parseErrorMessage(clearError));
        }
        return null;
      }
    } catch (error) {
      logger.error('🔍 Credential verification error:', parseErrorMessage(error));
      // On error, clear potentially corrupted data
      try {
        await AuthStorageService.clearAllData();
      } catch (clearError) {
        logger.error('Failed to clear data after verification error:', parseErrorMessage(clearError));
      }
      return null;
    }
  }

  // Check if user has stored credentials
  static async hasStoredAuth(): Promise<boolean> {
    try {
      const hasCredentials =
        await AuthStorageService.hasStoredCredentials();
      return hasCredentials;
    } catch {
      return false;
    }
  }
}

