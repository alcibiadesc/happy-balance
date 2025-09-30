# Docker Image Optimization Guide

## Overview

This document explains the optimizations applied to reduce Docker image sizes for the Happy Balance application.

## Current vs Optimized Sizes

### Before Optimization
- **Backend**: 2.28GB
- **Frontend**: 512MB
- **Total**: ~2.8GB

### After Optimization (Expected)
- **Backend**: ~200-300MB (85-87% reduction)
- **Frontend**: ~150-200MB (60-65% reduction)
- **Total**: ~350-500MB (80% reduction)

## Optimization Strategies

### 1. Multi-Stage Builds

Both Dockerfiles use 4-stage builds:
1. **deps**: Install all dependencies
2. **builder**: Build the application
3. **prod-deps** (backend only): Install production dependencies separately
4. **production**: Runtime image with minimal dependencies

### 2. Alpine Linux Base

Using `node:20-alpine` instead of full `node:20`:
- Reduces base image from ~900MB to ~120MB
- Smaller attack surface
- Still includes all necessary Node.js features

### 3. Production Dependencies Only

```dockerfile
# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile \
    --prefer-offline && \
    pnpm store prune
```

### 4. Build Artifact Cleanup

```dockerfile
# Remove source files after build
RUN pnpm build && \
    rm -rf src tsconfig.json static
```

### 5. Improved .dockerignore

Excludes:
- Test files (`*.test.ts`, `*.spec.ts`)
- Documentation (`*.md` files)
- Development configs
- Media files (images, except frontend static assets)
- Git files
- IDE configurations
- Cache directories

### 6. pnpm Store Pruning

```dockerfile
RUN pnpm install --prod && \
    pnpm store prune
```

Removes unused packages from pnpm store.

### 7. corepack for pnpm

```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
```

Uses built-in corepack instead of `npm install -g pnpm`, reducing size.

### 8. Memory Limits

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512"  # Backend
ENV NODE_OPTIONS="--max-old-space-size=256"  # Frontend
```

Prevents excessive memory usage in containers.

### 9. dumb-init for Signal Handling

```dockerfile
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
```

Properly handles signals (SIGTERM, SIGINT) for graceful shutdowns.

## Build Commands

### Backend Optimized
```bash
docker build -f Dockerfile.backend.optimized \
  -t alcibiadesc/happy-balance:backend-optimized \
  --platform linux/amd64,linux/arm64 .
```

### Frontend Optimized
```bash
docker build -f Dockerfile.frontend.optimized \
  -t alcibiadesc/happy-balance:frontend-optimized \
  --platform linux/amd64,linux/arm64 .
```

### Multi-platform Build
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.backend.optimized \
  -t alcibiadesc/happy-balance:backend-optimized \
  --push .
```

## Verification

Check image sizes:
```bash
docker images | grep happy-balance
```

Inspect layers:
```bash
docker history happy-balance-backend:optimized
```

Run container:
```bash
docker run -p 3004:3004 happy-balance-backend:optimized
```

## Best Practices Applied

### ✅ Security
- Non-root user (`backend`/`frontend` user with UID 1001)
- Minimal runtime dependencies
- Health checks configured
- No secrets in image

### ✅ Performance
- Layering optimized (dependency layers cached separately)
- Minimal runtime footprint
- Memory limits set
- Proper signal handling with dumb-init

### ✅ Size
- Multi-stage builds
- Production dependencies only
- No dev dependencies or build artifacts
- Comprehensive .dockerignore

### ✅ Maintainability
- Clear stage separation
- Comments explaining each stage
- Consistent patterns across frontend/backend
- Environment variables documented

## Comparison with Legacy Images

### Old Backend Dockerfile (`apps/backend/Dockerfile.frontend`)
- ❌ Installs ALL dependencies (including dev)
- ❌ Uses ts-node in production (slower)
- ❌ Larger image size
- ❌ No build optimization

### New Optimized Dockerfile
- ✅ Production dependencies only
- ✅ Compiled JavaScript (faster startup)
- ✅ 85%+ size reduction
- ✅ Separate build and runtime stages

## Troubleshooting

### Issue: "Module not found"
**Solution**: Check if dependency is in `dependencies` (not `devDependencies`)

### Issue: "Prisma client not generated"
**Solution**: Ensure `npx prisma generate` runs in builder stage

### Issue: "Permission denied"
**Solution**: Verify file ownership with `chown -R backend:nodejs /app`

### Issue: "Health check failing"
**Solution**: Check if application is listening on correct PORT

## Future Optimizations

1. **Distroless Images**: Consider using distroless Node.js images for even smaller size
2. **Layer Caching**: Implement BuildKit cache mounts
3. **Shared Layers**: Extract common dependencies to shared base image
4. **Compression**: Enable experimental compression features

## Monitoring

Track image sizes over time:
```bash
docker history --no-trunc happy-balance-backend:optimized | \
  awk '{print $5}' | \
  tail -n +2 | \
  numfmt --from=iec --to=iec --suffix=B
```

## References

- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [pnpm in Docker](https://pnpm.io/docker)
- [Alpine Linux](https://alpinelinux.org/)
