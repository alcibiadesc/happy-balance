#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="alcibiadesc"
IMAGE_NAME="happy-balance"
VERSION="${1:-latest}"

echo -e "${GREEN}🚀 Building and pushing Happy Balance Docker images${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo ""

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    echo -e "${RED}❌ Not logged in to Docker Hub. Please run: docker login${NC}"
    exit 1
fi

# Build and push backend
echo -e "${GREEN}📦 Building backend...${NC}"
docker build -f Dockerfile.backend -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend .

echo -e "${GREEN}🏷️  Tagging backend...${NC}"
docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend-latest

if [ "$VERSION" != "latest" ]; then
    docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend-v${VERSION}
fi

echo -e "${GREEN}⬆️  Pushing backend...${NC}"
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend-latest

if [ "$VERSION" != "latest" ]; then
    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend-v${VERSION}
fi

# Build and push frontend (only if apps/frontend exists)
if [ -d "apps/frontend" ]; then
    echo ""
    echo -e "${GREEN}📦 Building frontend...${NC}"
    docker build -f Dockerfile.frontend -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend ./apps/frontend

    echo -e "${GREEN}🏷️  Tagging frontend...${NC}"
    docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend-latest

    if [ "$VERSION" != "latest" ]; then
        docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend-v${VERSION}
    fi

    echo -e "${GREEN}⬆️  Pushing frontend...${NC}"
    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend
    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend-latest

    if [ "$VERSION" != "latest" ]; then
        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend-v${VERSION}
    fi
else
    echo -e "${YELLOW}⚠️  Frontend directory not found, skipping frontend build${NC}"
fi

echo ""
echo -e "${GREEN}✅ All images built and pushed successfully!${NC}"
echo ""
echo -e "${YELLOW}Images pushed:${NC}"
echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend"
echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend-latest"
if [ "$VERSION" != "latest" ]; then
    echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:backend-v${VERSION}"
fi

if [ -d "apps/frontend" ]; then
    echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend"
    echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend-latest"
    if [ "$VERSION" != "latest" ]; then
        echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:frontend-v${VERSION}"
    fi
fi

echo ""
echo -e "${GREEN}Users can now update with:${NC}"
echo "  docker compose pull"
echo "  docker compose up -d"