#!/bin/bash
set -e

echo "[entrypoint] Waiting for MySQL to be ready..."
until php -r "try { new PDO('mysql:host=mysql;dbname=${DB_DATABASE:-blessingskin}', '${DB_USERNAME:-blessingskin}', '${DB_PASSWORD}'); echo 'connected'; } catch (Exception \$e) { exit(1); }" 2>/dev/null; do
    echo "[entrypoint] MySQL not ready yet, retrying in 3s..."
    sleep 3
done
echo "[entrypoint] MySQL is ready."

cd /app

mkdir -p storage/framework/sessions storage/plugins

if [ ! -f storage/oauth-private.key ]; then
    echo "[entrypoint] Generating Passport OAuth keys..."
    php artisan passport:keys --force
fi

echo "[entrypoint] Running database migrations..."
php artisan migrate --force

echo "[entrypoint] Starting Apache..."
exec "$@"
