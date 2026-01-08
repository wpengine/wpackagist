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
# Handle different Listen directive formats and make it idempotent by replacing any port number
sed -i -E "s/^Listen ([^:]*:)?[0-9]+$/Listen \1$PORT/g" /etc/apache2/ports.conf

# Replace __PORT__ or any existing port in the VirtualHost config with actual PORT value
sed -i -E "s/<VirtualHost \*:(__PORT__|[0-9]+)>/<VirtualHost *:$PORT>/g" /etc/apache2/sites-available/symfony.conf

echo "Starting Apache..."
# Call the normal web server entry-point script
apache2-foreground "$@"
