# 🐳 Instalación con Docker

## Requisitos Previos

- Docker y Docker Compose instalados
- 2GB de RAM disponible
- Puertos 3000 y 3004 libres

## 🚀 Instalación Rápida

### Opción 1: Usando Imágenes Pre-construidas (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Editar .env y cambiar las contraseñas
nano .env

# 4. Iniciar con Docker Compose
docker-compose up -d

# 5. Verificar que todo está funcionando
docker-compose ps
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3004

### Opción 2: Construir desde el Código Fuente

```bash
# 1. Clonar el repositorio
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Construir y ejecutar
docker-compose build
docker-compose up -d
```

## 🎯 Instalación con Portainer

### Stack desde GitHub

1. En Portainer, ve a **Stacks** → **Add stack**
2. Selecciona **Repository**
3. Configura:
   - **Repository URL**: `https://github.com/alcibiadesc/happy-balance`
   - **Repository reference**: `main`
   - **Compose path**: `docker-compose.yml`

4. En **Environment variables**, añade:
   ```
   POSTGRES_PASSWORD=tu-password-segura
   JWT_ACCESS_SECRET=tu-secret-key
   JWT_REFRESH_SECRET=tu-refresh-key
   ADMIN_PASSWORD=tu-password-admin
   ```

5. Click en **Deploy the stack**

### Stack desde Web Editor

1. En Portainer, ve a **Stacks** → **Add stack**
2. Nombre: `happy-balance`
3. Pega este contenido en el Web editor:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-cambiar-esta-password}
      POSTGRES_DB: happy_balance
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - happy-balance-net

  backend:
    image: alcibiadesc/happy-balance-backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-cambiar-esta-password}@postgres:5432/happy_balance
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-cambiar-este-secret}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-cambiar-este-secret}
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin123}
      NODE_ENV: production
    depends_on:
      - postgres
    ports:
      - "3004:3004"
    networks:
      - happy-balance-net
    volumes:
      - backend_uploads:/app/uploads

  frontend:
    image: alcibiadesc/happy-balance-frontend:latest
    environment:
      VITE_API_URL: http://localhost:3004/api
    depends_on:
      - backend
    ports:
      - "3000:3000"
    networks:
      - happy-balance-net

networks:
  happy-balance-net:
    driver: bridge

volumes:
  postgres_data:
  backend_uploads:
```

4. Configura las variables de entorno en la sección inferior
5. Click en **Deploy the stack**

## 🔐 Configuración de Seguridad

### Variables de Entorno Importantes

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | postgres |
| `JWT_ACCESS_SECRET` | Secret para tokens JWT | change-this-secret |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | change-this-secret |
| `ADMIN_USERNAME` | Usuario administrador | admin |
| `ADMIN_PASSWORD` | Contraseña del admin | admin123 |

⚠️ **IMPORTANTE**: Cambia TODAS las contraseñas y secrets antes de usar en producción.

## 📊 Verificación de la Instalación

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs del backend
docker-compose logs backend

# Ver logs del frontend
docker-compose logs frontend

# Verificar salud de la base de datos
docker-compose exec postgres pg_isready
```

## 🔧 Comandos Útiles

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart backend

# Ver logs en tiempo real
docker-compose logs -f

# Ejecutar comandos en el backend
docker-compose exec backend npm run prisma:studio
```

## 🆘 Solución de Problemas

### Puerto en uso
Si el puerto 3000 o 3004 está en uso:
1. Edita `.env`
2. Cambia `FRONTEND_PORT=3001` o `BACKEND_PORT=3005`
3. Reinicia con `docker-compose up -d`

### Error de conexión a la base de datos
```bash
# Verificar que postgres está corriendo
docker-compose ps postgres

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar postgres
docker-compose restart postgres
```

### Limpiar instalación
```bash
# Parar y eliminar todo (incluyendo datos)
docker-compose down -v
rm -rf data/

# Volver a empezar
docker-compose up -d
```

## 📱 Acceso a la Aplicación

Una vez instalado, accede a:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3004/api
- **Health Check**: http://localhost:3004/health

Credenciales por defecto:
- Usuario: `admin`
- Contraseña: `admin123` (o la que hayas configurado)

## 🔄 Actualizaciones

Para actualizar a la última versión:

```bash
# Descargar últimas imágenes
docker-compose pull

# Reiniciar servicios
docker-compose up -d
```

## 💡 Tips para Producción

1. **Usa un proxy inverso** (Nginx, Traefik) para HTTPS
2. **Configura backups** automáticos de la base de datos
3. **Monitorea logs** con herramientas como Grafana/Loki
4. **Limita recursos** con limits en docker-compose
5. **Usa secrets de Docker** en lugar de variables de entorno

---

¿Necesitas ayuda? Abre un issue en [GitHub](https://github.com/alcibiadesc/happy-balance/issues)