#!/bin/bash
# Script update satu langkah untuk di server: bash update.sh
set -e

echo "========================================="
echo "🚀 Memulai Update Aplikasi Surat Online"
echo "========================================="

# Tarik commit terbaru
echo "📥 Menarik kode terbaru (git pull)..."
git pull origin main

# Build frontend
echo "🔨 Menjalankan build..."
npm run build

# Restart service
echo "🔄 Me-restart PM2..."
pm2 restart all

echo "========================================="
echo "✅ Update selesai & server aktif!"
echo "========================================="
