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

echo "[entrypoint] Setting up Passport clients..."
php artisan passport:install --no-interaction

if [ ! -f storage/install.lock ]; then
    echo "[entrypoint] First run — checking user count..."
    USER_COUNT=$(php -r "
        require 'vendor/autoload.php';
        \$app = require 'bootstrap/app.php';
        \$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
        echo \\App\\Models\\User::count();
    ")
    if [ "$USER_COUNT" = "1" ]; then
        echo "[entrypoint] Exactly one user found, granting super admin..."
        php -r "
            require 'vendor/autoload.php';
            \$app = require 'bootstrap/app.php';
            \$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
            \$user = \\App\\Models\\User::first();
            \$user->permission = \\App\\Models\\User::SUPER_ADMIN;
            \$user->verified = true;
            \$user->save();
            echo 'User ' . \$user->email . ' is now super admin.' . PHP_EOL;
        "
    fi
    touch storage/install.lock
    echo "[entrypoint] Installation locked."
fi

echo "[entrypoint] Starting Apache..."
exec "$@"
