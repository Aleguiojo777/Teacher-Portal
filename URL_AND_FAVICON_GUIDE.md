# Browser Logo & URL Customization Guide

## Part 1: Adding Favicon (Browser Tab Logo)

### What is a Favicon?
A favicon is the small icon displayed in the browser tab, address bar, and bookmarks. It appears next to your page title.

### Current Setup
All HTML files have been updated with favicon links:
```html
<link rel="icon" type="image/x-icon" href="resources/favicon.ico">
<link rel="apple-touch-icon" href="resources/favicon-apple.png">
```

### Steps to Create Your Favicon

#### Option 1: Using Online Favicon Generator (Easiest)
1. Visit https://favicon-generator.org/ or https://realfavicongenerator.net/
2. Upload your logo image (`resources/transparentlogo.png` or `resources/techvision.png`)
3. Customize size and format
4. Download the favicon files:
   - `favicon.ico` (main favicon)
   - `favicon-apple.png` (Apple touch icon for iOS)
5. Place files in `frontend/resources/` folder

#### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if you don't have it
# Windows: Download from https://imagemagick.org/script/download.php-windows.php

# Convert PNG to ICO
magick convert resources/techvision.png -define icon:auto-resize=256,128,96,64,48,32,16 resources/favicon.ico

# Create Apple touch icon
magick convert resources/techvision.png -resize 180x180 resources/favicon-apple.png
```

#### Option 3: Using Python (If you have Python installed)
```python
from PIL import Image

# Open logo
img = Image.open('frontend/resources/techvision.png')

# Create favicon.ico
img_resized = img.resize((32, 32), Image.Resampling.LANCZOS)
img_resized.save('frontend/resources/favicon.ico')

# Create apple touch icon
img_apple = img.resize((180, 180), Image.Resampling.LANCZOS)
img_apple.save('frontend/resources/favicon-apple.png')
```

#### Option 4: Using Online Tools (Browser Based)
1. **ConvertIO**: https://convertio.co/png-ico/
   - Upload your PNG logo
   - Convert to ICO format
   - Download as `favicon.ico`

2. **CloudConvert**: https://cloudconvert.com/png-to-ico
   - Similar process, supports batch conversion

### File Structure After Setup
```
frontend/
├── resources/
│   ├── techvision.png
│   ├── transparentlogo.png
│   ├── favicon.ico              ← Add this
│   └── favicon-apple.png        ← Add this
├── login.html
├── portal.html
├── attendance.html
├── manage.html
├── attendance-report.html
├── user-management.html
└── ...
```

### Testing Favicon
1. Start your server: `npm start` in backend folder
2. Open http://localhost:3000
3. Check the browser tab - you should see the logo
4. Note: Browser caches favicons, so hard refresh (Ctrl+Shift+R) if not showing

---

## Part 2: Custom URL with ngrok

### Current Situation
- **Free ngrok**: Random subdomain changes every time you restart
  - Example: `https://a1b2c3d4e5f6.ngrok.io`
  - Drawback: URL changes, hard to share consistently

### Option 1: ngrok Paid Plans (Recommended for Production)

#### ngrok Pro/Business ($5-20/month)
**Features:**
- ✅ Custom subdomains (permanent)
- ✅ Custom domains (use your own domain)
- ✅ 99.9% uptime SLA
- ✅ Reserved addresses

**Steps:**
1. Sign up for ngrok Pro: https://ngrok.com/pricing
2. Verify payment & get auth token
3. Authenticate locally:
   ```bash
   ngrok authtoken YOUR_AUTH_TOKEN
   ```
4. Use custom subdomain:
   ```bash
   ngrok http 3000 --subdomain=my-teacher-portal
   ```
   Result: `https://my-teacher-portal.ngrok.io`

5. (Optional) Use your own domain:
   ```bash
   ngrok http 3000 --domain=teacherportal.yourcompany.com
   ```
   Result: `https://teacherportal.yourcompany.com`

### Option 2: Alternative Tunneling Services (Free)

#### LocalTunnel
Simple, no registration required for basic use
```bash
# Install
npm install -g localtunnel

# Use with custom subdomain
lt --port 3000 --subdomain teacher-portal
```
Result: `https://teacher-portal.loca.lt`

#### Expose.sh
Another free option
```bash
# Use with custom subdomain
expose 3000 --subdomain teacher-portal
```

#### Cloudflare Tunnel (Recommended Free Option)
Best free alternative - very reliable
```bash
# Install Cloudflare CLI
npm install -g @cloudflare/wrangler

# Authenticate
wrangler login

# Create tunnel
wrangler tunnel create my-teacher-portal
wrangler tunnel route dns my-teacher-portal yourdomain.com
wrangler tunnel run my-teacher-portal --url http://localhost:3000
```

**Advantages:**
- Fast and reliable (Cloudflare CDN)
- Can use your own domain
- No URL changes on restart
- Free tier is generous

### Option 3: Host on a Real Server (Best for Production)

#### VPS Providers
- **DigitalOcean** - $5/month: https://www.digitalocean.com/
- **Linode** - $5/month: https://www.linode.com/
- **Heroku** - Free tier discontinued, but alternatives exist
- **Railway.app** - Free tier available: https://railway.app/
- **Render** - Free tier available: https://render.com/

**Benefits of VPS:**
- ✅ Permanent URL
- ✅ Always online (not dependent on your machine)
- ✅ Can use custom domain
- ✅ Better for sharing with stakeholders

### Option 4: HyperExpress / Self-Hosted

Set up your own domain using:
1. **Domain registrar** (GoDaddy, Namecheap, etc.) - $1-15/year
2. **VPS hosting** - $5-10/month
3. **SSL certificate** (Let's Encrypt) - Free

---

## Implementation: ngrok with Custom Subdomain

### Quick Start Guide for ngrok Pro

1. **Purchase ngrok Pro**: https://ngrok.com/pricing
2. **Get Auth Token**:
   - Log into ngrok dashboard
   - Go to "Auth" section
   - Copy your auth token

3. **Configure Locally**:
   ```bash
   # Open PowerShell/Terminal in backend folder
   ngrok authtoken YOUR_TOKEN_HERE
   ```

4. **Start Teacher Portal**:
   ```bash
   # Terminal 1 - Start backend server
   cd backend
   npm start
   
   # Terminal 2 - Start ngrok with custom subdomain
   ngrok http 3000 --subdomain=teacher-portal-app
   ```

5. **Share Your URL**:
   ```
   Public URL: https://teacher-portal-app.ngrok.io
   ```
   This URL stays the same across restarts!

### Script to Automate ngrok Startup

Create `backend/start-with-tunnel.bat` (Windows):
```batch
@echo off
REM Start server in one window
start cmd /k "npm start"

REM Start ngrok with custom subdomain
timeout /t 2 /nobreak
ngrok http 3000 --subdomain=teacher-portal-app
```

Run it:
```bash
.\start-with-tunnel.bat
```

### Update .env for Deployment

When using ngrok with custom subdomain, update `.env`:

```javascript
// For development
FRONTEND_URL=http://localhost:3000

// For ngrok deployment (with custom subdomain)
FRONTEND_URL=https://teacher-portal-app.ngrok.io

// For production
FRONTEND_URL=https://yourdomain.com
```

---

## Complete Checklist

### Favicon Setup
- [ ] Created `favicon.ico` from logo
- [ ] Created `favicon-apple.png` from logo
- [ ] Placed files in `frontend/resources/`
- [ ] Tested in browser (see URL bar and tab)
- [ ] Hard refresh if not showing (Ctrl+Shift+R)

### URL Customization
- [ ] Choose deployment method:
  - [ ] Free option: LocalTunnel / Cloudflare Tunnel
  - [ ] Paid option: ngrok Pro
  - [ ] Production: VPS hosting
- [ ] Configure selected service
- [ ] Test at new custom URL
- [ ] Update documentation for team

### Testing Custom URL
1. Start the app with custom subdomain/domain
2. Open in browser: `https://your-custom-url.com`
3. Check:
   - [ ] Favicon appears in tab
   - [ ] Login page loads
   - [ ] Can log in successfully
   - [ ] Can navigate to other pages
   - [ ] API calls work correctly

---

## Troubleshooting

### Favicon Not Showing
- **Solution 1**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- **Solution 2**: Clear browser cache
- **Solution 3**: Check file exists: `frontend/resources/favicon.ico`
- **Solution 4**: Check console for 404 errors (F12 → Console)
- **Solution 5**: Try direct URL: `http://localhost:3000/resources/favicon.ico`

### ngrok URL Keeps Changing
- **Free tier limitation**: URLs change on each restart
- **Solution**: Use ngrok Pro ($5/month) or LocalTunnel
- **Workaround**: Use QR code generator to share temp URLs

### CORS Errors with Custom URL
- **Issue**: Frontend on ngrok can't call API on localhost
- **Solution**: Update `CORS_ORIGIN` in `.env`:
  ```
  CORS_ORIGIN=https://teacher-portal-app.ngrok.io
  ```
- **Or** use wildcard (development only):
  ```
  CORS_ORIGIN=*
  ```

### API Calls Failing After Deploying
- Update `API_BASE` in frontend JavaScript
- Check `frontend/portal.js` line ~14:
  ```javascript
  window.API_BASE = 'https://teacher-portal-app.ngrok.io/api'
  ```

---

## Security Notes for Deployment

When sharing your custom URL publicly:
1. ✅ Always use HTTPS (ngrok provides this)
2. ✅ Change default admin password
3. ✅ Set secure JWT_SECRET in `.env`
4. ✅ Don't leave registration enabled
5. ✅ Consider rate limiting for API endpoints
6. ⚠️ Avoid exposing sensitive data in URL parameters

---

## Recommended Setup for Your Situation

**If Sharing Internally (Team/School):**
→ Use **ngrok Pro** ($5/month) + custom subdomain
→ Simple to set up, professional appearance

**If Testing Only:**
→ Use **LocalTunnel** (free) or **Cloudflare Tunnel** (free)
→ No cost, good for development

**If Going Live (Public Application):**
→ Use **VPS** (DigitalOcean/Render) + custom domain
→ Better performance, always online, permanent URL

---

**Need Help?**
- ngrok Docs: https://ngrok.com/docs
- LocalTunnel Docs: https://theboroer.github.io/localTunnel/
- Favicon Generator: https://realfavicongenerator.net/
