# Configuración del Proyecto

## Configuración Rápida

### 1. Frontend (SvelteKit)
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:3004/api
```

### 2. Backend (Express)
Crea un archivo `.env` en la carpeta `backend/`:
```env
# Servidor
PORT=3004
NODE_ENV=development

# Base de datos - IMPORTANTE: usar happy_balance_main como BD principal
DATABASE_URL="postgresql://postgres:password@localhost:5432/happy_balance_main"

# CORS - lista separada por comas de orígenes permitidos
CORS_ORIGIN="http://localhost:5173,http://localhost:5177"

# Archivos
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
```

## Base de Datos

### BD Principal
- **Nombre**: `happy_balance_main`
- **Contenido**: 125 transacciones + 11 categorías (datos más completos)
- **Uso**: BD principal para desarrollo y producción

### Problema con Múltiples BDs
Anteriormente se crearon múltiples BDs por rama. Para mantener consistencia:
1. Usar siempre `happy_balance_main` como BD principal
2. Las otras BDs son históricas y pueden eliminarse
3. Si necesitas resetear datos, exporta desde `happy_balance_main` primero

## Configuración Dinámica de Puertos

### Frontend
- Por defecto usa el puerto definido en `VITE_API_URL`
- Si no está definido, usa `http://localhost:3004/api`

### Backend
- Por defecto usa el puerto 3004
- Puede cambiarse con la variable `PORT`
- En desarrollo, acepta automáticamente cualquier origen desde localhost

## CORS
El backend ahora:
1. Acepta múltiples orígenes desde `CORS_ORIGIN` (separados por comas)
2. En modo desarrollo (`NODE_ENV=development`), acepta automáticamente cualquier origen localhost
3. Los orígenes por defecto incluyen puertos 5173 y 5177

## Solución de Problemas

### Error CORS
Si ves errores CORS en la consola:
1. Verifica que el backend esté corriendo en el puerto correcto (3004)
2. Verifica que el frontend esté apuntando al puerto correcto en `.env`
3. Si usas un puerto diferente, agrégalo a `CORS_ORIGIN` en el backend

### Error content.js
Este error generalmente proviene de extensiones del navegador. Si aparece:
1. Prueba en modo incógnito
2. Desactiva temporalmente las extensiones del navegador
3. El error no afecta la funcionalidad de la aplicación

## Scripts de Desarrollo

### Backend
```bash
cd backend
npm run dev
# O usa el script helper:
./start-dev.sh
```

### Frontend
```bash
npm run dev
```

## Notas Importantes
- La configuración CORS ahora es dinámica y acepta múltiples orígenes
- En desarrollo, cualquier origen localhost es automáticamente aceptado
- Los archivos `.env.example` muestran la configuración recomendada