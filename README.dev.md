# 🛠️ Base de Datos de Desarrollo

Este proyecto incluye un sistema de base de datos efímera para desarrollo que se configura automáticamente cada vez que ejecutas `npm run dev`.

## 📋 Características

- **SQLite en memoria** para pruebas rápidas
- **Datos de prueba automáticos** con categorías, transacciones y cuentas de ahorro
- **Configuración automática** en cada inicio
- **Aislamiento completo** de la base de datos de producción

## 🚀 Comandos Disponibles

```bash
# Desarrollo normal (configura BD automáticamente)
npm run dev

# Limpiar y recrear la BD de desarrollo
npm run dev:clean

# Solo configurar la BD (sin levantar servidor)
npm run dev:setup

# Ver la BD de desarrollo con Prisma Studio
npm run db:studio:dev

# Generar cliente Prisma para desarrollo
npm run db:generate:dev
```

## 📊 Datos de Prueba Incluidos

La BD de desarrollo se crea automáticamente con:

### Categorías:
- **Salario** (INCOME) - Verde 🟢
- **Alimentación** (ESSENTIAL_EXPENSE) - Naranja 🟠  
- **Transporte** (ESSENTIAL_EXPENSE) - Azul 🔵
- **Entretenimiento** (DISCRETIONARY_EXPENSE) - Morado 🟣
- **Ahorro** (SAVINGS) - Cian 🔷
- **Omitir** (OMIT) - Gris ⚪

### Transacciones de Ejemplo:
- Salario mensual: +€3,000
- Supermercado: -€85.50
- Metro: -€12.30

### Cuenta de Ahorros:
- **Fondo de Emergencia Dev**: €15,000 / €20,000 objetivo

## 📁 Archivos Creados

- `prisma/dev.db` - Base de datos SQLite (se crea automáticamente)
- `prisma/schema.dev.prisma` - Schema específico para desarrollo
- `.env.development` - Variables de entorno para desarrollo

## 🔄 Flujo Automático

Cada vez que ejecutas `npm run dev`:

1. ✅ Se genera el cliente Prisma para desarrollo
2. ✅ Se aplican las migraciones a SQLite
3. ✅ Se crean los datos de prueba
4. ✅ Se levanta el servidor Vite
5. ✅ ¡Listo para desarrollar!

## 🧹 Limpieza

La base de datos SQLite es efímera y se puede borrar sin problemas:

```bash
# Eliminar BD y recrear
npm run dev:clean

# O manualmente
rm -f prisma/dev.db prisma/dev.db-journal
```

## 🔍 Debugging

Para ver los logs de Prisma durante desarrollo, las consultas se muestran en la consola del servidor.