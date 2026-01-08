#!/bin/bash
echo "Starting refresh..."
APP_ENV=${APP_ENV:-prod} php bin/console refresh
echo "Starting update..."
APP_ENV=${APP_ENV:-prod} php bin/console update
echo "Starting build..."
APP_ENV=${APP_ENV:-prod} php bin/console build

echo "Done!"
