# Environment Switching Guide

## 📱 How to Specify Environment When Launching

### Current Setup

Your project uses:
- **`.env`** → Development environment (LAN IP: `http://192.168.1.16:8080`)
- **`.env.production`** → Production environment (Contabo: `http://84.46.254.94:8080`)

The system automatically reads `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ENV` from these files.

---

## 🚀 Quick Start Commands

### Development Mode (Default)
```bash
npm start
```
Uses `.env` file automatically.

### Production Mode
For now, **manually edit `.env`** and change:
```env
EXPO_PUBLIC_API_URL=http://84.46.254.94:8080
EXPO_PUBLIC_ENV=production
```

Then run:
```bash
npm start
```

**Remember to change it back** to dev settings after testing!

---

## 🔄 Alternative: Manual File Swapping

### Switch to Production:
```powershell
# Windows PowerShell
Move-Item .env .env.backup
Move-Item .env.production .env
npm start
```

### Switch Back to Development:
```powershell
# Windows PowerShell
Move-Item .env .env.production
Move-Item .env.backup .env
npm start
```

---

## ✅ Recommended Workflow

### For Daily Development:
1. Keep `.env` with development settings (LAN IP)
2. Run `npm start` as usual
3. Test on physical device via Expo Go

### Before Production Deployment:
1. **Option A**: Build with production .env
   ```bash
   # Temporarily use production settings
   eas build --platform android --profile production
   ```

2. **Option B**: Use environment variables in build config
   - Add to `app.json` or `eas.json`
   - Let EAS Build handle the environment

---

## 📝 Current Environment Files

### `.env` (Development)
```env
# Development Environment Configuration
# API Configuration for Expo Go on Physical Device
# Use your computer's LAN IP address so physical devices can connect
EXPO_PUBLIC_API_URL=http://192.168.1.16:8080
EXPO_PUBLIC_ENV=development
```

### `.env.production` (Production)
```env
# Production Environment Configuration
EXPO_PUBLIC_API_URL=http://84.46.254.94:8080
EXPO_PUBLIC_ENV=production
```

---

## 🛠️ How the System Works

1. **At startup**, the app reads `process.env.EXPO_PUBLIC_API_URL`
2. **Networking layer** (`app/networking/config.ts`) uses this value
3. **All API calls** automatically go to the configured URL
4. **No code changes needed** - just update `.env`!

---

## 🎯 Testing Environment Switching

### Verify Which Environment You're Using:

Check the console logs when app starts:
```
[NETWORKING] Environment: development, Base URL: http://192.168.1.16:8080
```
or
```
[NETWORKING] Environment: production, Base URL: http://84.46.254.94:8080
```

### Test Production URL Locally:

1. Edit `.env` to use production URL
2. Restart dev server: `npm start`
3. Test all features
4. **Change back to dev URL** when done

---

## ⚠️ Important Notes

1. **Never commit** sensitive production URLs to Git if they contain secrets
2. **Always test** with production URL before deploying
3. **LAN IP changes** - Update `.env` if your computer's IP changes
4. **Expo Go limitation** - Needs accessible URL (LAN for dev, public for prod testing)

---

## 🆘 Troubleshooting

**Problem**: "Network request failed" on physical device

**Solution**: 
- Make sure phone and computer on same WiFi
- Check firewall isn't blocking port 8080
- Verify LAN IP is current: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

**Problem**: Environment not changing

**Solution**:
- Restart Expo dev server completely (`Ctrl+C` then `npm start`)
- Clear Expo cache: `npx expo start -c`

---

## 🔮 Future Enhancement

Consider using **EAS Build** profiles for automatic environment management:

```json
// eas.json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://192.168.1.16:8080",
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://84.46.254.94:8080",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  }
}
```
