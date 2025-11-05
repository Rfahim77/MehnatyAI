# Apple Store Publication Guide for Mehnaty AI

## Overview
This guide will help you publish **مهنتي | Mehnaty AI** to the Apple App Store as a Progressive Web App (PWA).

## Current Status ✅
- ✅ Service Worker implemented
- ✅ PWA Manifest configured
- ✅ iOS meta tags added
- ✅ App icons (192x192, 512x512, 180x180)
- ✅ RTL support configured
- ✅ Arabic-first interface

## Required: Generate 1024x1024 App Icon
Apple requires a 1024x1024px app icon for App Store submissions.

### Using your logo (`attached_assets/logo.png`):
1. Open your logo in an image editor (Photoshop, Figma, or online tool)
2. Resize to 1024x1024px (keeping the aspect ratio centered on transparent/white background)
3. Export as PNG
4. Save as `public/assets/app-icon-1024.png`

## Step 1: Deploy Your App on Replit

1. **Publish on Replit**:
   - Click the "Publish" button in Replit
   - Your app will get a live URL like: `https://mehnaty-ai.replit.app`
   - This URL will be your PWA's production home

2. **Test the PWA**:
   - Visit your deployed URL on an iPhone/iPad
   - Tap Share → Add to Home Screen
   - Verify the app opens in standalone mode

## Step 2: Wrap PWA as Native iOS App

Apple doesn't allow direct PWA submission to the App Store. You need to wrap it as a native app.

### Option A: Using Capacitor (Recommended)

Capacitor wraps your PWA as a native iOS app:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Initialize Capacitor
npx cap init "مهنتي" "com.mehnaty.ai" --web-dir=dist/public

# Add iOS platform
npx cap add ios

# Copy web assets
npm run build
npx cap copy

# Open in Xcode
npx cap open ios
```

### Option B: Using PWABuilder

1. Visit [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your deployed Replit URL
3. Click "Package for iOS"
4. Download the generated iOS project
5. Open in Xcode

### Option C: Manual Xcode Project

Create a native iOS app with a WKWebView pointing to your Replit URL.

## Step 3: Configure iOS App in Xcode

Once you have the iOS project:

1. **Open in Xcode** (requires macOS)
2. **Set App Information**:
   - Display Name: `مهنتي`
   - Bundle ID: `com.mehnaty.ai` (or your choice)
   - Version: `1.0.0`
   
3. **Add App Icons**:
   - Use the 1024x1024 icon you generated
   - Xcode will auto-generate all required sizes
   
4. **Configure Capabilities**:
   - Enable "Associated Domains" if using Universal Links
   - Enable "Background Modes" if needed

5. **Build & Test**:
   - Select a simulator or connected iPhone
   - Click "Run" to test

## Step 4: Prepare for App Store Submission

### Apple Developer Account
- Enroll in Apple Developer Program ($99/year)
- URL: https://developer.apple.com/programs/

### App Store Connect
1. Create new app in App Store Connect
2. Fill in metadata:
   - **App Name**: مهنتي | Mehnaty AI
   - **Subtitle**: تطوير مهني بالذكاء الاصطناعي
   - **Description**: Use your Arabic copy:
     ```
     تطبيق تطوير مهني مدعوم بالذكاء الاصطناعي
     
     تحليل فوري، توصيات عملية، وتصدير سيرة عربية جاهزة خلال دقائق
     
     الميزات:
     • مراجعة شاملة للسيرة الذاتية
     • استشارات مهنية مخصصة
     • التخطيط المهني للمستقبل
     • مواءمة السيرة مع الوظائف
     • إعداد ذكي للمقابلات
     • إنشاء خطابات التقديم
     • تحليل فجوات المهارات
     • بناء السيرة من الصفر
     
     مجاني بالكامل. دعم كامل للغة العربية.
     ```
   - **Keywords**: سيرة ذاتية, مهنة, وظيفة, ذكاء اصطناعي, عمل, توظيف
   - **Category**: Productivity or Business
   - **Screenshots**: Take screenshots on iPhone (required sizes: 6.7", 5.5")

### Privacy & Data
- Create Privacy Policy URL
- Declare data collection practices
- Enable Sign in with Apple (you're using Replit Auth)

## Step 5: Submit for Review

1. **Archive the App** in Xcode:
   - Product → Archive
   - Upload to App Store Connect

2. **Submit for Review**:
   - Fill in all required fields
   - Submit

3. **Review Time**: Typically 24-48 hours

## Important Notes

### RTL & Arabic Support
✅ Your app already has:
- `dir="rtl"` in HTML
- `lang="ar"` in manifest
- IBM Plex Sans Arabic font
- Proper Arabic spacing

### Free App Declaration
- Mark as "Free" in App Store Connect
- No in-app purchases
- No ads

### Replit Auth Integration
- Your app uses Replit Auth (Google, GitHub, Apple login)
- This is acceptable for App Store
- Make sure to enable "Sign in with Apple" capability

## Troubleshooting

### Service Worker Issues
- Service worker is at `/service-worker.js`
- Registered in `index.html`
- Test at: https://your-url.replit.app/service-worker.js

### Icon Issues
- Ensure 1024x1024 icon has no transparency for App Store
- Use PNG format
- Remove alpha channel if required

### Build Errors
- Make sure you run `npm run build` before `npx cap copy`
- Check that `dist/public` contains built files

## Resources

- [Apple Human Interface Guidelines (Arabic)](https://developer.apple.com/design/human-interface-guidelines/)
- [PWABuilder Documentation](https://docs.pwabuilder.com/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Next Steps

1. ✅ Service Worker - DONE
2. ⏳ Generate 1024x1024 app icon
3. ⏳ Deploy on Replit (click "Publish" button)
4. ⏳ Choose wrapping method (Capacitor recommended)
5. ⏳ Build iOS app in Xcode
6. ⏳ Submit to App Store Connect

---

**Questions?** Review this guide and the linked resources. Good luck with your App Store launch! 🚀
