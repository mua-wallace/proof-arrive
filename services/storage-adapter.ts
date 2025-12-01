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
      return await AsyncStorage.getItem(key);
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
      await AsyncStorage.setItem(key, value);
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
      await AsyncStorage.removeItem(key);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error('[Storage.removeItem] error:', error.message);
      // Don't throw - removal should be best effort
    }
  },
};

export default Storage;

