#!/bin/bash
# Script de build direct - contourne npm install
set -e

cd "$(dirname "$0")"

echo "🚀 Build Vite sans npm..."

# Essayer npx d'abord (télécharge temporairement vite)
if command -v npx &> /dev/null; then
    echo "✅ npx trouvé, lancement du build..."
    npx -y vite@latest build --mode production
else
    echo "❌ npx non trouvé"
    exit 1
fi

echo "✅ Build terminé !"
