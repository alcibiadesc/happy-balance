#!/bin/bash
set -e

echo "🚀 Building and Pushing Optimized Docker Images"
echo "================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USER="alcibiadesc"
REPO="happy-balance"
PLATFORMS="linux/amd64,linux/arm64"

echo -e "${BLUE}📦 Step 1: Building Backend Optimized Image${NC}"
echo "Building for platforms: $PLATFORMS"
docker buildx build \
  --platform $PLATFORMS \
  -f Dockerfile.backend.optimized \
  -t ${DOCKER_USER}/${REPO}:backend-optimized \
  -t ${DOCKER_USER}/${REPO}:backend-latest \
  --push \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backend image built and pushed successfully${NC}"
else
  echo -e "${YELLOW}❌ Backend image build failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}📦 Step 2: Building Frontend Optimized Image${NC}"
docker buildx build \
  --platform $PLATFORMS \
  -f Dockerfile.frontend.optimized \
  -t ${DOCKER_USER}/${REPO}:frontend-optimized \
  -t ${DOCKER_USER}/${REPO}:frontend-latest \
  --push \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend image built and pushed successfully${NC}"
else
  echo -e "${YELLOW}❌ Frontend image build failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All images built and pushed successfully!${NC}"
echo ""
echo "Images pushed:"
echo "  - ${DOCKER_USER}/${REPO}:backend-optimized"
echo "  - ${DOCKER_USER}/${REPO}:backend-latest"
echo "  - ${DOCKER_USER}/${REPO}:frontend-optimized"
echo "  - ${DOCKER_USER}/${REPO}:frontend-latest"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.yml to use optimized images"
echo "  2. Test deployment: docker-compose up -d"
echo "  3. Verify functionality and performance"
