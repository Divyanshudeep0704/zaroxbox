# 🚀 Deploy Your Vault App Now

Your application is ready to deploy! Follow these simple steps.

## Quick Deploy (5 minutes)

### Step 1: Upload Files to Your VPS

Open your terminal and run:

```bash
scp deploy.tar.gz root@178.128.28.19:/tmp/
scp vps-install.sh root@178.128.28.19:/tmp/
```

**Password when prompted:** `always@1Number`

### Step 2: Install on VPS

Connect to your VPS:

```bash
ssh root@178.128.28.19
```

**Password:** `always@1Number`

Then run the installation:

```bash
bash /tmp/vps-install.sh
```

### Step 3: Access Your App

Once installation completes, your app will be live at:

**http://178.128.28.19**

---

## Adding Your Custom Domain (Optional)

After the app is running, you can add your custom domain:

### 1. Update DNS

Point your domain to your VPS:
- Type: `A`
- Name: `@`
- Value: `178.128.28.19`
- TTL: `3600`

Wait 5-30 minutes for DNS propagation.

### 2. Update Nginx Configuration

SSH into your VPS:

```bash
ssh root@178.128.28.19
```

Edit the nginx config:

```bash
nano /etc/nginx/sites-available/vault
```

Change this line:
```
server_name _;
```

To:
```
server_name yourdomain.com www.yourdomain.com;
```

Save and test:
```bash
nginx -t
systemctl reload nginx
```

### 3. Add SSL Certificate (HTTPS)

Get a free SSL certificate:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts and choose to redirect HTTP to HTTPS.

### 4. Update Supabase Settings

1. Go to your Supabase dashboard
2. Navigate to: Authentication → URL Configuration
3. Update:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: Add `https://yourdomain.com/**`

---

## What Gets Installed

The installation script will:
- ✅ Update system packages
- ✅ Install nginx web server
- ✅ Install Let's Encrypt (certbot) for SSL
- ✅ Configure firewall (ports 22, 80, 443)
- ✅ Deploy your application
- ✅ Set proper permissions
- ✅ Start nginx and enable auto-start

---

## Troubleshooting

### Can't connect via SSH?
Check that your VPS is running and the IP address is correct.

### Installation fails?
Run these commands on your VPS:
```bash
apt-get update
apt-get install -y nginx
```

### App not loading?
Check nginx status:
```bash
systemctl status nginx
```

View nginx logs:
```bash
tail -f /var/log/nginx/error.log
```

### Need to redeploy?
Just repeat Steps 1 and 2. The script is safe to run multiple times.

---

## Files Included

- `deploy.tar.gz` - Your built application (100KB)
- `vps-install.sh` - Automated installation script
- `nginx.conf` - Nginx configuration template
- `DEPLOYMENT.md` - Detailed deployment guide

---

## Support

If you encounter any issues:
1. Check that your VPS has at least 512MB RAM
2. Ensure ports 80 and 443 are not blocked
3. Verify your Supabase credentials in the `.env` file
4. Check the DEPLOYMENT.md file for detailed troubleshooting

---

**Ready to deploy? Copy the commands from Step 1 above and paste them into your terminal!**
