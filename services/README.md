# Authentication Service

This directory contains the authentication system for ProofArrive, following a modular and clean architecture.

## Structure

```text
services/
├── api-client.ts          # HTTP client for API requests
├── auth-service.ts        # Main authentication service (login, logout, verification)
├── auth-storage.ts        # Storage service for credentials
└── storage-adapter.ts     # Simple AsyncStorage adapter
```

## Usage

### Login

```typescript
import { AuthService } from '@/services/auth-service';

const user = await AuthService.login({
  username: 'user@example.com',
  password: 'password123'
});
```

### Logout

```typescript
import { AuthService } from '@/services/auth-service';

await AuthService.logout();
```

### Check Stored Credentials

```typescript
import { AuthService } from '@/services/auth-service';

// Verify stored credentials on app start
const user = await AuthService.verifyStoredCredentials();
if (user) {
  // User is logged in
}
```

### Check if User Has Stored Auth

```typescript
import { AuthService } from '@/services/auth-service';

const hasAuth = await AuthService.hasStoredAuth();
```

## Configuration

The API base URL can be configured in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-url.com"
    }
  }
}
```

Or it defaults to `https://malambi.net/Helper`.

## API Endpoints

- **Login**: `POST /?sys=CheckAuth` with form data
- **Logout**: `POST /?sys=DoLogout` with form data
- **Verify Session**: `GET /?sys=GetLS` with token parameters

## Storage

Credentials are stored securely using `@react-native-async-storage/async-storage` with the following keys:

- `proofarrive_credentials` - Full user object
- `proofarrive_auth_token` - Auth token (for quick access)
- `proofarrive_user_data` - Additional user data
