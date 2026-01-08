# Makefile for wpackagist

DOCKER := $(shell [[ -x `which	docker` ]] && which docker || which podman )

# Default environment variables
APP_ENV ?= prod
LABEL ?= stg

.PHONY: help build-local build-aws build-gcp clean

help:
	@echo "Available targets:"
	@echo "  build-local                   - Build Docker image for local development"
	@echo "  build-aws                     - Build Docker image for AWS deployment"
	@echo "  build-gcp LABEL=[stg|prd]     - Build Docker image for GCP for local testing; LABEL=stg is the default"
	@echo "  clean                         - Remove local Docker images"

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

clean:
	docker rmi -f wpackagist:local wpackagist:aws wpackagist:gcp || true
