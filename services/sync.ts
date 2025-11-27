import * as Network from 'expo-network';
import { getUnsyncedArrivals, markAsSynced } from './storage';
import { VehicleArrivalRecord } from '@/types/arrival';

// This is a placeholder for the actual API endpoint
// In production, replace this with your backend API URL
const API_BASE_URL = 'https://api.proofarrive.com'; // Replace with actual API

export async function syncArrivals(): Promise<number> {
  const networkState = await Network.getNetworkStateAsync();
  
  if (!networkState.isConnected || !networkState.isInternetReachable) {
    return 0; // No sync possible when offline
  }

  const unsyncedArrivals = await getUnsyncedArrivals();
  
  if (unsyncedArrivals.length === 0) {
    return 0; // Nothing to sync
  }

  let syncedCount = 0;

  for (const arrival of unsyncedArrivals) {
    try {
      // Convert database record to API format
      const record: VehicleArrivalRecord = {
        id: arrival.id,
        vehicleId: arrival.vehicleId,
        centerId: arrival.centerId,
        agentId: arrival.agentId || undefined,
        operationType: arrival.operationType as 'loading' | 'unloading',
        scanTimestamp: arrival.scanTimestamp,
        agentLatitude: arrival.agentLatitude,
        agentLongitude: arrival.agentLongitude,
        agentAccuracy: arrival.agentAccuracy || undefined,
        vehicleGPSDevice: arrival.vehicleGPSDevice || undefined,
        status: (arrival.status || 'arrived') as 'arrived' | 'in_processing' | 'ready_to_exit' | 'exited',
        processingStartTime: arrival.processingStartTime || undefined,
        processingEndTime: arrival.processingEndTime || undefined,
        exitType: arrival.exitType as 'loaded' | 'unloaded' | undefined,
        exitDestination: arrival.exitDestination || undefined,
        exitTime: arrival.exitTime || undefined,
        exitAgentLatitude: arrival.exitAgentLatitude || undefined,
        exitAgentLongitude: arrival.exitAgentLongitude || undefined,
        exitAgentAccuracy: arrival.exitAgentAccuracy || undefined,
        exitVehicleGPSDevice: arrival.exitVehicleGPSDevice || undefined,
        synced: false,
        createdAt: arrival.createdAt,
      };

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/api/arrivals`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(record),
      // });
      
      // if (response.ok) {
      //   await markAsSynced(arrival.id);
      //   syncedCount++;
      // }

      // For now, simulate successful sync
      // In production, uncomment the API call above and remove this
      await markAsSynced(arrival.id);
      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync arrival ${arrival.id}:`, error);
      // Continue with next record
    }
  }

  return syncedCount;
}

export async function checkAndSync(): Promise<void> {
  try {
    const syncedCount = await syncArrivals();
    if (syncedCount > 0) {
      console.log(`Synced ${syncedCount} arrival record(s)`);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

