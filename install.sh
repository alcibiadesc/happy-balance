#!/bin/bash

# ========================================
# Happy Balance - Script de Instalación
# ========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
clear
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║       HAPPY BALANCE - INSTALADOR      ║"
echo "║    Sistema de Finanzas Personales     ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar Docker
echo -e "${YELLOW}▶ Verificando requisitos...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no está instalado${NC}"
    echo "  Por favor, instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    # Intentar con docker compose (v2)
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}✗ Docker Compose no está instalado${NC}"
        echo "  Por favor, instala Docker Compose"
        exit 1
    fi
    # Usar docker compose v2
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓ Docker y Docker Compose detectados${NC}"

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}▶ Configurando variables de entorno...${NC}"

    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Archivo .env creado desde .env.example${NC}"
    else
        echo -e "${RED}✗ No se encontró .env.example${NC}"
        exit 1
    fi

    # Generar passwords seguras automáticamente
    echo -e "${YELLOW}▶ Generando contraseñas seguras...${NC}"

    # Función para generar password aleatoria
    generate_password() {
        openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*' | fold -w 32 | head -n 1
    }

    # Actualizar passwords en .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$(generate_password)/" .env
        sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$(generate_password)/" .env
        sed -i '' "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(generate_password | head -c 20)/" .env
    else
        # Linux
        sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$(generate_password)/" .env
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$(generate_password)/" .env
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(generate_password | head -c 20)/" .env
    fi

    echo -e "${GREEN}✓ Contraseñas seguras generadas${NC}"

    # Preguntar por contraseña de admin
    echo ""
    echo -e "${BLUE}Configura tu usuario administrador:${NC}"
    read -p "Usuario admin [admin]: " admin_user
    admin_user=${admin_user:-admin}

    read -sp "Contraseña admin (mínimo 8 caracteres): " admin_pass
    echo ""

    if [ ${#admin_pass} -lt 8 ]; then
        echo -e "${RED}✗ La contraseña debe tener al menos 8 caracteres${NC}"
        exit 1
    fi

    # Actualizar credenciales de admin
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/ADMIN_USERNAME=.*/ADMIN_USERNAME=$admin_user/" .env
        sed -i '' "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$admin_pass/" .env
    else
        sed -i "s/ADMIN_USERNAME=.*/ADMIN_USERNAME=$admin_user/" .env
        sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$admin_pass/" .env
    fi

else
    echo -e "${GREEN}✓ Archivo .env existente detectado${NC}"
fi

# Preguntar si construir o usar imágenes pre-construidas
echo ""
echo -e "${BLUE}¿Cómo deseas instalar Happy Balance?${NC}"
echo "1) Usar imágenes pre-construidas de Docker Hub (más rápido)"
echo "2) Construir desde el código fuente (personalizable)"
read -p "Selecciona una opción [1]: " install_option
install_option=${install_option:-1}

# Detener contenedores existentes
echo -e "${YELLOW}▶ Deteniendo contenedores existentes...${NC}"
$DOCKER_COMPOSE down 2>/dev/null || true

# Instalar según la opción elegida
if [ "$install_option" == "2" ]; then
    echo -e "${YELLOW}▶ Construyendo imágenes desde el código fuente...${NC}"
    $DOCKER_COMPOSE build

    echo -e "${YELLOW}▶ Iniciando servicios...${NC}"
    $DOCKER_COMPOSE up -d
else
    echo -e "${YELLOW}▶ Descargando imágenes de Docker Hub...${NC}"
    $DOCKER_COMPOSE pull

    echo -e "${YELLOW}▶ Iniciando servicios...${NC}"
    $DOCKER_COMPOSE up -d
fi

# Esperar a que los servicios estén listos
echo -e "${YELLOW}▶ Esperando a que los servicios estén listos...${NC}"
sleep 5

# Verificar estado
echo -e "${YELLOW}▶ Verificando estado de los servicios...${NC}"
$DOCKER_COMPOSE ps

# Verificar salud de los servicios
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3000 &>/dev/null; then
        echo -e "${GREEN}✓ Frontend activo${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${YELLOW}⚠ El frontend está tardando en iniciar. Verifica los logs con:${NC}"
    echo "  $DOCKER_COMPOSE logs frontend"
fi

# Mensaje final
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ¡INSTALACIÓN COMPLETADA! 🎉       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Accede a Happy Balance en:${NC}"
echo -e "  ${GREEN}➜${NC} Frontend: http://localhost:3000"
echo -e "  ${GREEN}➜${NC} API: http://localhost:3004"
echo ""
echo -e "${BLUE}Credenciales:${NC}"
echo -e "  ${GREEN}➜${NC} Usuario: ${admin_user:-admin}"
echo -e "  ${GREEN}➜${NC} Contraseña: (la que configuraste)"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo -e "  Ver logs:     $DOCKER_COMPOSE logs -f"
echo -e "  Detener:      $DOCKER_COMPOSE down"
echo -e "  Reiniciar:    $DOCKER_COMPOSE restart"
echo -e "  Estado:       $DOCKER_COMPOSE ps"
echo ""
echo -e "${BLUE}¿Necesitas ayuda? https://github.com/alcibiadesc/happy-balance/issues${NC}"