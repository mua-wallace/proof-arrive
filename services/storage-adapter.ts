/**
 * Simple storage adapter for React Native
 * Uses @react-native-async-storage/async-storage
 */

import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async getItem({ key }: { key: string }): Promise<string | null> {
    if (!key || typeof key !== 'string') {
      logger.error('[Storage.getItem] Invalid key provided');
      return null;
    }

    try {
      const value = await AsyncStorage.getItem(key);
      // DEBUG: Log retrieved data from local storage
      logger.log(`📖 [LocalStorage DEBUG] Retrieved data for key: ${key}`);
      if (value) {
        logger.log(`  - Value length: ${value.length} characters`);
        // Try to parse as JSON to show structure
        try {
          const parsed = JSON.parse(value);
          logger.log(`  - Value type: JSON object`);
          logger.log(`  - Value keys: ${Object.keys(parsed).join(', ')}`);
          logger.log(`  - Full value: ${JSON.stringify(parsed, null, 2)}`);
        } catch {
          logger.log(`  - Value type: Plain string`);
          // Don't log full value if it's sensitive (like tokens)
          if (key.includes('token')) {
            logger.log(`  - Value preview: ${value.substring(0, 20)}...`);
          } else {
            logger.log(`  - Value: ${value}`);
          }
        }
      } else {
        logger.log(`  - Value: null (key not found or empty)`);
      }
      return value;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error('[Storage.getItem] error:', error.message);
      return null;
    }
  },

  async setItem({ key, value }: { key: string; value: string }): Promise<void> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided');
    }

    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }

    try {
      // DEBUG: Log data being saved to local storage
      logger.log(`💾 [LocalStorage DEBUG] Saving data to local storage:`);
      logger.log(`  - Key: ${key}`);
      logger.log(`  - Value length: ${value.length} characters`);
      // Try to parse as JSON to show structure
      try {
        const parsed = JSON.parse(value);
        logger.log(`  - Value type: JSON object`);
        logger.log(`  - Value keys: ${Object.keys(parsed).join(', ')}`);
        // For sensitive data, only show structure
        if (key.includes('token') || key.includes('credential') || key.includes('password')) {
          logger.log(`  - Value structure: ${JSON.stringify(Object.keys(parsed).reduce((acc, k) => {
            acc[k] = typeof parsed[k] === 'string' && parsed[k].length > 20 
              ? `${parsed[k].substring(0, 20)}...` 
              : parsed[k];
            return acc;
          }, {} as any), null, 2)}`);
        } else {
          logger.log(`  - Full value: ${JSON.stringify(parsed, null, 2)}`);
        }
      } catch {
        logger.log(`  - Value type: Plain string`);
        // Don't log full value if it's sensitive
        if (key.includes('token') || key.includes('credential') || key.includes('password')) {
          logger.log(`  - Value preview: ${value.substring(0, 20)}...`);
        } else {
          logger.log(`  - Value: ${value}`);
        }
      }
      
      await AsyncStorage.setItem(key, value);
      logger.log(`✅ [LocalStorage DEBUG] Data saved successfully for key: ${key}`);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error('[Storage.setItem] error:', error.message);
      throw new Error(`Failed to save to storage: ${error.message}`);
    }
  },

  async removeItem({ key }: { key: string }): Promise<void> {
    if (!key || typeof key !== 'string') {
      logger.warn('[Storage.removeItem] Invalid key provided');
      return;
    }

    try {
      logger.log(`🗑️  [LocalStorage DEBUG] Removing data from local storage: ${key}`);
      await AsyncStorage.removeItem(key);
      logger.log(`✅ [LocalStorage DEBUG] Data removed successfully for key: ${key}`);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error('[Storage.removeItem] error:', error.message);
      // Don't throw - removal should be best effort
    }
  },
};

export default Storage;

