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
mkdir -p /var/www/vault

# Extract deployment
echo "📦 Extracting application files..."
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

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\. {
        deny all;
    }
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
echo "🔍 Testing nginx configuration..."
nginx -t

echo "🚀 Starting nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application is live at: http://178.128.28.19"
echo ""
echo "Next steps for custom domain:"
echo "1. Point your domain DNS to: 178.128.28.19"
echo "2. Update nginx config: nano /etc/nginx/sites-available/vault"
echo "   Replace 'server_name _;' with 'server_name yourdomain.com www.yourdomain.com;'"
echo "3. Get SSL: certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
