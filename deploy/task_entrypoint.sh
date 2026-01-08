#!/bin/bash

# Source common setup (platform detection, secrets loading, migrations)
source /var/www/html/deploy/common-setup.sh

echo "Starting task..."
# Call the normal CLI entry-point script, passing on script name and any other arguments
docker-php-entrypoint /var/www/html/run-cron.sh "$@"
