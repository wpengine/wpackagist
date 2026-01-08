FROM php:8.5-apache

ARG env
RUN test -n "$env"

ARG target=aws

RUN if [ "$target" = "aws" ]; then \
        # Install the AWS CLI - needed to load in secrets safely from S3. \
        echo Building for target=aws && \
        apt-get update -qq && apt-get install -y awscli && \
        rm -rf /var/lib/apt/lists/* /var/cache/apk/*; \
    elif [ "$target" = "gcp" ]; then \
        # Install the gcloud CLI - needed to get secrets from Google Secret Manager \
        echo Building for target=gcp && \
        apt-get update -qq && \
        apt-get install -y curl gnupg apt-transport-https ca-certificates && \
        echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
        curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg && \
        apt-get update -qq && apt-get install -y google-cloud-cli && \
        rm -rf /var/lib/apt/lists/* /var/cache/apk/*; \
    fi

# Install svn client, a requirement for the current native exec approach; git for
# Composer pulls; libpq-dev for Postgres; libicu-dev for intl; libonig-dev for mbstring.
RUN apt-get update -qq && \
    apt-get install -y git libicu-dev libonig-dev libpq-dev libzip-dev subversion zip && \
    rm -rf /var/lib/apt/lists/* /var/cache/apk/*

# intl recommended by something in the Doctrine/Symfony stack for improved performance.
RUN docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
 && docker-php-ext-install intl mbstring pdo_pgsql zip

RUN pecl install redis && rm -rf /tmp/pear && docker-php-ext-enable redis

# Get latest Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set up virtual host.
COPY config/apache/symfony.conf /etc/apache2/sites-available/
RUN a2enmod rewrite \
 && a2enmod remoteip \
 && a2dissite 000-default \
 && a2ensite symfony \
 && echo ServerName localhost >> /etc/apache2/apache2.conf

COPY . /var/www/html

# Configure PHP to e.g. not hit 128M memory limit.
COPY ./config/php/php.ini /usr/local/etc/php/

# Ensure Apache can run as www-data and still write to these when the Docker build creates them as root.
RUN mkdir /tmp/twig
RUN chmod -R 777 /tmp/twig

RUN chown -R www-data:www-data /var/www/html
# USER www-data

RUN APP_ENV=${env} composer install --no-interaction --quiet --optimize-autoloader --no-dev

# Make entrypoint scripts executable
RUN chmod +x /var/www/html/deploy/*.sh || true

# Use web_entrypoint.sh directly (handles all platforms: AWS, GCP, Docker)
CMD ["/var/www/html/deploy/web_entrypoint.sh"]
