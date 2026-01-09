#!/bin/bash

# Build script for production Docker images
set -e

echo "Building production Docker images..."

# Build API production image
echo "Building API production image..."
docker build -f Dockerfile.prod.api -t basketball-api-prod .

# Build Frontend production image
echo "Building Frontend production image..."
docker build -f Dockerfile.prod.frontend -t basketball-frontend-prod .

echo "Production images built successfully!"
echo ""
echo "Image sizes:"
docker images | grep basketball

echo ""
echo "To run the production stack:"
echo "docker-compose -f docker-compose.prod.yml up -d"