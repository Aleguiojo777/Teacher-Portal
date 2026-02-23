# Cloudflare Tunnel Setup Guide

This guide walks you through setting up a free, secure HTTPS tunnel for your Teacher Portal using Cloudflare Tunnel (formerly Argo Tunnel).

## Prerequisites

- A domain (e.g., `yourdomain.com`)
- A free Cloudflare account
- Windows machine with the Teacher Portal backend running locally
- Admin access to your domain registrar (to change nameservers)

## Step 1: Create a Free Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with your email
3. Verify your email

## Step 2: Add Your Domain to Cloudflare

1. Log in to Cloudflare Dashboard
2. Click "Add domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Choose the Free plan
5. Cloudflare will scan your existing DNS records
6. Review and continue

You'll see Cloudflare's nameservers (ns1.cloudflare.com, ns2.cloudflare.com, etc.)

## Step 3: Update Nameservers at Your Registrar

This step makes Cloudflare your DNS provider (free, and required for tunnel DNS routing).

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS / Nameserver settings
3. Replace the existing nameservers with Cloudflare's:
   - `ns1.cloudflare.com`
   - `ns2.cloudflare.com`
   - (and any additional nameservers shown on Cloudflare dashboard)
4. Save changes (may take up to 48 hours to propagate, usually 10 minutes)
5. Return to Cloudflare dashboard and click "Done, Nameservers Updated"

## Step 4: Install Cloudflared

cloudflared is Cloudflare's tunnel client that runs on your Windows machine.

### Option A: Using Chocolatey (Windows)

```powershell
# If Chocolatey is not installed, install it first:
# https://chocolatey.org/install

choco install cloudflared -y
```

### Option B: Manual Download

1. Go to https://github.com/cloudflare/cloudflared/releases
2. Download the latest Windows `.exe` or `.msi` file
3. Run the installer

### Verify Installation

```powershell
cloudflared --version
```

## Step 5: Authenticate Cloudflared

```powershell
cloudflared tunnel login
```

This opens a browser where you'll:
1. Select your domain from the list
2. Authorize Cloudflared to access your Cloudflare account

A certificate file is saved locally at `C:\Users\<username>\.cloudflared\cert.pem`

## Step 6: Create a Tunnel

Replace `teacher-portal` with your preferred tunnel name.

```powershell
cloudflared tunnel create teacher-portal
```

Output shows your Tunnel ID and credentials file location. Save the Tunnel ID for later.

## Step 7: Create a Configuration File

Create or edit `C:\Users\<username>\.cloudflared\config.yml`:

```yaml
tunnel: teacher-portal
credentials-file: C:\Users\<username>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: portal.yourdomain.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Replace:
- `portal.yourdomain.com` with your desired subdomain
- `<TUNNEL_ID>` with your actual Tunnel ID

## Step 8: Route DNS

This tells Cloudflare to route requests to `portal.yourdomain.com` through your tunnel.

```powershell
cloudflared tunnel route dns teacher-portal portal.yourdomain.com
```

## Step 9: Test the Tunnel Locally

```powershell
cloudflared tunnel run teacher-portal
```

You should see output like:
```
2026-02-23T12:00:00Z INF Tunnel credentials loaded from C:\...
2026-02-23T12:00:00Z INF Updated network stack by trust-dns, TCP_NODELAY is not set.
2026-02-23T12:00:00Z INF Starting metrics server at 127.0.0.1:8080
2026-02-23T12:00:00Z INF Connected to HAL
2026-02-23T12:00:00Z INF Route propagated to Cloudflare edge (at edge as portal.yourdomain.com)
```

### Test Access

Open a browser and visit `https://portal.yourdomain.com`

You should see your login page with a valid HTTPS certificate (green lock, no errors).

### Stop the Tunnel

Press Ctrl+C in the terminal

## Step 10: Install Tunnel as a Windows Service (Optional but Recommended)

To make the tunnel start automatically on boot:

```powershell
# Install as service
cloudflared tunnel install

# Start the service
cloudflared tunnel start teacher-portal

# Check service status
Get-Service cloudflared
```

To run the Teacher Portal backend and tunnel on startup, create:
- A batch file or PowerShell script in Windows startup folder
- Or use Task Scheduler to run both services

Example startup script (`C:\Users\<username>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\start-portal.bat`):

```batch
@echo off
cd C:\Users\<username>\Desktop\Teacher Portal\Teacher-Portal\backend
start npm start
timeout /t 5
cloudflared tunnel start teacher-portal
pause
```

## Security Checklist

- ✅ HTTPS enabled (Cloudflare manages TLS certificates)
- ✅ No port-forwarding needed (tunnel encapsulates traffic)
- ✅ Backend JWT tokens signed and verified
- ✅ Rate limiting on login endpoint
- ✅ Helmet security headers enabled
- ✅ Logging and alerts configured
- ✅ Database hardened (no debug endpoints)

## Troubleshooting

### "Route not found" / 404 errors
- Verify your local backend is running: `netstat -ano | findstr :3000`
- Ensure credentials file exists in `.cloudflared/` directory
- Check `config.yml` hostname matches your DNS record (case-sensitive)

### DNS not resolving
- Wait 10 minutes for DNS propagation
- Verify nameservers updated at registrar (use `nslookup yourdomain.com`)
- Re-run `cloudflared tunnel route dns teacher-portal portal.yourdomain.com`

### "Certificate verification failed"
- Ensure you're using the subdomain you configured (e.g., `portal.yourdomain.com`, not `yourdomain.com`)
- Clear browser cache and cookies
- Try an incognito/private window

### Service won't start
- Kill any existing cloudflared processes: `taskkill /IM cloudflared.exe /F`
- Re-authenticate: `cloudflared tunnel login`
- Verify config file syntax is valid YAML

## More Info

- Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- Free tier limits: Unlimited tunnel connections, remote management via Cloudflare dashboard
- For production: Cloudflare Pro/Business plans offer additional analytics and features

## Next Steps in Portal

Once tunnel is running:
1. Access `https://portal.yourdomain.com` from any device on any network
2. Login with credentials (accounts are rate-limited after 5 failed attempts per 15 minutes)
3. Enjoy secure, HTTPS-protected access without managing certificates or port-forwarding
