# 🐳 Docker Development Setup

## ✨ Nuevo Sistema Unificado

**Un solo comando para levantar todo el entorno:**

```bash
pnpm dev
```

## 🚀 Comandos Disponibles

```bash
# Levantar todo el entorno (frontend + backend + DB)
pnpm dev

# Ver logs en tiempo real
pnpm dev:logs

# Parar todos los servicios
pnpm dev:down

# Limpiar todo (volúmenes, contenedores, etc.)
pnpm dev:clean
```

## 🎯 Lo Que Incluye

### 🐘 PostgreSQL

- **Puerto**: 5432
- **Base de datos**: `happy_balance`
- **Usuario**: `postgres`
- **Contraseña**: `postgres`

### 🏗️ Backend (Node.js + Prisma)

- **Puerto**: 3000
- **API**: http://localhost:3000/api
- **Health**: http://localhost:3000/health
- **Hot reload**: ✅ (montado desde `./backend/src`)

### 🎨 Frontend (SvelteKit + Vite)

- **Puerto**: 5173
- **URL**: http://localhost:5173
- **Hot reload**: ✅ (montado desde `./src`)

## 🔥 Características

- ✅ **Hot reload** completo (frontend y backend)
- ✅ **Base de datos automática** con migraciones
- ✅ **Seeding automático** de datos de prueba
- ✅ **Reinstalación automática** de dependencias
- ✅ **Prisma client generado** automáticamente
- ✅ **Red interna** entre servicios
- ✅ **Volúmenes persistentes** para datos y node_modules
- ✅ **Un solo comando** para todo

## 🛠️ Desarrollo

1. **Hacer cambios en el código** → Hot reload automático
2. **Cambios en Prisma schema** → Reiniciar backend: `docker compose restart backend`
3. **Nuevas dependencias** → `pnpm dev:clean && pnpm dev`

## 🧹 Solución de Problemas

```bash
# Si algo no funciona, limpiar todo y empezar de nuevo:
pnpm dev:clean
pnpm dev

# Ver logs detallados:
pnpm dev:logs

# Solo parar sin limpiar:
pnpm dev:down
```

## 🌟 Ventajas vs. Sistema Anterior

| Anterior                    | Nuevo           |
| --------------------------- | --------------- |
| Scripts complejos           | `pnpm dev`      |
| Puertos dinámicos           | Puertos fijos   |
| Problemas de sincronización | Todo coordinado |
| Setup manual de DB          | Automático      |
| Conflictos entre worktrees  | Sin conflictos  |
| Múltiples comandos          | Un solo comando |

## 🎯 Para Worktrees

```bash
# Crear nuevo worktree
git worktree add feature-branch

# Ir al worktree
cd feature-branch

# Levantar entorno (cada worktree es independiente)
pnpm dev
```

Cada worktree tendrá su propia base de datos y puertos independientes gracias a Docker.
