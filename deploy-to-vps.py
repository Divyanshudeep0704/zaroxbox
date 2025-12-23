#!/usr/bin/env python3
"""
Automated deployment script for VPS
Uses subprocess to handle SSH/SCP operations
"""

import subprocess
import os
import sys

VPS_USER = "root"
VPS_IP = "178.128.28.19"
VPS_PASS = "always@1Number"

def run_command(command, show_output=True):
    """Run a shell command"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=not show_output,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Starting deployment to VPS...")
    print(f"📡 Target: {VPS_USER}@{VPS_IP}")
    print()

    # Check if deployment package exists
    if not os.path.exists('deploy.tar.gz'):
        print("❌ Error: deploy.tar.gz not found!")
        print("Run 'npm run build && tar -czf deploy.tar.gz dist/' first")
        sys.exit(1)

    # Check if vps-setup.sh exists
    if not os.path.exists('vps-setup.sh'):
        print("❌ Error: vps-setup.sh not found!")
        sys.exit(1)

    # Upload files using scp
    print("📦 Uploading deployment package...")
    scp_cmd = f'scp -o StrictHostKeyChecking=no deploy.tar.gz {VPS_USER}@{VPS_IP}:/tmp/'

    print("📦 Uploading setup script...")
    scp_cmd2 = f'scp -o StrictHostKeyChecking=no vps-setup.sh {VPS_USER}@{VPS_IP}:/tmp/'

    # Execute setup on VPS
    print("⚙️  Executing setup script on VPS...")
    ssh_cmd = f'ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_IP} "chmod +x /tmp/vps-setup.sh && /tmp/vps-setup.sh"'

    print()
    print("Manual commands to run:")
    print(f"1. {scp_cmd}")
    print(f"2. {scp_cmd2}")
    print(f"3. {ssh_cmd}")
    print()
    print(f"Password: {VPS_PASS}")
    print()
    print("Or install sshpass and run auto-deploy.sh")

if __name__ == "__main__":
    main()
