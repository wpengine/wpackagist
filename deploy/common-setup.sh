#!/bin/bash

# This script detects (by presence of expected environment variables) whether it is running in AWS, GCP, or in a docker environment

# Parts of this script are taken from https://aws.amazon.com/blogs/security/how-to-manage-secrets-for-amazon-ec2-container-service-based-applications-by-using-amazon-s3-and-docker/
# and is used to set up app secrets in ECS without exposing them as widely as using ECS env vars directly would.

if [ -n "$ECS_CONTAINER_METADATA_URI_V4" ]; then
  echo "\$ECS_CONTAINER_METADATA_URI_V4 detected ($ECS_CONTAINER_METADATA_URI_V4). Running in AWS environment"
  # Check that the environment variable has been set correctly
  if [ -z "$SECRETS_URI" ]; then
    echo >&2 'error: missing AWS SECRETS_URI environment variable'
    exit 1
  fi
  # Load the S3 secrets file contents into the environment variables
  export $(aws s3 cp ${SECRETS_URI} - | grep -v '^#' | xargs)
elif [ -n "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "\$GOOGLE_CLOUD_PROJECT detected ($GOOGLE_CLOUD_PROJECT). Running in GCP environment"
  if [ -z "$SECRET_NAME" ]; then
    echo >&2 'error: missing SECRET_NAME environment variable'
    echo >&2 'Set SECRET_NAME to the name of the secret in Google Secret Manager'
    exit 1
  fi

  echo "Loading secrets from Google Secret Manager..."
  # Load secrets from Google Secret Manager
  # The secret should be stored as key=value pairs, one per line
  export $(gcloud secrets versions access latest --secret="${SECRET_NAME}" --project="${GOOGLE_CLOUD_PROJECT}" | grep -v '^#' | xargs)
  export COMPOSER_ALLOW_SUPERUSER=1
else
  echo "Running in docker environment"
fi

echo "Dumping env..."
composer dump-env "${APP_ENV}"

# Wait for PostgreSQL to be available
echo "Waiting for PostgreSQL to be available..."
until php bin/console dbal:run-sql "SELECT 1" > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up - continuing"

/var/www/html/deploy/migrate-db.sh
