# 🚀 Docker Universal Setup - Worktrees Ready

## ✨ **NUEVO SISTEMA UNIFICADO**

**Un solo comando para levantar todo el entorno, en cualquier worktree:**

```bash
# Setup inicial (solo la primera vez por worktree)
pnpm setup

# Levantar entorno completo
pnpm dev
```

---

## 🎯 **CARACTERÍSTICAS PRINCIPALES**

### ✅ **Aislamiento Perfecto por Worktree**
- Cada worktree tiene sus propios puertos únicos
- Base de datos compartida con esquemas separados
- Configuración automática sin conflictos
- Volúmenes Docker independientes

### ✅ **Setup Instantáneo**
- Detección automática de workspace (main/worktree)
- Asignación determinística de puertos
- Configuración automática de variables de entorno
- Instalación inteligente de dependencias

### ✅ **Hot Reload Completo**
- Frontend (SvelteKit) con recarga instantánea
- Backend (Node.js) con recarga automática
- Sincronización perfecta entre servicios

---

## 🚀 **COMANDOS DISPONIBLES**

### **Comandos Principales**
```bash
# 🔧 Setup inicial del workspace
pnpm setup

# 🚀 Levantar entorno de desarrollo
pnpm dev

# 📊 Ver información del workspace actual
pnpm info
```

### **Comandos Docker**
```bash
# 📋 Ver logs en tiempo real
pnpm dev:logs

# 🛑 Parar todos los servicios
pnpm dev:down

# 🧹 Limpiar todo (volúmenes, contenedores, etc.)
pnpm dev:clean

# 🐳 Solo levantar Docker (sin configuración)
pnpm dev:docker
```

### **Comandos Alternativos**
```bash
# 🖥️ Desarrollo nativo (sin Docker)
pnpm dev:native

# 🔄 Sistema legacy (scripts anteriores)
pnpm dev:legacy
```

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

```
┌─────────────────────────────────────────────────────────┐
│                    DOCKER NETWORK                       │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ PostgreSQL  │  │    Backend      │  │  Frontend   │  │
│  │  (Shared)   │  │ (Per Worktree)  │  │(Per Worktree│  │
│  │   :5432     │  │ :3001+ (hash)   │  │:5174+ (hash)│  │
│  └─────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Componentes:**

#### 🐘 **PostgreSQL Database**
- **Contenedor único compartido** entre todos los worktrees
- **Puerto fijo**: 5432
- **Bases de datos separadas** por worktree:
  - `happy_balance` (main)
  - `happy_balance_feature_branch` (worktree: feature-branch)
  - `happy_balance_bugfix_123` (worktree: bugfix-123)

#### 🏗️ **Backend (Node.js + Prisma)**
- **Contenedor independiente** por worktree
- **Puertos únicos**: 3000 (main), 3001+ (worktrees)
- **Hot reload** completo desde `./backend/src`
- **Migraciones automáticas** al iniciar

#### 🎨 **Frontend (SvelteKit + Vite)**
- **Contenedor independiente** por worktree  
- **Puertos únicos**: 5173 (main), 5174+ (worktrees)
- **Hot reload** completo desde `./src`
- **Configuración automática** de API endpoints

---

## 📋 **FLUJO DE TRABAJO**

### **1. Repositorio Principal (Main)**
```bash
cd /path/to/expense-tracker
pnpm setup    # Configura puertos estándar (3000, 5173, 5432)
pnpm dev      # Levanta entorno en puertos estándar
```

### **2. Crear y Usar Worktree**
```bash
# Crear worktree
git worktree add ../expense-tracker-feature feature-branch

# Ir al worktree
cd ../expense-tracker-feature

# Setup automático (detecta que es worktree)
pnpm setup    # Configura puertos únicos automáticamente

# Levantar entorno
pnpm dev      # Levanta en puertos únicos, sin conflictos
```

### **3. Ver Información del Workspace**
```bash
pnpm info
```
```
📊 WORKSPACE INFORMATION
════════════════════════════════════════
Name:      feature-branch
Type:      Worktree
Path:      /path/to/expense-tracker-feature
Database:  happy_balance_feature_branch

🔌 PORTS
────────────────────
Database:  5432
Backend:   3142
Frontend:  5287

🌐 URLS
────────────────────
Frontend:  http://localhost:5287
Backend:   http://localhost:3142/api
Database:  postgresql://localhost:5432/happy_balance_feature_branch
```

---

## 🔧 **CONFIGURACIÓN AUTOMÁTICA**

El sistema crea automáticamente:

### **Backend `.env`**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/happy_balance_feature_branch"
PORT=3142
NODE_ENV=development
CORS_ORIGIN="http://localhost:5287"
WORKSPACE_ID="feature-branch"
```

### **Frontend `.env.local`**
```env
VITE_API_URL=http://localhost:3142/api
VITE_PORT=5287
WORKSPACE_ID="feature-branch"
```

### **Docker `.env`**
```env
WORKSPACE_ID=feature-branch
DB_PORT=5432
BACKEND_PORT=3142
FRONTEND_PORT=5287
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/happy_balance_feature_branch
```

---

## 🛠️ **SOLUCIÓN DE PROBLEMAS**

### **Limpiar y Reiniciar**
```bash
# Limpiar completamente
pnpm dev:clean

# Reconfigurar workspace
pnpm setup

# Levantar de nuevo
pnpm dev
```

### **Ver Logs Detallados**
```bash
# Logs en tiempo real
pnpm dev:logs

# Logs específicos por servicio
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
```

### **Problemas de Puertos**
```bash
# Verificar puertos en uso
lsof -i :3000
lsof -i :5173

# Matar procesos específicos
pnpm docker:kill
```

---

## 🌟 **VENTAJAS vs. SISTEMA ANTERIOR**

| **Anterior** | **Nuevo** |
|--------------|-----------|
| Scripts complejos múltiples | Un solo comando `pnpm dev` |
| Puertos dinámicos inestables | Puertos determinísticos |
| Conflictos entre worktrees | Aislamiento perfecto |
| Setup manual de BD | Base de datos automática |
| Configuración manual | Configuración automática |
| Múltiples contenedores BD | Una sola BD compartida |
| Sincronización problemática | Todo coordinado |

---

## 🎯 **CASOS DE USO**

### **Desarrollo en Paralelo**
```bash
# Terminal 1 - Main branch
cd expense-tracker
pnpm dev          # → http://localhost:5173

# Terminal 2 - Feature branch  
cd expense-tracker-feature
pnpm dev          # → http://localhost:5287

# Terminal 3 - Bugfix branch
cd expense-tracker-bugfix  
pnpm dev          # → http://localhost:5341
```

### **Testing Cross-Branch**
```bash
# Probar API de feature desde main frontend
VITE_API_URL=http://localhost:3142/api pnpm dev:frontend

# Probar main API desde feature frontend  
VITE_API_URL=http://localhost:3000/api pnpm dev:frontend
```

---

## 🚦 **ESTADO DEL SISTEMA**

- ✅ **Detección automática** de workspace
- ✅ **Asignación de puertos** sin conflictos
- ✅ **Base de datos compartida** con esquemas separados
- ✅ **Hot reload completo** en todos los servicios
- ✅ **Configuración automática** de variables de entorno
- ✅ **Volúmenes Docker** independientes por workspace
- ✅ **Scripts unificados** y simplificados
- ✅ **Documentación completa**

---

**¡Listo para desarrollar sin conflictos en cualquier worktree! 🎉**
