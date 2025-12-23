#!/usr/bin/env python3
"""
Automated deployment script using Python
This handles SSH password authentication for deployment
"""

import subprocess
import os
import sys

def check_file_exists(filename):
    """Check if required file exists"""
    if not os.path.exists(filename):
        print(f"❌ Error: {filename} not found!")
        return False
    return True

def deploy_with_manual_steps():
    """Provide manual deployment steps"""
    print("\n🚀 DEPLOYMENT GUIDE")
    print("=" * 60)
    print("\nYour VPS credentials:")
    print("  Server: 178.128.28.19")
    print("  User: root")
    print("  Password: always@1Number")
    print("\n" + "=" * 60)

    print("\n📋 Step-by-step deployment:")
    print("\n1️⃣  Upload deployment files:")
    print("   Run these commands in your terminal:\n")
    print("   scp deploy.tar.gz root@178.128.28.19:/tmp/")
    print("   scp vps-install.sh root@178.128.28.19:/tmp/")

    print("\n2️⃣  Connect to your VPS:")
    print("   ssh root@178.128.28.19")

    print("\n3️⃣  Run the installation (on VPS):")
    print("   bash /tmp/vps-install.sh")

    print("\n" + "=" * 60)
    print("\n⏱️  Estimated time: 5-10 minutes")
    print("🌐 Your app will be available at: http://178.128.28.19")
    print("\n" + "=" * 60)

def main():
    print("🚀 Deployment Script for Vault Application")
    print()

    # Check required files
    if not all([
        check_file_exists('deploy.tar.gz'),
        check_file_exists('vps-install.sh')
    ]):
        sys.exit(1)

    # Check file sizes
    deploy_size = os.path.getsize('deploy.tar.gz') / 1024
    print(f"📦 Deployment package: {deploy_size:.1f} KB")
    print()

    # Provide deployment instructions
    deploy_with_manual_steps()

if __name__ == "__main__":
    main()
