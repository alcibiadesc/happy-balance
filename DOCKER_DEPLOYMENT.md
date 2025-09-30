# Happy Balance - Docker Deployment

Versión lista para usar con imágenes pre-construidas desde Docker Hub.

## 🚀 Inicio Rápido

### 1. Descargar docker-compose.yml

```bash
curl -O https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/docker-compose.yml
```

O crear manualmente con este contenido mínimo:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: happy_balance
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    image: alcibiadesc/happy-balance:backend-latest
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/happy_balance
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: admin123
    ports:
      - "3004:3004"
    depends_on:
      - postgres

  frontend:
    image: alcibiadesc/happy-balance:frontend-latest
    environment:
      INTERNAL_API_URL: http://backend:3004/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 2. Iniciar la aplicación

```bash
docker compose up -d
```

### 3. Acceder a la aplicación

Abre tu navegador en: **http://localhost:3000**

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

## 📦 Imágenes Docker Hub

- **Backend**: `alcibiadesc/happy-balance:backend-latest`
- **Frontend**: `alcibiadesc/happy-balance:frontend-latest`

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` para personalizar:

```env
# Puertos
BACKEND_PORT=3004
FRONTEND_PORT=3000

# Base de datos
POSTGRES_PASSWORD=tu_password_seguro

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro

# JWT (producción)
JWT_ACCESS_SECRET=tu-clave-secreta-minimo-32-caracteres
JWT_REFRESH_SECRET=otra-clave-secreta-minimo-32-caracteres

# CORS
CORS_ORIGIN=https://tudominio.com

# Origin (SvelteKit)
ORIGIN=https://tudominio.com
```

### Acceso desde otras máquinas en la red

Reemplaza `localhost` por la IP de tu servidor:
```
http://192.168.1.XXX:3000
```

## 🛠️ Comandos Útiles

```bash
# Ver logs
docker compose logs -f

# Reiniciar servicios
docker compose restart

# Parar todo
docker compose down

# Actualizar a última versión
docker compose pull
docker compose up -d

# Ver estado
docker compose ps
```

## 🔄 Actualización

Para actualizar a la última versión:

```bash
docker compose pull
docker compose up -d
```

## 📊 Puertos

- **Frontend**: 3000
- **Backend**: 3004
- **PostgreSQL**: 5432 (interno)

## 💾 Persistencia de Datos

Los datos se guardan en volúmenes Docker:
- `happy_balance_postgres_data`: Base de datos
- `happy_balance_uploads_data`: Archivos subidos

## 🐛 Solución de Problemas

### Error: Puerto en uso

```bash
# Encontrar y matar proceso
lsof -ti:3000 | xargs kill -9
lsof -ti:3004 | xargs kill -9
```

### Resetear base de datos

```bash
docker compose down -v
docker compose up -d
```

### Ver logs de errores

```bash
docker compose logs backend
docker compose logs frontend
```

## 📝 Desarrollo Local

Para desarrollo con hot-reload, ver [DEV_SETUP.md](./DEV_SETUP.md)
