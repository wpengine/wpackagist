#!/bin/bash

# Source common setup (platform detection, secrets loading, migrations)
source /var/www/html/deploy/common-setup.sh

# Distributed lock using database table with timestamp
LOCK_NAME="wpackagist-cron-job"
LOCK_TIMEOUT=172800  # 2 days timeout for stale locks
LOCK_ACQUIRED=0

# Function to release lock on exit
release_lock() {
    if [ $LOCK_ACQUIRED -eq 1 ]; then
        echo "Releasing distributed lock..."
        php /var/www/html/bin/console dbal:run-sql "DELETE FROM cron_lock WHERE lock_name = '$LOCK_NAME'" > /dev/null 2>&1
    fi
}

# Set up trap to release lock on script exit (success or failure)
trap release_lock EXIT INT TERM

# Try to acquire the lock (non-blocking)
echo "Attempting to acquire distributed lock..."

# Create lock table if it doesn't exist
php /var/www/html/bin/console dbal:run-sql "CREATE TABLE IF NOT EXISTS cron_lock (lock_name VARCHAR(255) PRIMARY KEY, locked_at TIMESTAMP NOT NULL, locked_by VARCHAR(255))" > /dev/null 2>&1

# Clear stale locks
php /var/www/html/bin/console dbal:run-sql "DELETE FROM cron_lock WHERE locked_at < NOW() - INTERVAL '$LOCK_TIMEOUT seconds'" > /dev/null 2>&1

# Try to insert lock record
if php /var/www/html/bin/console dbal:run-sql "INSERT INTO cron_lock (lock_name, locked_at, locked_by) VALUES ('$LOCK_NAME', NOW(), '$(hostname)')" &> /dev/null; then
    LOCK_ACQUIRED=1
    echo "Lock acquired successfully. Starting task..."

    # Call the normal CLI entry-point script, passing on script name and any other arguments
    docker-php-entrypoint /var/www/html/run-cron.sh "$@"

    echo "Task completed."
else
    echo "Could not acquire lock. Another instance is already running. Exiting."
    exit 0
fi
