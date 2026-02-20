#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Uso: ./clone_app.sh NOMBRE_APP"
  echo "Ejemplo: ./clone_app.sh EVO_TAXI_APP"
  exit 1
fi

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(dirname "$BASE_DIR")/$1"

echo "📦 Clonando plantilla..."
cp -R "$BASE_DIR" "$TARGET_DIR"

# Crear env backend si no existe
if [ ! -f "$TARGET_DIR/backend/.env" ]; then
  cp "$TARGET_DIR/backend/.env.example" "$TARGET_DIR/backend/.env"
fi

# Crear env frontend si no existe
if [ ! -f "$TARGET_DIR/frontend/.env" ]; then
  cat > "$TARGET_DIR/frontend/.env" <<EOT
VITE_API_BASE=http://localhost:5050/api
EOT
fi

echo "✅ Clonado en: $TARGET_DIR"
echo ""
echo "Siguientes pasos:"
echo "1) Backend:"
echo "   cd \"$TARGET_DIR/backend\""
echo "   nano .env   (cambia MONGODB_URI y JWT_SECRET)"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "2) Frontend:"
echo "   cd \"$TARGET_DIR/frontend\""
echo "   npm install"
echo "   npm run dev"
