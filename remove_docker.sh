#!/bin/bash

# Docker Removal Script for Mac
# Run this script to safely remove Docker from your system

echo "🐳 Docker Removal Script"
echo "========================"
echo ""

# Check if Docker is running
if pgrep -x "Docker Desktop" > /dev/null; then
    echo "⚠️  Docker Desktop is currently running."
    echo "Please quit Docker Desktop first:"
    echo "1. Click Docker icon in menu bar"
    echo "2. Select 'Quit Docker Desktop'"
    echo "3. Wait for it to fully quit"
    echo "4. Then run this script again"
    exit 1
fi

echo "✅ Docker Desktop is not running"
echo ""

# Stop any remaining Docker processes
echo "🛑 Stopping any remaining Docker processes..."
sudo pkill -f docker 2>/dev/null || true
sudo pkill -f Docker 2>/dev/null || true

echo "📦 Removing Homebrew Docker packages..."
if command -v brew >/dev/null 2>&1; then
    brew uninstall docker docker-completion 2>/dev/null || true
    echo "✅ Homebrew Docker packages removed"
else
    echo "ℹ️  Homebrew not found, skipping"
fi

echo ""
echo "🗑️  Removing Docker Desktop application..."
if [ -d "/Volumes/ExternalHD/Applications/Docker.app" ]; then
    sudo rm -rf "/Volumes/ExternalHD/Applications/Docker.app"
    echo "✅ Docker Desktop application removed"
else
    echo "ℹ️  Docker Desktop app not found at expected location"
fi

echo ""
echo "🧹 Removing Docker data and configuration files..."

# Remove user Docker data
rm -rf ~/.docker
rm -rf ~/Library/Application\ Support/Docker\ Desktop
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/Library/Containers/com.docker.docker
rm -rf ~/Library/Application\ Scripts/group.com.docker
rm -rf ~/Library/Preferences/com.docker.docker.plist
rm -rf ~/Library/Saved\ Application\ State/com.electron.docker-frontend.savedState
rm -rf ~/Library/Logs/Docker\ Desktop
rm -rf ~/Library/Caches/com.docker.docker

echo "✅ User Docker data removed"

echo ""
echo "🔧 Removing system-level Docker components..."

# Remove CLI tools (requires sudo)
sudo rm -f /usr/local/bin/docker
sudo rm -f /usr/local/bin/docker-compose
sudo rm -f /usr/local/bin/docker-credential-desktop
sudo rm -f /usr/local/bin/docker-credential-ecr-login
sudo rm -f /usr/local/bin/docker-credential-osxkeychain

# Remove system Docker data
sudo rm -rf /var/lib/docker 2>/dev/null || true
sudo rm -rf /etc/docker 2>/dev/null || true

# Remove privileged helper
sudo rm -f /Library/PrivilegedHelperTools/com.docker.vmnetd

echo "✅ System Docker components removed"

echo ""
echo "🧽 Cleaning up Homebrew..."
if command -v brew >/dev/null 2>&1; then
    brew cleanup
    echo "✅ Homebrew cleaned up"
fi

echo ""
echo "✅ Docker removal complete!"
echo ""
echo "📋 What was removed:"
echo "   • Docker Desktop application"
echo "   • Homebrew Docker packages"
echo "   • All Docker data and configuration files"
echo "   • Docker CLI tools"
echo "   • System-level Docker components"
echo ""
echo "💡 Recommendations:"
echo "   • Restart your Mac to ensure all processes are fully terminated"
echo "   • Empty your Trash to free up disk space"
echo "   • Consider alternatives like Firebase for your Shepherd project"
echo ""
echo "🎉 You should now have a Docker-free development environment!"