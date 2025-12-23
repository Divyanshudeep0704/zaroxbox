# Deployment Guide for VPS

This guide will help you deploy your Vault application to your VPS with a custom domain.

## Prerequisites

- A VPS with Ubuntu/Debian (or similar Linux distribution)
- A domain name pointing to your VPS IP address
- SSH access to your VPS
- Root or sudo privileges

## Step 1: Prepare Your VPS

SSH into your VPS and install required packages:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install nginx
sudo apt install nginx -y

# Install certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 2: Configure DNS

Point your domain to your VPS:

1. Go to your domain registrar's DNS settings
2. Add an A record:
   - Type: `A`
   - Name: `@` (or leave blank for root domain)
   - Value: `your-vps-ip-address`
   - TTL: `3600` (or automatic)

3. Add a CNAME record for www (optional):
   - Type: `CNAME`
   - Name: `www`
   - Value: `yourdomain.com`
   - TTL: `3600`

Wait 5-30 minutes for DNS propagation.

## Step 3: Build and Upload Files

On your local machine:

```bash
# Build the application
npm run build

# Or use the deployment script
chmod +x deploy.sh
./deploy.sh
```

Upload files to your VPS using SCP:

```bash
# Upload the built files
scp -r dist/* user@your-vps-ip:/var/www/vault/

# Or upload the archive
scp deploy.tar.gz user@your-vps-ip:/tmp/
```

## Step 4: Set Up Application Directory on VPS

SSH into your VPS:

```bash
# Create application directory
sudo mkdir -p /var/www/vault

# If you uploaded the archive
cd /var/www/vault
sudo tar -xzf /tmp/deploy.tar.gz

# Set proper permissions
sudo chown -R www-data:www-data /var/www/vault
sudo chmod -R 755 /var/www/vault
```

## Step 5: Configure Nginx

Upload the nginx configuration:

```bash
# From your local machine
scp nginx.conf user@your-vps-ip:/tmp/vault.conf
```

On your VPS:

```bash
# Edit the configuration file and replace 'yourdomain.com' with your actual domain
sudo nano /tmp/vault.conf

# Copy to nginx sites-available
sudo cp /tmp/vault.conf /etc/nginx/sites-available/vault

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 6: Configure SSL Certificate

Get a free SSL certificate from Let's Encrypt:

```bash
# Run certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Certbot will automatically configure SSL and update your nginx config
```

The SSL certificate will auto-renew. Test the renewal process:

```bash
sudo certbot renew --dry-run
```

## Step 7: Update Environment Variables

Your application uses Supabase. Make sure your Supabase project allows your domain:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Add your domain to "Site URL": `https://yourdomain.com`
4. Add your domain to "Redirect URLs": `https://yourdomain.com/**`

## Step 8: Verify Deployment

Visit your domain in a browser:

```
https://yourdomain.com
```

Check that:
- The site loads correctly
- HTTPS is working (padlock icon in browser)
- Authentication works
- File uploads work

## Updating Your Application

When you need to deploy updates:

```bash
# On your local machine
npm run build

# Upload new files
scp -r dist/* user@your-vps-ip:/var/www/vault/

# On your VPS (if needed)
sudo systemctl reload nginx
```

## Troubleshooting

### Check nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check nginx status
```bash
sudo systemctl status nginx
```

### Test nginx configuration
```bash
sudo nginx -t
```

### Reload nginx after changes
```bash
sudo systemctl reload nginx
```

### Check SSL certificate status
```bash
sudo certbot certificates
```

### File permissions issues
```bash
sudo chown -R www-data:www-data /var/www/vault
sudo chmod -R 755 /var/www/vault
```

## Security Best Practices

1. **Firewall**: Configure UFW to only allow necessary ports
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Monitor logs regularly**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```

4. **Backup your data** (Supabase handles database backups)

## Alternative: Quick Deployment Script

Create a script on your VPS for easier updates:

```bash
#!/bin/bash
# /home/user/deploy-vault.sh

cd /var/www/vault
sudo rm -rf dist/
sudo tar -xzf /tmp/deploy.tar.gz
sudo chown -R www-data:www-data /var/www/vault
sudo chmod -R 755 /var/www/vault
sudo systemctl reload nginx
echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x /home/user/deploy-vault.sh
```

Then deploy with:
```bash
scp deploy.tar.gz user@your-vps-ip:/tmp/
ssh user@your-vps-ip "/home/user/deploy-vault.sh"
```

## Support

If you encounter issues:
1. Check nginx error logs
2. Verify DNS settings are correct
3. Ensure firewall allows HTTP/HTTPS traffic
4. Confirm Supabase URL configuration includes your domain
