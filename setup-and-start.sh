#!/bin/bash

# Script DEFINITIVO para configurar y levantar todo el entorno de desarrollo
# Soluciona TODOS los problemas de configuración de una vez

echo "🔧 CONFIGURACIÓN DEFINITIVA DEL ENTORNO"
echo "======================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 1. Verificar directorio
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Directorio verificado${NC}"

# 2. Matar todos los procesos existentes
echo -e "${YELLOW}🔄 Limpiando procesos existentes...${NC}"
lsof -ti:3004 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5177 | xargs -r kill -9 2>/dev/null || true

# 3. Configurar backend
echo -e "${PURPLE}🖥️  CONFIGURANDO BACKEND...${NC}"
cd backend

# Forzar configuración correcta del .env
cat > .env << 'EOF'
# Database - CONFIGURACIÓN DEFINITIVA
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

echo -e "${GREEN}✅ Backend .env configurado${NC}"

# Verificar base de datos
echo -e "${BLUE}🔍 Verificando base de datos...${NC}"
DB_CHECK=$(psql -h localhost -U postgres -d happy_balance_main -t -c "SELECT COUNT(*) FROM transactions;" 2>/dev/null | xargs)

if [ "$?" -ne 0 ]; then
    echo -e "${RED}❌ Error: No se puede conectar a happy_balance_main${NC}"
    echo -e "${YELLOW}💡 Verifica que PostgreSQL esté ejecutándose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Base de datos verificada: $DB_CHECK transacciones${NC}"

cd ..

# 4. Configurar frontend
echo -e "${PURPLE}🎨 CONFIGURANDO FRONTEND...${NC}"

# Forzar configuración correcta del .env frontend
cat > .env << 'EOF'
# API URL - CONFIGURACIÓN DEFINITIVA
VITE_API_URL=http://localhost:3004/api
EOF

echo -e "${GREEN}✅ Frontend .env configurado${NC}"

# 5. Crear scripts de inicio mejorados
echo -e "${BLUE}📝 Creando scripts de inicio...${NC}"

# Script para backend
cat > backend/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando backend en puerto 3004..."
PORT=3004 NODE_ENV=development npm run dev
EOF

chmod +x backend/start.sh

# Script para frontend
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🎨 Iniciando frontend en puerto 5173..."
npm run dev
EOF

chmod +x start-frontend.sh

echo -e "${GREEN}✅ Scripts creados${NC}"

# 6. Mostrar instrucciones finales
echo ""
echo -e "${GREEN}🎉 CONFIGURACIÓN COMPLETADA${NC}"
echo "=========================="
echo ""
echo -e "${YELLOW}Para iniciar el entorno completo:${NC}"
echo ""
echo -e "${BLUE}1. Backend:${NC}"
echo "   cd backend && ./start.sh"
echo ""
echo -e "${BLUE}2. Frontend (en otra terminal):${NC}"
echo "   ./start-frontend.sh"
echo ""
echo -e "${PURPLE}URLs importantes:${NC}"
echo -e "${GREEN}• Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}• API: http://localhost:3004/api${NC}"
echo -e "${GREEN}• Health Check: http://localhost:3004/health${NC}"
echo ""
echo -e "${YELLOW}La configuración ahora es PERMANENTE y SIEMPRE usará:${NC}"
echo -e "${GREEN}• Base de datos: happy_balance_main${NC}"
echo -e "${GREEN}• Puerto backend: 3004${NC}"
echo -e "${GREEN}• Puerto frontend: 5173${NC}"
echo ""