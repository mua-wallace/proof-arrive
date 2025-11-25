import { QRCodeData } from '@/types/arrival';

export function parseQRCodeData(data: string): QRCodeData {
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(data);
    
    if (parsed.vehicleId) {
      return {
        vehicleId: parsed.vehicleId,
        centerId: parsed.centerId,
        vehicleGPSDevice: parsed.vehicleGPSDevice,
      };
    }
    
    throw new Error('Invalid QR code format: missing vehicleId');
  } catch (error) {
    // If JSON parsing fails, try simple format: vehicleId|centerId|gpsDevice
    const parts = data.split('|');
    
    if (parts.length >= 1 && parts[0]) {
      return {
        vehicleId: parts[0],
        centerId: parts[1],
        vehicleGPSDevice: parts[2],
      };
    }
    
    throw new Error('Invalid QR code format');
  }
}

