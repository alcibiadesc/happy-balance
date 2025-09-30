# Development Setup

Para desarrollo local con hot reload:

## Iniciar solo la base de datos
```bash
docker compose -f docker-compose.dev.yml up -d
```

## Generar el cliente de Prisma (primera vez)
```bash
cd apps/backend
npx prisma generate
npx prisma db seed  # Crear usuario admin
```

## Iniciar el backend y frontend
```bash
# Desde la raíz del proyecto
pnpm dev
```

Esto iniciará:
- Backend en http://localhost:3004
- Frontend en http://localhost:5173

## Credenciales por defecto
- Usuario: admin
- Contraseña: admin123

## Parar los servicios
```bash
# Parar dev servers: Ctrl+C
# Parar postgres:
docker compose -f docker-compose.dev.yml down
```