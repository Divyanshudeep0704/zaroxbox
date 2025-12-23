#!/bin/bash

# Simple deployment using curl/wget to transfer files
# This script creates a base64 encoded package and sends it to the VPS

VPS_IP="178.128.28.19"
VPS_USER="root"
VPS_PASS="always@1Number"

echo "🚀 Deploying to VPS..."

# Encode deployment package
echo "📦 Encoding deployment package..."
DEPLOY_DATA=$(base64 -w 0 deploy.tar.gz)
SETUP_DATA=$(base64 -w 0 vps-setup.sh)

# Create deployment commands
echo "⚙️  Creating deployment script..."
cat > /tmp/remote-deploy.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "📦 Receiving deployment package..."

# Decode and save deployment package
echo "$DEPLOY_DATA" | base64 -d > /tmp/deploy.tar.gz

# Decode and save setup script
echo "$SETUP_DATA" | base64 -d > /tmp/vps-setup.sh

# Run setup
chmod +x /tmp/vps-setup.sh
/tmp/vps-setup.sh

echo "✅ Deployment complete!"
EOFSCRIPT

echo ""
echo "Manual deployment commands:"
echo "================================"
echo ""
echo "Run these commands on your local machine:"
echo ""
echo "# Upload deployment package"
echo "scp deploy.tar.gz root@178.128.28.19:/tmp/"
echo ""
echo "# Upload setup script"
echo "scp vps-setup.sh root@178.128.28.19:/tmp/"
echo ""
echo "# Connect and run setup"
echo "ssh root@178.128.28.19"
echo "chmod +x /tmp/vps-setup.sh && /tmp/vps-setup.sh"
echo ""
echo "Password: always@1Number"
echo ""
