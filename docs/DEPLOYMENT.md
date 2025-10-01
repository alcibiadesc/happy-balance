# 🚀 Deployment Instructions

## 📦 Build and Push Docker Images

### Prerrequisitos

1. Docker instalado y corriendo
2. Cuenta de Docker Hub
3. Login en Docker Hub: `docker login`

### Build y Push de Imágenes

#### Backend

```bash
# Build backend image
docker build -f Dockerfile.backend -t alcibiadesc/happy-balance:backend .

# Tag como latest
docker tag alcibiadesc/happy-balance:backend alcibiadesc/happy-balance:backend-latest

# Push ambas versiones
docker push alcibiadesc/happy-balance:backend
docker push alcibiadesc/happy-balance:backend-latest

# (Opcional) Tag con versión específica
docker tag alcibiadesc/happy-balance:backend alcibiadesc/happy-balance:backend-v1.1.0
docker push alcibiadesc/happy-balance:backend-v1.1.0
```

#### Frontend

```bash
# Build frontend image (desde la raíz del proyecto)
docker build -f Dockerfile.frontend -t alcibiadesc/happy-balance:frontend ./apps/frontend

# Tag como latest
docker tag alcibiadesc/happy-balance:frontend alcibiadesc/happy-balance:frontend-latest

# Push ambas versiones
docker push alcibiadesc/happy-balance:frontend
docker push alcibiadesc/happy-balance:frontend-latest

# (Opcional) Tag con versión específica
docker tag alcibiadesc/happy-balance:frontend alcibiadesc/happy-balance:frontend-v1.1.0
docker push alcibiadesc/happy-balance:frontend-v1.1.0
```

#### Build y Push Todo de una vez

```bash
# Script completo
VERSION="1.1.0"

# Backend
docker build -f Dockerfile.backend -t alcibiadesc/happy-balance:backend .
docker tag alcibiadesc/happy-balance:backend alcibiadesc/happy-balance:backend-latest
docker tag alcibiadesc/happy-balance:backend alcibiadesc/happy-balance:backend-v${VERSION}
docker push alcibiadesc/happy-balance:backend
docker push alcibiadesc/happy-balance:backend-latest
docker push alcibiadesc/happy-balance:backend-v${VERSION}

# Frontend
docker build -f Dockerfile.frontend -t alcibiadesc/happy-balance:frontend ./apps/frontend
docker tag alcibiadesc/happy-balance:frontend alcibiadesc/happy-balance:frontend-latest
docker tag alcibiadesc/happy-balance:frontend alcibiadesc/happy-balance:frontend-v${VERSION}
docker push alcibiadesc/happy-balance:frontend
docker push alcibiadesc/happy-balance:frontend-latest
docker push alcibiadesc/happy-balance:frontend-v${VERSION}

echo "✅ Images built and pushed successfully!"
```

## 🔄 Actualización para Usuarios Finales

Una vez que las imágenes estén en Docker Hub, tus amigos solo necesitan:

```bash
# Pull última versión
docker compose pull

# Recrear contenedores
docker compose up -d

# Ver logs
docker logs happy-balance-backend
```

## 🆕 Cambios en esta versión

### v1.1.0 - Auto-seed Admin User

**Problema resuelto:**
- Error 500 en `/api/auth/login` cuando se inicia por primera vez
- Usuario admin no se creaba automáticamente

**Solución:**
- El backend ahora crea automáticamente el usuario admin al iniciar
- Usa las credenciales de las variables de entorno:
  - `ADMIN_USERNAME` (default: admin)
  - `ADMIN_PASSWORD` (default: admin123)

**Beneficios:**
- ✅ Zero-configuration: funciona inmediatamente después de `docker compose up`
- ✅ Login exitoso en el primer intento
- ✅ No requiere ejecutar comandos adicionales de seed

## 🔧 Troubleshooting

### Si el login aún falla después de actualizar

```bash
# 1. Ver logs del backend
docker logs happy-balance-backend

# Buscar el mensaje: "✅ Admin user 'admin' created successfully"

# 2. Si no aparece, verificar variables de entorno
docker exec happy-balance-backend env | grep ADMIN

# 3. Recrear contenedor forzando pull
docker compose down
docker compose pull
docker compose up -d

# 4. Si persiste, eliminar volumen de base de datos (CUIDADO: borra datos)
docker compose down -v
docker compose up -d
```

### Verificar que el backend está usando la nueva versión

```bash
# Ver la imagen del contenedor
docker inspect happy-balance-backend | grep Image

# Debe mostrar la versión más reciente
```

## 📝 Notas

- Las imágenes en Docker Hub se actualizan cuando haces push
- Los usuarios deben hacer `docker compose pull` para obtener la última versión
- El tag `latest` siempre apunta a la versión más reciente
- Se recomienda usar tags de versión para releases específicos