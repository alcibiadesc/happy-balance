# 🐳 Docker Configuration

## Configuración Unificada

Este proyecto usa **un solo archivo `docker-compose.yml`** con configuración dinámica basada en variables de entorno y profiles:

- **Variables de entorno**: `.env.development`, `.env.production`
- **Profiles**: `monitoring`, `production`, `dev-full`
- **Redes segmentadas**: Arquitectura de 4 capas de red

## 🔗 Comunicación entre Servicios

### Desarrollo Local
- **Frontend → Backend**: `http://localhost:3004/api` (navegador del host accede via localhost)
- **Backend → PostgreSQL**: `postgresql://postgres:postgres@postgres:5432/happy_balance` (red interna Docker)

### Producción
- **Frontend → Backend**: `http://backend:3004/api` (comunicación interna entre contenedores)
- **Backend → PostgreSQL**: `postgresql://postgres:postgres@postgres:5432/happy_balance` (red interna Docker)

## 🏗️ Arquitectura de Red Segmentada

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND NETWORK (172.20.1.0/24)          │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │    Frontend     │    │     Nginx       │               │
│  │   (SvelteKit)   │    │   (Reverse      │               │
│  │                 │    │    Proxy)       │               │
│  └─────────────────┘    └─────────────────┘               │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│               APPLICATION NETWORK (172.20.2.0/24)          │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │     Backend     │    │     Redis       │               │
│  │   (Express +    │    │    (Cache)      │               │
│  │    Prisma)      │    │                 │               │
│  └─────────────────┘    └─────────────────┘               │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                DATABASE NETWORK (172.20.3.0/24)            │
│                      [INTERNAL - NO EXTERNAL ACCESS]        │
│  ┌─────────────────┐                                       │
│  │   PostgreSQL    │                                       │
│  │                 │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               MONITORING NETWORK (172.20.4.0/24)           │
│  ┌─────────────────┐                                       │
│  │   Prometheus    │                                       │
│  │   (Metrics)     │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Comandos

### Desarrollo Local
```bash
# Básico - solo servicios esenciales
docker compose up -d

# Con archivo de entorno específico
docker compose --env-file .env.development up -d

# Con servicios adicionales (Redis)
docker compose --profile dev-full up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Parar servicios
docker compose down

# Limpiar volúmenes (⚠️ elimina datos de BD)
docker compose down -v
```

### Producción
```bash
# Producción con configuración segura
docker compose --env-file .env.production --profile production up -d

# Con monitoreo completo
docker compose --env-file .env.production --profile monitoring up -d

# Build y push de imágenes
docker compose build
docker compose push
```

### Perfiles Disponibles

- **Por defecto**: `postgres`, `backend`, `frontend`
- **`dev-full`**: Incluye Redis para desarrollo completo
- **`production`**: Incluye Nginx como reverse proxy
- **`monitoring`**: Incluye Prometheus y Redis para observabilidad

## 🌐 Puertos y Acceso - Arquitectura de Seguridad Optimizada

### ✅ Desarrollo Básico (Recomendado)
```bash
docker compose up -d
```
- **Frontend**: http://localhost:3000 ← Solo puerto necesario
- **Backend**: Comunicación interna (sin puerto expuesto)
- **PostgreSQL**: Comunicación interna (sin puerto expuesto)

### 🔧 Desarrollo con Acceso Directo (Para debugging)
```bash
# Exponer solo cuando necesites herramientas externas
POSTGRES_PORT=5432 BACKEND_PORT=3004 docker compose up -d

# O usar override completo
docker compose -f docker-compose.yml -f docker-compose.development.yml up -d
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3004 (para testing directo)
- **PostgreSQL**: localhost:5432 (para pgAdmin, DataGrip, etc.)

### 🔒 Producción (Completamente Seguro)
```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```
- **Solo Nginx expuesto**: puerto 80/443
- **Frontend, Backend y PostgreSQL**: solo comunicación interna
- **Red de base de datos**: completamente interna (`internal: true`)

## 💾 Volúmenes Persistentes

- `happy_balance_postgres_data`: Datos de PostgreSQL
- `happy_balance_uploads`: Archivos subidos al backend

## 🔧 Variables de Entorno

### Archivos de Configuración

- `.env.development` - Variables para desarrollo local
- `.env.production` - Variables para producción (con placeholders)
- `.env.example` - Template con todas las variables disponibles

### 🔐 Variables de Control de Seguridad

| Variable | Desarrollo Básico | Desarrollo Full | Producción | Descripción |
|----------|-------------------|-----------------|------------|-------------|
| `POSTGRES_PORT` | `vacío` (no expuesto) | `5432` | `vacío` | Control de exposición PostgreSQL |
| `BACKEND_PORT` | `vacío` (no expuesto) | `3004` | `vacío` | Control de exposición Backend API |
| `DATABASE_NETWORK_INTERNAL` | `false` | `false` | `true` | Red de BD completamente interna |
| `VITE_API_URL` | `http://localhost:3004/api` | `http://localhost:3004/api` | `https://api.dominio.com` | URL del backend para frontend |
| `CORS_ORIGIN` | Localhost múltiple | Localhost múltiple | Dominio específico | Control de CORS |

### 🛡️ Principio de Seguridad: Zero Trust por Defecto

- **✅ Por defecto**: Solo frontend expuesto (puerto 3000)
- **🔧 Bajo demanda**: Backend y PostgreSQL se exponen solo cuando se especifica
- **🔒 Producción**: Cero exposición - toda comunicación interna
- **🎯 Granular**: Control individual por servicio via variables

## 🔒 Seguridad

### Producción
- Puertos internos no expuestos al host
- CORS restrictivo con dominios específicos
- Variables de entorno específicas para producción
- Usuario no-root en contenedores

### Desarrollo
- Puertos expuestos para debugging
- CORS permisivo para desarrollo local
- Acceso directo a PostgreSQL para herramientas

## 🏗️ Arquitectura Docker

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   PostgreSQL    │
│   (SvelteKit)   │    │   (Express +    │    │                 │
│                 │    │    Prisma)      │    │                 │
│   Port: 3000    │◄──►│   Port: 3004    │◄──►│   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼───────────────────────▼───────────────────────▼────┐
    │              Docker Network (default)                   │
    └─────────────────────────────────────────────────────────┘
```

## 📝 Troubleshooting

### Problema: PostgreSQL version incompatible
```bash
# Solución: Limpiar volúmenes y reiniciar
docker compose down -v
docker system prune -f
docker compose up -d
```

### Problema: Puerto ya en uso
```bash
# Ver qué está usando el puerto
lsof -i :3000
# O cambiar el puerto en docker-compose.override.yml
```

### Problema: Logs de debugging
```bash
# Ver logs detallados
docker compose logs --details frontend
docker compose logs --details backend
```

## 🛡️ Beneficios de la Arquitectura de Red

### Seguridad por Capas
1. **Frontend Network**: Solo frontend y proxy pueden comunicarse
2. **Application Network**: Backend y servicios de aplicación aislados
3. **Database Network**: Base de datos completamente aislada en producción
4. **Monitoring Network**: Métricas y observabilidad separadas

### Escalabilidad
- Fácil agregar servicios por capa (cache, queue, monitoring)
- Aislamiento de tráfico por función
- Control granular de comunicación entre servicios

### Flexibilidad
- Un solo archivo para todos los entornos
- Configuración dinámica con variables
- Profiles para diferentes necesidades

## 🔄 Workflow Recomendado

### Desarrollo
```bash
# Desarrollo básico
docker compose --env-file .env.development up -d

# Desarrollo con todas las características
docker compose --env-file .env.development --profile dev-full up -d
```

### Producción
```bash
# Producción segura
docker compose --env-file .env.production --profile production up -d

# Producción con monitoreo
docker compose --env-file .env.production --profile monitoring up -d
```

### Testing de Configuración
```bash
# Probar configuración de producción localmente
DATABASE_NETWORK_INTERNAL=true POSTGRES_PORT= BACKEND_PORT= docker compose up -d

# Verificar que no hay puertos expuestos innecesarios
docker compose ps

# Confirmar segmentación de red
docker network inspect happy_balance_db --format '{{.Internal}}'
```

## 🚨 Resumen de Optimización de Seguridad

### ✅ Antes vs Después

| Aspecto | ❌ Antes (Inseguro) | ✅ Después (Optimizado) |
|---------|----------------------|---------------------------|
| **PostgreSQL** | Siempre expuesto :5432 | Solo bajo demanda o nunca |
| **Backend API** | Siempre expuesto :3004 | Solo bajo demanda o nunca |
| **Comunicación** | Via localhost expuesto | Via Docker networks internas |
| **Producción** | Misma configuración | Red de BD completamente interna |
| **Desarrollo** | Todo expuesto siempre | Granular: exponer solo lo necesario |
| **Superficie de ataque** | 3 puertos siempre | 1 puerto por defecto, 0 en producción |

### 🛡️ Beneficios de Seguridad Logrados

1. **Reducción de superficie de ataque**: De 3 puertos a 1 por defecto
2. **Principio de menor privilegio**: Solo se expone lo estrictamente necesario
3. **Segregación de red**: Base de datos completamente aislada en producción
4. **Configuración defensiva**: Seguro por defecto, inseguro bajo demanda
5. **Zero Trust**: Cada exposición debe ser explícitamente autorizada

### 🔍 Cómo Verificar la Seguridad

```bash
# 1. Verificar puertos expuestos mínimos
docker compose ps
# Debe mostrar solo :3000->3000 (frontend)

# 2. Confirmar conectividad interna funciona
docker compose exec frontend curl http://backend:3004/health
# Debe responder OK

# 3. Verificar aislamiento de base de datos en producción
docker network inspect happy_balance_db --format '{{.Internal}}'
# Debe mostrar "true" con el override de producción

# 4. Confirmar que no hay acceso externo a PostgreSQL
psql -h localhost -p 5432 -U postgres
# Debe fallar con "connection refused" (a menos que POSTGRES_PORT esté definido)
```