#!/bin/bash

# Source common setup (platform detection, secrets loading, migrations)
source /var/www/html/deploy/common-setup.sh

# Includes Doctrine proxies – https://stackoverflow.com/a/36685804/2803757
echo "Clearing & warming cache..."
bin/console cache:clear --no-debug --env=$APP_ENV

chmod -R 777 /tmp/twig

# Set PORT to 8080 if not already set (for local dev; Cloud Run sets this)
export PORT=${PORT:-8080}
echo "Configuring Apache to listen on port $PORT..."

# Update Apache's ports.conf to listen on the correct port
sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf

# Replace __PORT__ placeholder in the VirtualHost config with actual PORT value
sed -i "s/__PORT__/$PORT/g" /etc/apache2/sites-available/symfony.conf

echo "Starting Apache..."
# Call the normal web server entry-point script
apache2-foreground "$@"
