# 🚀 LocalTunnel Quick Setup (Your Choice!)

## Why LocalTunnel?
✅ **Free** - No paid subscription  
✅ **Permanent URL** - Doesn't change on restart  
✅ **Simple** - Just 2 commands  
✅ **Reliable** - Open source, widely used  

---

## Setup (2 minutes)

### Step 1: Install LocalTunnel
```bash
npm install -g localtunnel
```

### Step 2: Start Your Server
```bash
# In one terminal (from backend folder)
npm start
```

### Step 3: Create Tunnel
```bash
# In a NEW terminal (any folder)
lt --port 3000 --subdomain=teacher-portal
```

**That's it!** You get your permanent URL:
```
https://teacher-portal.loca.lt
```

---

## Using Your URL

### Share with Team
```
Send them: https://teacher-portal.loca.lt
Works immediately!
```

### Access Locally
Still works: `http://localhost:3000`

### Access via Tunnel
Works from anywhere: `https://teacher-portal.loca.lt`

---

## Windows Helper Script

Save as `start-with-tunnel.bat` in your project root:

```batch
@echo off
REM Teacher Portal - LocalTunnel Starter

echo.
echo ========================================
echo   Teacher Portal + LocalTunnel
echo ========================================
echo.
echo Starting backend server...
REM Start backend in new window
start cmd /k "cd backend && npm start"

echo Waiting for server to start...
timeout /t 3 /nobreak

echo.
echo Starting LocalTunnel...
echo Your public URL will appear below:
echo.

REM Start LocalTunnel
lt --port 3000 --subdomain=teacher-portal

pause
```

### Usage
1. Save file as `start-with-tunnel.bat` in project root
2. Double-click the file
3. Both server and tunnel start automatically!
4. Copy the URL and share

---

## Commands Reference

| What | Command |
|------|---------|
| **Install** | `npm install -g localtunnel` |
| **Start tunnel** | `lt --port 3000 --subdomain=teacher-portal` |
| **Custom subdomain** | `lt --port 3000 --subdomain=my-custom-name` |
| **Check status** | Visit your URL in browser |
| **Stop tunnel** | Press `Ctrl+C` in terminal |

---

## Troubleshooting

### "subdomain already taken"
- Try different subdomain: `lt --port 3000 --subdomain=teacher-portal-2024`

### "ECONNREFUSED"
- Make sure backend is running: `npm start` (in backend folder)
- Make sure it's running on port 3000

### Changed subdomain, URL doesn't update
- Clear browser cache (Ctrl+Shift+R)
- Check LocalTunnel terminal for new URL

### Need permanent URL but different subdomain?
- Subdomains are first-come-first-served
- If yours is taken, try: `teacher-portal-yourname` or `teacher-portal-2024`

---

## Your Permanent URL

Once you claim your subdomain, it's yours!

Example: `https://teacher-portal.loca.lt`

- ✅ Same URL every restart
- ✅ Can bookmark it
- ✅ Can share with team
- ✅ Always points to your app

---

## Testing Your Setup

1. **Terminal 1:** `npm start` (in backend)
2. **Terminal 2:** `lt --port 3000 --subdomain=teacher-portal`
3. **Browser:** Visit `https://teacher-portal.loca.lt`
4. **Check:** Should see login page with your logo!

---

## What's Next?

After LocalTunnel is working:

### Add Favicon (If Not Done)
- Visit: https://realfavicongenerator.net/
- Upload: `frontend/resources/techvision.png`
- Download files
- Extract to: `frontend/resources/`
- Refresh browser (Ctrl+Shift+R)

### Share URL
- Copy: `https://teacher-portal.loca.lt`
- Send to your team!

---

## Environment Variables (Optional)

If you want to reference your tunnel URL in code, update `.env`:

```dotenv
# .env
FRONTEND_URL=https://teacher-portal.loca.lt
```

Then your environment validation will log it at startup.

---

## Keeping It Running

### Option 1: Keep Terminals Open
Keep both server and LocalTunnel terminals running while in use.

### Option 2: Run in Background (PowerShell)
```powershell
# Start backend in background job
Start-Job { cd backend; npm start }

# Start tunnel in current terminal
lt --port 3000 --subdomain=teacher-portal
```

### Option 3: Use Batch Script
Run `start-with-tunnel.bat` - handles everything automatically!

---

**Your Permanent URL is Ready: `https://teacher-portal.loca.lt` 🎉**
