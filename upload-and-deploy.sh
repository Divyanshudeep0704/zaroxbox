#!/bin/bash

# This script performs direct deployment via SSH
# It creates all necessary files directly on the VPS

VPS_USER="root"
VPS_IP="178.128.28.19"

echo "🚀 Deploying application to VPS..."
echo "📡 Target: $VPS_USER@$VPS_IP"
echo ""

# Create base64 encoded data
echo "📦 Preparing deployment data..."
DEPLOY_BASE64=$(base64 -w 0 deploy.tar.gz)

# Create the complete deployment command
read -r -d '' REMOTE_COMMANDS << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting VPS setup..."

# Update system
echo "📦 Updating system..."
apt-get update -qq
apt-get upgrade -y -qq

# Install required packages
echo "📦 Installing nginx and certbot..."
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/vault/dist

# Extract deployment (data will be injected here)
echo "DEPLOY_DATA_PLACEHOLDER" | base64 -d > /tmp/deploy.tar.gz
cd /var/www/vault
tar -xzf /tmp/deploy.tar.gz

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/vault
chmod -R 755 /var/www/vault

# Configure nginx
echo "⚙️  Configuring nginx..."
cat > /etc/nginx/sites-available/vault << 'NGINX_CONFIG'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/vault/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Prevent access to hidden files
    location ~ /\. {
        deny all;
    }
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and start nginx
echo "🔍 Testing nginx configuration..."
nginx -t

echo "🚀 Starting nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your application is available at: http://178.128.28.19"
echo ""
echo "Next steps:"
echo "1. Point your domain to this IP (178.128.28.19)"
echo "2. Update nginx config with your domain"
echo "3. Run: certbot --nginx -d yourdomain.com"
echo ""
EOF

# Replace placeholder with actual data
REMOTE_COMMANDS=$(echo "$REMOTE_COMMANDS" | sed "s|DEPLOY_DATA_PLACEHOLDER|$DEPLOY_BASE64|")

# Save the script
echo "$REMOTE_COMMANDS" > /tmp/remote-setup.sh
chmod +x /tmp/remote-setup.sh

echo "✅ Deployment script created!"
echo ""
echo "To deploy, run ONE of the following methods:"
echo ""
echo "METHOD 1 - Using SCP (recommended):"
echo "================================"
echo "scp /tmp/remote-setup.sh root@178.128.28.19:/tmp/"
echo "ssh root@178.128.28.19 'bash /tmp/remote-setup.sh'"
echo ""
echo "METHOD 2 - Copy/Paste:"
echo "======================"
echo "ssh root@178.128.28.19"
echo "Then paste the entire script content from /tmp/remote-setup.sh"
echo ""
echo "Password: always@1Number"
echo ""
