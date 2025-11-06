# Mehnaty AI - Deployment Guide
## مهنتي | دليل النشر

This guide explains how to deploy Mehnaty AI as both a web app and to the Apple App Store.

---

## 📱 Part 1: Deploy Web App on Replit (Production)

### Step 1: Publish on Replit
1. Click the **"Publish"** button in your Replit workspace (top-right corner)
2. Choose **"Autoscale Deployment"** (recommended for web apps with variable traffic)
   - Autoscaling automatically handles traffic spikes
   - Pay only for what you use
   - Perfect for production web apps

3. Configure deployment settings:
   - **Machine Power**: Start with "Small" (you can scale up later)
   - **Max Machines**: Set to 3-5 for cost control
   - **Environment Variables**: All secrets (DATABASE_URL, SESSION_SECRET, etc.) are automatically included
   - **Custom Domain** (optional): Add your own domain if you have one

4. Click **"Publish"** and wait for deployment
5. Your app will be live at: `https://your-repl-name.replit.app`

### Step 2: Test Production Deployment
1. Visit your deployed URL
2. Test the landing page loads correctly
3. Click "ابدأ الآن" to test Replit Auth login
4. Try one of the career pathways
5. Verify logout works

---

## 🍎 Part 2: Submit to Apple App Store as PWA

### Prerequisites
- **Apple Developer Account** ($99/year) - Required for App Store submission
- **Mac computer** - Required for Xcode and App Store submission
- **Your deployed Replit URL** from Part 1

### Option A: Use PWABuilder (Easiest Method)

1. **Go to PWABuilder**: https://www.pwabuilder.com/

2. **Enter Your URL**: 
   - Paste your Replit production URL: `https://your-repl-name.replit.app`
   - Click "Start"

3. **PWA Analysis**:
   - PWABuilder will analyze your app
   - Check that all requirements are met (you should see green checkmarks)
   - Your manifest.json and service worker are already configured ✅

4. **Generate iOS Package**:
   - Click "Package for Stores"
   - Select **"iOS"**
   - Download the generated Xcode project

5. **Open in Xcode**:
   - Extract the downloaded ZIP file
   - Open the `.xcodeproj` file in Xcode
   - Sign with your Apple Developer account

6. **Submit to App Store**:
   - In Xcode: Product → Archive
   - Upload to App Store Connect
   - Fill in app metadata (name, description, screenshots)
   - Submit for review

### Option B: Manual iOS App Wrapper

If you prefer more control, you can create a native iOS wrapper:

1. **Install Xcode** from the Mac App Store

2. **Create New iOS Project**:
   - Open Xcode → Create new project
   - Choose "App" template
   - Name it "Mehnaty AI" / "مهنتي"
   - Set Team to your Apple Developer account

3. **Add WKWebView**:
   ```swift
   import UIKit
   import WebKit

   class ViewController: UIViewController, WKNavigationDelegate {
       var webView: WKWebView!
       
       override func loadView() {
           webView = WKWebView()
           webView.navigationDelegate = self
           view = webView
       }
       
       override func viewDidLoad() {
           super.viewDidLoad()
           let url = URL(string: "https://your-repl-name.replit.app")!
           webView.load(URLRequest(url: url))
       }
   }
   ```

4. **Configure Info.plist**:
   - Add "NSAppTransportSecurity" → "NSAllowsArbitraryLoads" = YES
   - This allows your app to connect to your Replit server

5. **Add App Icons**:
   - Use your logo at `client/public/icons/icon-512x512.png`
   - Generate all required sizes using: https://appicon.co/
   - Drag into Assets.xcassets

6. **Archive and Submit**:
   - Product → Archive
   - Upload to App Store Connect
   - Complete app metadata
   - Submit for review

---

## 📋 App Store Submission Checklist

### App Information
- **App Name**: Mehnaty AI | مهنتي
- **Subtitle**: Your AI Career Assistant
- **Primary Language**: Arabic
- **Category**: Business / Productivity
- **Age Rating**: 4+ (no objectionable content)

### App Description (Arabic)
```
مهنتي هو مساعدك الذكي في التخطيط المهني والتوظيف. يوفر لك 8 مسارات مهنية متخصصة:

• مراجعة السيرة الذاتية
• التخطيط المهني
• تخصيص السيرة حسب الوظيفة
• التحضير للمقابلات
• كتابة خطاب التغطية
• تحليل فجوة المهارات
• بناء السيرة من الصفر
• المحادثة المهنية

الميزات:
✓ مجاني 100% - بدون حدود استخدام
✓ دعم كامل للغة العربية
✓ ذكاء اصطناعي متقدم
✓ واجهة ثنائية اللغة (عربي/إنجليزي)
✓ تصميم احترافي وسهل الاستخدام
```

### App Description (English)
```
Mehnaty AI is your intelligent career planning and job search assistant. It provides 8 specialized career pathways:

• Resume Review & Analysis
• Career Chat & Guidance
• Future Career Planning
• Tailor Resume to Job Descriptions
• Interview Preparation
• Cover Letter Writing
• Skills Gap Analysis
• Build Resume from Scratch

Features:
✓ 100% FREE - No usage limits
✓ Full Arabic language support
✓ Advanced AI-powered guidance
✓ Bilingual interface (Arabic/English)
✓ Professional and easy to use
```

### Keywords
```
career, resume, job, مهنتي, سيرة ذاتية, وظيفة, توظيف, مقابلة, AI, interview
```

### Screenshots Required
You need 2 sets of screenshots:
1. **6.5" iPhone** (iPhone 15 Pro Max): 1290 x 2796 pixels
2. **5.5" iPhone** (iPhone 8 Plus): 1242 x 2208 pixels

Minimum 3 screenshots showing:
- Landing page with logo
- Career pathway selection
- Chat interface with AI responses
- Resume review results
- Arabic language support

### Privacy Policy
Your app needs a privacy policy URL. Create a simple page explaining:
- What data you collect (user email, resume data)
- How you use it (AI analysis, career guidance)
- Data security (PostgreSQL storage, encryption)
- User rights (can delete account/data)

---

## 🔧 Technical Notes

### PWA Features Already Implemented ✅
- **Manifest.json**: Configured with Arabic metadata, RTL support, theme colors
- **Service Worker**: Offline support, caching strategy
- **Icons**: 192x192, 512x512 (maskable)
- **Apple Meta Tags**: iOS-specific tags for status bar, app title
- **Installable**: Works as "Add to Home Screen" on iOS Safari

### Recommended: Create 1024x1024 Icon
For the best App Store experience, create a 1024x1024 version of your logo:
```bash
# If you have ImageMagick installed:
convert client/public/icons/icon-512x512.png -resize 1024x1024 client/public/icons/icon-1024x1024.png
```

### Testing PWA on iOS
1. Open Safari on iPhone
2. Navigate to your Replit URL
3. Tap Share button → "Add to Home Screen"
4. The app should install with your logo and name "مهنتي"
5. Open from home screen - should feel like a native app

---

## 🚀 Next Steps

### For Web Deployment:
1. ✅ Click "Publish" in Replit
2. ✅ Choose Autoscale deployment
3. ✅ Test your production URL
4. ✅ Share the URL with users

### For App Store:
1. ⏳ Sign up for Apple Developer Program ($99/year)
2. ⏳ Use PWABuilder.com to generate iOS package
3. ⏳ Submit to App Store Connect
4. ⏳ Wait 2-7 days for Apple review
5. ✅ App goes live on App Store!

---

## 💡 Tips for Success

### Apple Review Process
- **Be Patient**: Reviews take 1-7 days typically
- **Be Honest**: Clearly explain your app's purpose
- **Test Thoroughly**: Apple will test your app, so make sure everything works
- **Arabic Support**: Highlight this as a feature - apps with good localization are favored

### Marketing Your App
- **Social Media**: Share on LinkedIn, Twitter with Arabic hashtags
- **Local Communities**: Post in MENA tech/career groups
- **Word of Mouth**: Free + Arabic support = strong value proposition
- **App Store Optimization**: Use all 100 characters in your app name/subtitle

---

## 📞 Support

If you encounter issues during deployment:
1. **Replit Deployment**: Check Replit docs or support
2. **App Store Submission**: Review Apple's App Store Guidelines
3. **PWA Issues**: Test on https://www.pwabuilder.com/

Good luck with your launch! 🎉
حظاً موفقاً! 🚀
