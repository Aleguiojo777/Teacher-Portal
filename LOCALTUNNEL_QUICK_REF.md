# ⚡ LocalTunnel: 3-Minute Setup

## Install (One Time Only)
```bash
npm install -g localtunnel
```

---

## Start (Every Time)

### Method 1: Use Helper Script (EASIEST)
```bash
# Windows - Double-click:
start-with-tunnel.bat

# PowerShell:
.\start-with-tunnel.ps1
```
✅ Starts everything automatically
✅ No manual steps needed

---

### Method 2: Manual (2 Terminals)

**Terminal 1:**
```bash
cd backend
npm start
```

**Terminal 2:**
```bash
lt --port 3000 --subdomain=teacher-portal
```

---

## Your URL
```
https://teacher-portal.loca.lt
```

✅ Click to open  
✅ Share with team  
✅ Bookmark it  
✅ Stays the same forever!

---

## Test It
1. Open: `https://teacher-portal.loca.lt`
2. Login page should load
3. Logo should appear in browser tab
4. Bookmark & share URL! 🎉

---

## Quick Commands

| Action | Command |
|--------|---------|
| **Install** | `npm install -g localtunnel` |
| **Start** | `lt --port 3000 --subdomain=teacher-portal` |
| **Stop** | `Ctrl+C` |
| **Different subdomain** | `lt --port 3000 --subdomain=my-portal` |

---

## Troubleshooting

❓ **"Command not found"**  
→ Run: `npm install -g localtunnel`

❓ **"Port 3000 already in use"**  
→ Backend not started  
→ Run: `npm start` in backend folder

❓ **"Subdomain taken"**  
→ Try: `lt --port 3000 --subdomain=teacher-portal-2024`

❓ **Can't access URL**  
→ Make sure both server and tunnel are running  
→ Check terminal for errors

---

## Done! 🚀

Your app is now:
- ✅ Running locally
- ✅ Accessible globally  
- ✅ Has a permanent URL
- ✅ Has your logo in browser tab
- ✅ Ready to share!
