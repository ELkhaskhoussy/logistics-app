# Environment Configuration

This project supports multiple environments (Development and Production).

## Environment Files

- **`.env`** - Development configuration (active by default)
- **`.env.production`** - Production configuration

## Environment Variables

### `EXPO_PUBLIC_API_URL`
The base URL for your backend API Gateway.

- **Development**: `http://192.168.1.16:8080` (your LAN IP)
- **Production**: `https://your-production-domain.com/api` (update this!)

### `EXPO_PUBLIC_ENV`
Current environment identifier.

- `development` or `production`

## Usage

### Development (Default)
```bash
npm start
```
Uses `.env` file with local API URL.

### Production Build
```bash
# Update .env.production with your production URL first!
# Then build for production
eas build --platform android --profile production
```

## Important Notes

1. **Update Production URL**: Before building for production, update `EXPO_PUBLIC_API_URL` in `.env.production` with your actual production domain.

2. **LAN IP in Development**: The development URL uses your computer's LAN IP (`192.168.1.16`) so you can test on physical devices via Expo Go.

3. **Google OAuth**: Remember to add your production redirect URI to Google Cloud Console when deploying.

## Files Using Environment Variables

- `app/services/backService.ts`
- `app/services/auth.ts`
- `app/services/apiClient.ts`
- `app/role-selection/index.tsx`
- `app/(transporter)/profile.tsx`

All API calls automatically use the configured `EXPO_PUBLIC_API_URL`.
