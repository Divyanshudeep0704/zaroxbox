#!/bin/bash

# Automated Deployment Script
# This script uploads and deploys the application to your VPS

VPS_USER="root"
VPS_IP="178.128.28.19"
VPS_PASS="always@1Number"

echo "🚀 Starting automated deployment to $VPS_IP..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    sudo apt-get update
    sudo apt-get install -y sshpass
fi

# Upload deployment package
echo "📦 Uploading deployment package..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no deploy.tar.gz $VPS_USER@$VPS_IP:/tmp/

# Upload setup script
echo "📦 Uploading setup script..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no vps-setup.sh $VPS_USER@$VPS_IP:/tmp/

# Execute setup script on VPS
echo "⚙️  Running setup script on VPS..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "chmod +x /tmp/vps-setup.sh && /tmp/vps-setup.sh"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your application is now available at: http://$VPS_IP"
echo ""
