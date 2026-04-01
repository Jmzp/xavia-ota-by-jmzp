#!/bin/bash
set -e

APP_DIR="/app/xavia-ota"
ENV_FILE="$APP_DIR/.env.local"

echo "=== Xavia OTA - Deploy directo (sin Docker) ==="

cd "$APP_DIR"

# Leer variables desde .env.local
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: No se encuentra $ENV_FILE"
  echo "Crea el archivo con las variables de entorno necesarias."
  exit 1
fi

# Detener proceso anterior si existe
if [ -f /tmp/xavia-ota.pid ]; then
  OLD_PID=$(cat /tmp/xavia-ota.pid)
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Deteniendo proceso anterior (PID: $OLD_PID)..."
    kill "$OLD_PID" || true
    sleep 2
  fi
  rm -f /tmp/xavia-ota.pid
fi

# Pull del codigo
echo "Actualizando codigo..."
git pull origin main

# Instalar dependencias
echo "Instalando dependencias..."
yarn install --frozen-lockfile

# Build de produccion
echo "Compilando..."
yarn build

# Iniciar en background
echo "Iniciando servidor..."
nohup yarn start > /var/log/xavia-ota.log 2>&1 &
echo $! > /tmp/xavia-ota.pid

# Esperar y verificar
sleep 5
if kill -0 "$(cat /tmp/xavia-ota.pid)" 2>/dev/null; then
  # Verificar health
  if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "Servidor iniciado correctamente (PID: $(cat /tmp/xavia-ota.pid))"
    echo "Health check: OK"
  else
    echo "Advertencia: El servidor inicio pero el health check fallo. Puede necesitar mas tiempo."
  fi
else
  echo "Error: El servidor no pudo iniciar. Revisa /var/log/xavia-ota.log"
  exit 1
fi
