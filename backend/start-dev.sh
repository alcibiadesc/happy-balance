#!/bin/bash

# Script definitivo para levantar el backend con configuración correcta
# Este script asegura que siempre usemos la configuración adecuada

echo "🚀 Iniciando configuración definitiva del backend..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde el directorio backend${NC}"
    exit 1
fi

# 2. Matar procesos existentes en el puerto 3004
echo -e "${YELLOW}🔄 Matando procesos existentes en puerto 3004...${NC}"
lsof -ti:3004 | xargs -r kill -9 2>/dev/null || true

# 3. Verificar configuración de .env
echo -e "${BLUE}🔧 Verificando configuración de .env...${NC}"

# Asegurar que .env tiene la configuración correcta
cat > .env << 'EOF'
# Database - SIEMPRE usar happy_balance_main
DATABASE_URL="postgresql://postgres:password@localhost:5432/happy_balance_main"

# Server
PORT=3004
NODE_ENV=development

# CORS - lista separada por comas de orígenes permitidos
CORS_ORIGIN="http://localhost:5173,http://localhost:5177"

# File upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="uploads"
EOF

echo -e "${GREEN}✅ Configuración de .env actualizada${NC}"

# 4. Verificar que la base de datos existe y tiene datos
echo -e "${BLUE}🔍 Verificando base de datos happy_balance_main...${NC}"

DB_CHECK=$(psql -h localhost -U postgres -d happy_balance_main -t -c "SELECT COUNT(*) FROM transactions;" 2>/dev/null | xargs)

if [ "$?" -ne 0 ]; then
    echo -e "${RED}❌ Error: No se puede conectar a la base de datos happy_balance_main${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que PostgreSQL esté ejecutándose y que la base de datos exista${NC}"
    exit 1
fi

if [ "$DB_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ Base de datos verificada: $DB_CHECK transacciones encontradas${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: La base de datos existe pero no tiene transacciones${NC}"
fi

# 5. Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias...${NC}"
    npm install
fi

# 6. Iniciar el servidor
echo -e "${GREEN}🚀 Iniciando servidor en puerto 3004...${NC}"
echo -e "${BLUE}📍 Puerto: 3004${NC}"
echo -e "${BLUE}🔗 Health check: http://localhost:3004/health${NC}"
echo -e "${BLUE}🚀 API Base: http://localhost:3004/api${NC}"
echo -e "${BLUE}🗄️  Base de datos: happy_balance_main${NC}"
echo ""
echo -e "${YELLOW}Para detener el servidor: Ctrl+C${NC}"
echo ""

# Ejecutar el servidor
npm run dev