# Happy Balance - Guía de Desarrollo Local

Esta guía te ayudará a levantar el proyecto en local con hot-reload para desarrollo rápido.

## 🚀 Quick Start

### 1. Preparar el entorno

```bash
# Copiar el archivo de variables de entorno
cp .env.dev.example .env

# (Opcional) Editar las variables si necesitas cambiar algo
nano .env
```

### 2. Levantar los servicios de desarrollo

```bash
# Levantar solo la base de datos y los contenedores de desarrollo
docker compose -f docker-compose.dev.yml up -d

# Ver los logs
docker compose -f docker-compose.dev.yml logs -f
```

### 3. Acceder a la aplicación

- **Frontend**: http://localhost:5173 (o http://192.168.1.170:5173 desde tu red local)
- **Backend API**: http://localhost:14040
- **Swagger Docs**: http://localhost:14040/api-docs
- **PostgreSQL**: localhost:15432

### 4. Credenciales por defecto

- **Usuario**: admin
- **Contraseña**: admin123

## 🔄 Hot Reload

Los servicios de desarrollo tienen hot-reload habilitado:

- **Backend**: Cambios en `apps/backend/src/**` se recargan automáticamente
- **Frontend**: Cambios en `apps/frontend/src/**` se recargan automáticamente con Vite HMR

## 🛠️ Comandos útiles

### Ver logs

```bash
# Ver todos los logs
docker compose -f docker-compose.dev.yml logs -f

# Ver logs solo del backend
docker compose -f docker-compose.dev.yml logs -f backend-dev

# Ver logs solo del frontend
docker compose -f docker-compose.dev.yml logs -f frontend-dev
```

### Reiniciar servicios

```bash
# Reiniciar todo
docker compose -f docker-compose.dev.yml restart

# Reiniciar solo el backend
docker compose -f docker-compose.dev.yml restart backend-dev
```

### Entrar al contenedor

```bash
# Entrar al contenedor del backend
docker exec -it happy-balance-backend-dev sh

# Entrar al contenedor del frontend
docker exec -it happy-balance-frontend-dev sh

# Entrar a PostgreSQL
docker exec -it happy-balance-postgres-dev psql -U postgres -d happy_balance
```

### Resetear la base de datos

```bash
# Parar los servicios
docker compose -f docker-compose.dev.yml down

# Eliminar el volumen de la BD (CUIDADO: esto borra todos los datos)
docker volume rm happy_balance_postgres_dev_data

# Volver a levantar
docker compose -f docker-compose.dev.yml up -d
```

### Limpiar todo (incluyendo volúmenes)

```bash
# Parar y eliminar todo
docker compose -f docker-compose.dev.yml down -v

# Volver a construir las imágenes
docker compose -f docker-compose.dev.yml build --no-cache

# Levantar de nuevo
docker compose -f docker-compose.dev.yml up -d
```

## 🐛 Debugging

### Backend (Node.js)

El backend corre con `tsx watch` que recarga automáticamente. Para debugging:

```bash
# Ver logs en tiempo real
docker compose -f docker-compose.dev.yml logs -f backend-dev

# Ejecutar comandos dentro del contenedor
docker exec -it happy-balance-backend-dev sh
cd /app/apps/backend
pnpm prisma studio  # Abrir Prisma Studio en http://localhost:5555
```

### Frontend (SvelteKit)

El frontend corre con Vite dev server con HMR:

```bash
# Ver logs en tiempo real
docker compose -f docker-compose.dev.yml logs -f frontend-dev

# Ver errores de compilación
docker exec -it happy-balance-frontend-dev sh
cd /app/apps/frontend
pnpm check  # Verificar tipos de TypeScript
```

### Base de datos

```bash
# Conectarse a PostgreSQL
docker exec -it happy-balance-postgres-dev psql -U postgres -d happy_balance

# Ejecutar migraciones
docker exec -it happy-balance-backend-dev sh -c "cd /app/apps/backend && pnpm db:push"

# Ver el esquema
docker exec -it happy-balance-backend-dev sh -c "cd /app/apps/backend && pnpm prisma studio"
```

## 📝 Notas importantes

1. **node_modules separados**: Los `node_modules` están en volúmenes de Docker separados para evitar conflictos entre tu sistema operativo y el contenedor.

2. **Primer inicio**: El primer inicio puede tardar unos minutos mientras se instalan las dependencias.

3. **Cambios en package.json**: Si cambias dependencias en `package.json`, necesitas reconstruir:
   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

4. **Puerto HMR**: El puerto 24678 es para Vite HMR (Hot Module Replacement). Si tienes problemas con hot-reload, verifica que este puerto esté disponible.

## 🔍 Troubleshooting

### El backend no arranca

```bash
# Ver los logs detallados
docker compose -f docker-compose.dev.yml logs backend-dev

# Reiniciar el backend
docker compose -f docker-compose.dev.yml restart backend-dev
```

### El frontend no conecta al backend

Verifica que `INTERNAL_API_URL` y `PUBLIC_API_URL` estén bien configurados en el archivo `.env`.

### Problemas con la base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker compose -f docker-compose.dev.yml ps postgres

# Ver logs de PostgreSQL
docker compose -f docker-compose.dev.yml logs postgres
```

### Hot reload no funciona

```bash
# Reconstruir los contenedores
docker compose -f docker-compose.dev.yml up -d --build

# Verificar que los volúmenes estén montados correctamente
docker inspect happy-balance-backend-dev | grep -A 10 Mounts
```

## 🎯 Workflow recomendado

1. **Levantar servicios**: `docker compose -f docker-compose.dev.yml up -d`
2. **Ver logs**: `docker compose -f docker-compose.dev.yml logs -f`
3. **Hacer cambios en el código**: Los cambios se reflejan automáticamente
4. **Si algo falla**: Revisar logs y reiniciar el servicio específico
5. **Al terminar**: `docker compose -f docker-compose.dev.yml down`
