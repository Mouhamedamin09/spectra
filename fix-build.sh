#!/bin/bash
# Fix build errors and rebuild frontend

echo "🔧 Fixing build errors..."

# Navigate to frontend directory
cd ~/spectra/spectra-web

# Fix 1: Fix permissions on node_modules
echo "📁 Fixing node_modules permissions..."
sudo chown -R $(whoami):$(whoami) node_modules
sudo chmod -R 755 node_modules

# Fix 2: Clean and rebuild
echo "🧹 Cleaning build artifacts..."
rm -rf node_modules/.tmp
rm -rf dist

# Rebuild
echo "🏗️  Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📦 Build output is in: ~/spectra/spectra-web/dist"
else
    echo "❌ Build failed. Trying clean install..."
    rm -rf node_modules package-lock.json
    npm install
    npm run build
fi
