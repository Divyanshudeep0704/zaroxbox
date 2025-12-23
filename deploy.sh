#!/bin/bash

# Deployment script for VPS
# This script automates the deployment process

set -e

echo "🚀 Starting deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf deploy.tar.gz dist/

echo "✅ Deployment package created: deploy.tar.gz"
echo ""
echo "Next steps:"
echo "1. Upload deploy.tar.gz to your VPS"
echo "2. Follow the DEPLOYMENT.md instructions"
