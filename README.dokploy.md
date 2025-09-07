# 🚀 Dokploy Deployment Guide - Expense Tracker

> **Guía completa para desplegar Expense Tracker con Dokploy usando un solo docker-compose.yml**

## 📋 Pre-requisitos

- ✅ Servidor con Dokploy instalado
- ✅ Docker y Docker Compose disponibles
- ✅ Repositorio Git accesible (GitHub, GitLab, etc.)
- ✅ Dominio configurado (opcional)

## 🎯 Estrategia de Deployment

### Arquitectura Unificada
```
🏗️ docker-compose.dokploy.yml
├── 🐘 PostgreSQL 16 (datos persistentes)
├── 🌟 App SvelteKit (multi-stage build)
└── 📊 PgAdmin (opcional - profile admin)
```

### Ventajas de esta configuración:
- **✨ Un solo archivo** - Fácil de gestionar
- **🔒 Seguro** - Variables de entorno protegidas
- **📦 Escalable** - Réplicas fáciles de configurar  
- **💾 Persistente** - Volúmenes para datos críticos
- **🏥 Monitoreado** - Health checks integrados

## 🚀 Pasos de Deployment en Dokploy

### 1️⃣ Crear Nuevo Proyecto
```bash
# En Dokploy Dashboard
1. Crear nuevo proyecto: "expense-tracker"
2. Tipo: "Docker Compose"
3. Repositorio: tu-repo/expense-tracker
4. Branch: main (o tu branch principal)
```

### 2️⃣ Configurar Docker Compose
```bash
# En configuración del proyecto
1. Docker Compose File: "docker-compose.dokploy.yml"
2. Build Path: "." (raíz del repositorio)
```

### 3️⃣ Configurar Variables de Entorno
```bash
# CRÍTICAS (OBLIGATORIAS):
SECRET_KEY="tu_clave_super_secreta_aqui_2024"
POSTGRES_PASSWORD="password_seguro_db_2024"

# BÁSICAS:
NODE_ENV="production"
POSTGRES_DB="expense_tracker"
POSTGRES_USER="expense_tracker"

# OPCIONALES:
PUBLIC_APP_NAME="Mi Expense Tracker"
ENABLE_ANALYTICS="true"
CURRENCY_API_KEY="tu_api_key_si_tienes"
```

### 4️⃣ Configurar Puertos y Dominios
```bash
# Puerto principal
Port: 3000 → tu-dominio.com

# Puerto admin (opcional)
Port: 5050 → admin.tu-dominio.com
```

### 5️⃣ Deploy!
```bash
# En Dokploy
1. Verificar configuración
2. Click "Deploy"
3. Monitorear logs en tiempo real
```

## 🎛️ Configuraciones Avanzadas

### Profiles Disponibles
```bash
# Producción básica (default)
docker compose -f docker-compose.dokploy.yml up -d

# Con PgAdmin para administración
docker compose -f docker-compose.dokploy.yml --profile admin up -d
```

### Variables de Entorno Principales

| Variable | Descripción | Default | Requerida |
|----------|-------------|---------|-----------|
| `SECRET_KEY` | Clave secreta de la app | - | ✅ |
| `POSTGRES_PASSWORD` | Contraseña DB | - | ✅ |
| `NODE_ENV` | Entorno de ejecución | `production` | - |
| `PORT` | Puerto externo | `3000` | - |
| `PUBLIC_APP_NAME` | Nombre de la app | `Expense Tracker` | - |
| `ENABLE_ANALYTICS` | Activar analytics | `true` | - |

### Volúmenes Críticos
```bash
postgres_data     # 📊 Datos de PostgreSQL (CRÍTICO)
app_logs         # 📝 Logs de aplicación  
pgladmin_data    # 👨‍💼 Configuración PgAdmin
```

## 📊 Monitoreo y Mantenimiento

### Health Checks Configurados
```bash
# PostgreSQL
✅ Verifica conexión DB cada 10s

# Aplicación  
✅ Health endpoint /health cada 30s
✅ Reinicio automático si falla
```

### Comandos Útiles Post-Deploy
```bash
# Ver estado de servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f app

# Acceso directo a DB
docker compose exec postgres psql -U expense_tracker -d expense_tracker

# Restart de un servicio específico
docker compose restart app

# Scaling de la aplicación
docker compose up -d --scale app=3
```

### Backup de Datos
```bash
# Backup manual de PostgreSQL
docker compose exec postgres pg_dump -U expense_tracker expense_tracker > backup.sql

# Restaurar backup
docker compose exec -T postgres psql -U expense_tracker expense_tracker < backup.sql
```

## 🔧 Troubleshooting

### Problemas Comunes

#### App no inicia
```bash
# Verificar logs
docker compose logs app

# Común: Variable de entorno faltante
# Solución: Verificar SECRET_KEY y POSTGRES_PASSWORD
```

#### Database connection error
```bash
# Verificar estado de PostgreSQL
docker compose logs postgres

# Verificar health check
docker compose ps

# Común: PostgreSQL aún inicializando
# Solución: Esperar ~30s, verificar health check
```

#### Performance Issues
```bash
# Verificar recursos
docker stats

# Escalar aplicación
docker compose up -d --scale app=2

# Optimizar DB
docker compose exec postgres psql -U expense_tracker -c "VACUUM ANALYZE;"
```

## 🎯 Configuración Específica por Entorno

### Staging
```bash
NODE_ENV="staging"
PUBLIC_APP_NAME="Expense Tracker - Staging"
ENABLE_ANALYTICS="false"
```

### Production
```bash
NODE_ENV="production" 
SECRET_KEY="ultra_secure_production_key"
POSTGRES_PASSWORD="ultra_secure_db_password"
ENABLE_ANALYTICS="true"
```

### Development (Local)
```bash
NODE_ENV="development"
BUILD_TARGET="development"
BIND_MOUNT_SOURCE="."  # Bind mount para hot reload
```

## 📈 Optimizaciones de Producción

### Recursos Recomendados
```bash
# Aplicación
CPU: 1 vCPU
RAM: 512MB - 1GB
Storage: 5GB (logs + builds)

# PostgreSQL  
CPU: 0.5 vCPU
RAM: 256MB - 512MB
Storage: 10GB+ (datos)
```

### Seguridad
```bash
# Variables críticas en Dokploy Secrets
✅ SECRET_KEY
✅ POSTGRES_PASSWORD  
✅ CURRENCY_API_KEY (si se usa)

# Network isolation
✅ Red interna entre servicios
✅ Solo puertos necesarios expuestos
```

## 🎉 Post-Deployment Checklist

- [ ] ✅ App accesible en el dominio configurado
- [ ] ✅ Database creada y migrada automáticamente  
- [ ] ✅ Health checks pasando (verde en Dokploy)
- [ ] ✅ Logs sin errores críticos
- [ ] ✅ PgAdmin accesible (si configurado)
- [ ] ✅ Backup strategy configurada
- [ ] ✅ Monitoreo y alertas configuradas

---

### 🎯 **¡Con esta configuración, tu Expense Tracker estará desplegado de forma profesional en minutos!**

**Soporte:** Si encuentras algún issue, revisa los logs con `docker compose logs -f` y verifica las variables de entorno críticas.