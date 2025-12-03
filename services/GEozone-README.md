# Geozone System Documentation

## Overview

The geozone system allows the app to:
1. Fetch geozones attached to the logged-in user's account from the backend API
2. Store them locally in SQLite database
3. Use device location (lat/lng) to determine if the agent is in a zone
4. Extract the zone ID and center ID when the agent is found in a zone

## Architecture

### Components

1. **Types** (`types/geozone.ts`)
   - `ParsedZone`: Structured zone data with polygon boundaries
   - `RawZoneData`: Raw zone data from API
   - `CoordinatePair`: [latitude, longitude] tuple
   - `CurrentLocation`: Current device location
   - `ZoneMatchResult`: Result of zone matching

2. **Location Permissions** (`hooks/use-location-permissions.ts`)
   - React hook for managing location permissions
   - Handles permission requests and status checking
   - Provides user-friendly permission dialogs

3. **Geozone API** (`services/geozone-api.ts`)
   - Fetches zones from backend API using authenticated requests
   - Builds zone URLs with authentication parameters

4. **Zone Parser** (`utils/zone-parser.ts`)
   - Parses raw zone data from API into structured format
   - Converts path strings to coordinate pairs
   - Calculates bounding boxes for zones

5. **Zone Matcher** (`utils/zone-matcher.ts`)
   - Implements point-in-polygon algorithm
   - Finds which zone contains a given location
   - Uses bounding box optimization for performance

6. **Geozone Storage** (`services/geozone-storage.ts`)
   - Manages SQLite database table for geozones
   - Provides CRUD operations for zones

7. **Geozone Service** (`services/geozone-service.ts`)
   - Main service for geozone operations
   - Fetches, parses, and stores zones
   - Finds zones for locations and extracts center IDs

8. **Location Service** (`services/location.ts`)
   - Gets current device location
   - Integrates with geozone matching
   - Returns location with center ID if found in a zone

## Usage

### 1. Initialize Geozones (Automatic)

Geozones are automatically fetched and stored after successful login:

```typescript
// This happens automatically in app/login.tsx and app/_layout.tsx
import { initializeGeozones } from '@/services/geozone-service';

// After login, geozones are fetched
await initializeGeozones();
```

### 2. Get Current Location with Zone

To get the current location and determine which zone/center the agent is in:

```typescript
import { getCurrentLocationWithZone } from '@/services/location';

try {
  const { location, centerId } = await getCurrentLocationWithZone();
  
  if (centerId) {
    console.log('Agent is in center:', centerId);
    console.log('Location:', location.latitude, location.longitude);
  } else {
    console.log('Agent is not in any zone');
  }
} catch (error) {
  // Handle location permission or other errors
  console.error('Error getting location:', error);
}
```

### 3. Request Location Permissions

To request location permissions before getting location:

```typescript
import { useLocationPermissions } from '@/hooks/use-location-permissions';

function MyComponent() {
  const {
    foregroundPermission,
    requestForegroundPermission,
    showPermissionRationale,
  } = useLocationPermissions();

  const handleRequestPermission = async () => {
    const granted = await requestForegroundPermission();
    if (granted) {
      // Permission granted, proceed with location operations
    }
  };

  // ...
}
```

### 4. Find Zone for Location

To find which zone contains a specific location:

```typescript
import { findZoneForLocation } from '@/services/geozone-service';

const location = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  timestamp: Date.now(),
};

const result = await findZoneForLocation(location);

if (result.found && result.zone) {
  console.log('Found zone:', result.zone.name);
  console.log('Center ID:', result.zone.centerId);
} else {
  console.log('Location is not in any zone');
}
```

### 5. Get Center ID from Location

To get just the center ID for a location:

```typescript
import { getCenterIdFromLocation } from '@/services/geozone-service';

const location = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  timestamp: Date.now(),
};

const centerId = await getCenterIdFromLocation(location);

if (centerId) {
  console.log('Center ID:', centerId);
  // Use centerId for vehicle operations
} else {
  console.log('No center found for this location');
}
```

### 6. Manual Zone Management

To manually fetch and save zones:

```typescript
import { fetchAndSaveZones, getStoredZones } from '@/services/geozone-service';

// Fetch zones from API and save to database
const zones = await fetchAndSaveZones();

// Get all stored zones
const storedZones = await getStoredZones();
console.log(`Stored ${storedZones.length} zones`);
```

## Database Schema

The geozones table structure:

```sql
CREATE TABLE geozones (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  speedLimit REAL DEFAULT 0,
  minLat REAL NOT NULL,
  maxLat REAL NOT NULL,
  minLng REAL NOT NULL,
  maxLng REAL NOT NULL,
  path TEXT NOT NULL,  -- JSON string of CoordinatePair[]
  centerId TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

## API Integration

The geozone API uses the following endpoint:

```
GET https://malambi.net/Helper?sys=MapVars&task=zone&edit=true&...
```

With authentication parameters:
- `acc_token`: User's authentication token
- `acc_id`: User's account ID
- `acc_sid`: User's sub-account ID

## Zone Data Format

Zones are stored with polygon paths in the format:
```
"lat1:lng1!lat2:lng2!lat3:lng3!..."
```

This is parsed into an array of `CoordinatePair` arrays for point-in-polygon calculations.

## Error Handling

All services use the error handling utilities:
- `NetworkError`: For network-related errors
- `AuthError`: For authentication errors
- Custom error messages with user-friendly descriptions

Errors are logged using the logger utility and don't crash the app.

## Performance Considerations

1. **Bounding Box Optimization**: Before checking point-in-polygon, zones are filtered by bounding box for faster matching
2. **Database Storage**: Zones are stored locally to avoid repeated API calls
3. **Transaction Batching**: Zone saves use database transactions for better performance

## Future Enhancements

- Zone caching with expiration
- Background location updates
- Zone change notifications
- Multiple zone support (agent in multiple zones)
- Zone visualization on map







