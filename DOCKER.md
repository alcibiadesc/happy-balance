# Docker

## Instalación

```bash
# Opción 1: Con el código (construye local)
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance
docker-compose up -d --build

# Opción 2: Sin el código (usa Docker Hub)
curl -O https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/docker-compose.yml
docker-compose up -d
```

## Acceso

- Frontend: http://localhost:3000
- Backend: http://localhost:3004
- Login: admin / admin123

## Variables importantes

```yaml
POSTGRES_PASSWORD: postgres         # Cambiar en producción
JWT_ACCESS_SECRET: your-secret-key  # Cambiar en producción
JWT_REFRESH_SECRET: your-refresh-key # Cambiar en producción
ADMIN_PASSWORD: admin123            # Cambiar en producción
```

## Comandos

```bash
docker-compose up -d      # Iniciar
docker-compose down       # Parar
docker-compose down -v    # Borrar todo
docker-compose logs -f    # Ver logs
```