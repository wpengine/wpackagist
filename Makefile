# Makefile for wpackagist

DOCKER := $(shell [[ -x `which	docker` ]] && which docker || which podman )

# Default environment variables
APP_ENV ?= prod
LABEL ?= latest

.PHONY: help build-local build-aws build-gcp push-gcp clean

help:
	@echo "Available targets:"
	@echo "  build-local                       - Build Docker image for local development"
	@echo "  build-aws                         - Build Docker image for AWS deployment"
	@echo "  build-gcp LABEL=[latest|prd]      - Build Docker image for GCP for local testing; LABEL=latest is the default"
	@echo "  push-gcp LABEL=[latest|prd]       - Build Docker image for GCP/Cloud Run deployment and push to GAR; LABEL=latest is the default"
	@echo "  clean                             - Remove local Docker images"

build-local:
	$(DOCKER) build \
		--build-arg env=dev \
		--build-arg target=local \
		--label arch=$(shell uname -m) \
		-t wpackagist:local \
		.

build-aws:
	$(DOCKER) build \
		--build-arg env=prod \
		--build-arg target=aws \
		--label arch=$(shell uname -m) \
		-t wpackagist:aws \
		.

build-gcp:
	$(DOCKER) build \
		--build-arg env=$(APP_ENV) \
		--build-arg target=gcp \
		--label arch=$(shell uname -m) \
        -t wpackagist:gcp-$(LABEL) \
		.

push-gcp:
	# Authenticate with your user account (if you have impersonation rights)
	if ! gcloud --quiet auth application-default print-access-token > /dev/null 2>&1; then \
		gcloud auth application-default login; \
	fi
	# Impersonate the service account
	gcloud config set auth/impersonate_service_account gar-sa@wpackagist-eng-tools.iam.gserviceaccount.com
	# Submit build to Google Cloud Build (native AMD64, avoids M-series Mac cross-compilation issues)
	gcloud builds submit \
		--config=cloudbuild.yaml \
		--substitutions=_LABEL=$(LABEL),_APP_ENV=$(APP_ENV) \
		--project=wpackagist-eng-tools \
		--async
	gcloud config unset auth/impersonate_service_account

clean:
	docker rmi -f wpackagist:local wpackagist:aws wpackagist:gcp || true


