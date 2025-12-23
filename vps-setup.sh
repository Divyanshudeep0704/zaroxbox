#!/bin/bash

# VPS Setup Script
# This script sets up nginx and deploys the application

set -e

echo "🚀 Starting VPS setup and deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing nginx and certbot..."
apt install -y nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/vault

# Extract deployment files
echo "📦 Extracting application files..."
cd /var/www/vault
if [ -f /tmp/deploy.tar.gz ]; then
    tar -xzf /tmp/deploy.tar.gz
else
    echo "❌ Error: deploy.tar.gz not found in /tmp/"
    exit 1
fi

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/vault
chmod -R 755 /var/www/vault

# Configure nginx
echo "⚙️  Configuring nginx..."
cat > /etc/nginx/sites-available/vault << 'EOF'
server {
    listen 80;
    server_name 178.128.28.19;

    root /var/www/vault/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
nginx -t

# Start and enable nginx
echo "🚀 Starting nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your application is now available at: http://178.128.28.19"
echo ""
echo "Next steps:"
echo "1. Point your domain to this IP address (178.128.28.19)"
echo "2. Update the nginx config with your domain name"
echo "3. Run: certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
