/**
 * Authentication Storage Service
 * Handles storing and retrieving user credentials
 */

import type { ProofArriveUser } from '@/types/auth';
import { parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

import { Storage } from './storage-adapter';

// Storage keys
const AUTH_TOKEN_KEY = 'proofarrive_auth_token';
const USER_DATA_KEY = 'proofarrive_user_data';
const CREDENTIALS_KEY = 'proofarrive_credentials';

export class AuthStorageService {
  // Save user credentials after successful login
  static async saveCredentials(user: ProofArriveUser): Promise<void> {
    if (!user || !user.loginUsername || !user.token) {
      throw new Error('Invalid user data provided');
    }

    try {
      // DEBUG: Log credentials being saved (excluding sensitive password data)
      logger.log('🔐 [DEBUG] Saving login credentials:');
      logger.log(`  - Username: ${user.loginUsername}`);
      logger.log(`  - Full Name: ${user.fullName || 'N/A'}`);
      logger.log(`  - Email: ${user.email || 'N/A'}`);
      logger.log(`  - Company: ${user.company || 'N/A'}`);
      logger.log(`  - Account ID: ${user.accid || 'N/A'}`);
      logger.log(`  - Sub ID: ${user.subid || 'N/A'}`);
      logger.log(`  - Token: ${user.token ? `${user.token.substring(0, 20)}...` : 'N/A'} (length: ${user.token?.length || 0})`);
      
      const userData = JSON.stringify(user);
      await Storage.setItem({
        key: CREDENTIALS_KEY,
        value: userData,
      });
      logger.log('✅ Credentials saved successfully to storage');
      logger.log(`  - Storage key: ${CREDENTIALS_KEY}`);
      logger.log(`  - Data size: ${userData.length} bytes`);
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      logger.error('❌ Error saving credentials:', errorMessage);
      throw new Error(`Failed to save credentials: ${errorMessage}`);
    }
  }

  // Get stored credentials
  static async getCredentials(): Promise<ProofArriveUser | null> {
    try {
      const data = await Storage.getItem({ key: CREDENTIALS_KEY });
      if (!data) {
        return null;
      }

      try {
        const parsed = JSON.parse(data);
        // Validate parsed data structure
        if (parsed && typeof parsed === 'object' && parsed.loginUsername) {
          // DEBUG: Log retrieved credentials
          logger.log('🔐 [DEBUG] Credentials retrieved from storage:');
          logger.log(`  - Username: ${parsed.loginUsername}`);
          logger.log(`  - Full Name: ${parsed.fullName || 'N/A'}`);
          logger.log(`  - Email: ${parsed.email || 'N/A'}`);
          logger.log(`  - Account ID: ${parsed.accid || 'N/A'}`);
          logger.log(`  - Token present: ${!!parsed.token} (length: ${parsed.token?.length || 0})`);
          logger.log('✅ Credentials retrieved successfully');
          return parsed as ProofArriveUser;
        }
        logger.warn('Invalid credentials format in storage');
        return null;
      } catch (parseError) {
        logger.error('Failed to parse stored credentials:', parseErrorMessage(parseError));
        // Clear corrupted data
        try {
          await Storage.removeItem({ key: CREDENTIALS_KEY });
        } catch {
          // Ignore cleanup errors
        }
        return null;
      }
    } catch (error) {
      logger.error('❌ Error retrieving credentials:', parseErrorMessage(error));
      return null;
    }
  }

  // Save auth token separately (for quick access)
  static async saveAuthToken(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }

    try {
      await Storage.setItem({
        key: AUTH_TOKEN_KEY,
        value: token,
      });
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      logger.error('❌ Error saving auth token:', errorMessage);
      throw new Error(`Failed to save auth token: ${errorMessage}`);
    }
  }

  // Get auth token
  static async getAuthToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem({ key: AUTH_TOKEN_KEY });
      return token;
    } catch (error) {
      logger.error('❌ Error retrieving auth token:', parseErrorMessage(error));
      return null;
    }
  }

  // Clear all authentication data
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        Storage.removeItem({ key: AUTH_TOKEN_KEY }).catch(() => {}),
        Storage.removeItem({ key: USER_DATA_KEY }).catch(() => {}),
        Storage.removeItem({ key: CREDENTIALS_KEY }).catch(() => {}),
      ]);
      logger.log('🧹 All auth data cleared successfully');
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      logger.error('❌ Error clearing auth data:', errorMessage);
      // Don't throw - clearing should be best effort
    }
  }

  // Check if user is stored
  static async hasStoredCredentials(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      return !!credentials;
    } catch {
      return false;
    }
  }
}

