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

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new AuthError('Invalid response from server');
      }

      // Check if login was successful
      if (response.username || response.accid) {
        const user: ProofArriveUser = {
          loginUsername: credentials.username.trim(),
          fullName: response.username || credentials.username.trim(),
          email: response.email || `${credentials.username.trim()}@proofarrive.com`,
          company: response.company || 'ProofArrive Client',
          accid: response.accid || '',
          subid: response.subid || '',
          token: response.token || '',
        };

        // Validate required fields
        if (!user.accid || !user.token) {
          throw new AuthError('Incomplete authentication data received');
        }

        // Save credentials to storage
        try {
          await AuthStorageService.saveCredentials(user);
          logger.log('✅ Login successful and credentials saved');
        } catch (storageError) {
          logger.error('Failed to save credentials:', storageError);
          // Still return user even if storage fails
        }

        return user;
      } else {
        const errorMessage =
          response?.msg?.item ||
          response?.message ||
          'Invalid username or password';
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
        await AuthStorageService.clearAllData();
        logger.log('🧹 Local data cleared');
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

