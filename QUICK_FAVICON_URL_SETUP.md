# Quick Setup: Favicon & Custom URL

## ✅ What's Been Done
- All HTML files now have favicon links configured
- Ready to accept `favicon.ico` and `favicon-apple.png` files

## 🚀 Quick Steps (Next 5 Minutes)

### Step 1: Create Your Favicon (Choose One)

**Option A: Easiest - Online Tool (2 minutes)**
1. Go to https://realfavicongenerator.net/
2. Click "Select a picture"
3. Choose: `frontend/resources/techvision.png`
4. Download the favicon package
5. Extract `favicon.ico` and `favicon-apple.png` to `frontend/resources/`

**Option B: Command Line (if you have ImageMagick)**
1. Open PowerShell in `frontend/resources` folder
2. Run:
   ```bash
   magick convert techvision.png -define icon:auto-resize=256,128,96,64,48,32,16 favicon.ico
   magick convert techvision.png -resize 180x180 favicon-apple.png
   ```

**Option C: Use the Helper Script**
1. Double-click: `frontend/resources/create-favicon.bat`
2. Select option 2 for online tool link (easiest)
3. Follow the instructions

### Step 2: Test Favicon
1. Start your server: `npm start` (in backend folder)
2. Open http://localhost:3000
3. Look at browser tab - should see your logo!
4. If not showing: Hard refresh with **Ctrl+Shift+R**

---

## 🌐 Custom URL with ngrok

### Free Option (Changes Each Restart)
```bash
# In new PowerShell window
ngrok http 3000
```
Gives temporary URL like: `https://a1b2c3d4.ngrok.io`

### Paid Option (Permanent URL - Recommended)
```bash
# Sign up for ngrok Pro ($5/month)
# Get your auth token from https://dashboard.ngrok.com/auth

# Configure once:
ngrok authtoken YOUR_AUTH_TOKEN

# Then every time:
ngrok http 3000 --subdomain=teacher-portal-app
```
Gives permanent URL: `https://teacher-portal-app.ngrok.io`

### Free Alternative (No Cost, Permanent)
```bash
npm install -g localtunnel

# Use with permanent subdomain
lt --port 3000 --subdomain teacher-portal
```
Gives URL: `https://teacher-portal.loca.lt`

---

## 📋 Complete Checklist

- [ ] **Favicon: Downloaded favicon.ico and favicon-apple.png**
- [ ] **Favicon: Placed in `frontend/resources/`**
- [ ] **Favicon: Tested (see logo in browser tab)**
- [ ] **URL: Running ngrok with `ngrok http 3000`**
- [ ] **Sharing: Have the ngrok URL ready to share**

---

## 🎯 What You'll Have After This

**Before:**
- URL: Random like `https://a1b2c3d4.ngrok.io` (changes each time)
- Favicon: ❌ No logo in browser tab

**After:**
- URL: Permanent like `https://teacher-portal-app.ngrok.io` (stays same)
- Favicon: ✅ Logo visible in browser tab
- Professional appearance for sharing!

---

**Total Time: ~10 minutes**

### Still Need Help?
See complete guide: [URL_AND_FAVICON_GUIDE.md](URL_AND_FAVICON_GUIDE.md)
