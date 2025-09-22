#!/bin/bash

# Script definitivo para levantar el frontend con configuración correcta

echo "🎨 Iniciando configuración definitiva del frontend..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

# 2. Asegurar que .env tiene la configuración correcta
echo -e "${BLUE}🔧 Verificando configuración de .env...${NC}"

cat > .env << 'EOF'
# API URL - SIEMPRE apuntar al puerto 3004
VITE_API_URL=http://localhost:3004/api
EOF

echo -e "${GREEN}✅ Configuración de .env actualizada${NC}"

# 3. Verificar que el backend esté corriendo
echo -e "${BLUE}🔍 Verificando backend en puerto 3004...${NC}"

BACKEND_CHECK=$(curl -s http://localhost:3004/health 2>/dev/null | grep -o "OK" || echo "")

if [ "$BACKEND_CHECK" != "OK" ]; then
    echo -e "${YELLOW}⚠️  El backend no está corriendo en puerto 3004${NC}"
    echo -e "${BLUE}💡 Inicia el backend con: cd backend && ./start-dev.sh${NC}"
else
    echo -e "${GREEN}✅ Backend verificado en puerto 3004${NC}"
fi

# 4. Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias...${NC}"
    npm install
fi

# 5. Iniciar el frontend
echo -e "${GREEN}🎨 Iniciando frontend...${NC}"
echo -e "${BLUE}📍 Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}🔗 API: http://localhost:3004/api${NC}"
echo ""
echo -e "${YELLOW}Para detener el servidor: Ctrl+C${NC}"
echo ""

# Ejecutar el frontend
npm run dev