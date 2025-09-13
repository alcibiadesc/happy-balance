# Happy Balance - Sistema de Diseño Minimalista Japonés

## 📋 Índice
1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Paleta de Colores Japan](#paleta-de-colores-japan)
4. [Atomic Design](#atomic-design)
5. [Principios Minimalistas](#principios-minimalistas)
6. [Sistema de Espaciado Ma (間)](#sistema-de-espaciado-ma)
7. [Tipografía Zen](#tipografía-zen)
8. [Componentes Base](#componentes-base)
9. [Dashboard - Métricas Clave](#dashboard---métricas-clave)
10. [Guías de Implementación](#guías-de-implementación)

---

## 🎨 Filosofía de Diseño

### Principios Fundamentales
- **Wabi-Sabi (侘寂)**: Belleza en la imperfección y simplicidad
- **Ma (間)**: El poder del espacio vacío como elemento de diseño
- **Kanso (簡素)**: Simplicidad y eliminación de elementos innecesarios
- **Shizen (自然)**: Naturalidad sin artificialidad forzada
- **Kokō (考)**: Sustitución de lo ornamental por la elegancia austera

### Objetivo del Usuario
> Crear una experiencia que permita al usuario entender su salud financiera de un vistazo, con métricas clave como el ratio de gasto (ej: "2 de cada 10 euros gastas") e información sobre inversiones, todo presentado con la serenidad del diseño japonés.

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
```
Frontend: Svelte 5 (con runes: $state, $props, $derived)
CSS Framework: TailwindCSS + DaisyUI
Build Tool: Vite
Package Manager: npm
TypeScript: Soporte completo
```

### Estructura del Proyecto
```
src/
├── lib/
│   ├── components/
│   │   ├── atoms/          # Elementos básicos
│   │   ├── molecules/      # Combinaciones de átomos
│   │   └── organisms/      # Secciones complejas
│   ├── styles/
│   │   └── japan-palette.css
│   └── utils/
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte        # Dashboard
│   ├── import/
│   ├── transactions/
│   └── settings/
└── app.css
```

### Convenciones de Código
- **Componentes**: PascalCase (ej: `NavItem.svelte`)
- **Props**: camelCase con interface TypeScript
- **CSS Classes**: BEM + Utility-first
- **Estados**: Svelte 5 runes (`$state`, `$props`, `$derived`)

---

## 🌸 Paleta de Colores Japan

### Colores Primarios
```css
:root {
  /* Colores Base Japan */
  --evening-sea: #023c46;    /* Azul marino profundo */
  --froly: #f5796c;          /* Coral suave */
  --bridesmaid: #fef7ee;     /* Crema cálido */
  --acapulco: #7abaa5;       /* Verde aqua */
  --sunglow: #fecd2c;        /* Amarillo dorado */
}
```

### Mapping Semántico
```css
--primary: var(--evening-sea);     /* Navegación, títulos */
--accent: var(--froly);            /* Botones importantes, alertas */
--surface: var(--bridesmaid);      /* Fondos principales */
--success: var(--acapulco);        /* Estados positivos, ingresos */
--warning: var(--sunglow);         /* Alertas, gastos importantes */
```

### Soporte Display-P3
```css
@supports (color: color(display-p3 1 1 1)) {
  :root {
    --evening-sea: color(display-p3 0.008 0.235 0.276 / 1.0);
    --froly: color(display-p3 0.96 0.475 0.422 / 1.0);
    --bridesmaid: color(display-p3 0.997 0.968 0.934 / 1.0);
    --acapulco: color(display-p3 0.477 0.728 0.647 / 1.0);
    --sunglow: color(display-p3 0.995 0.804 0.174 / 1.0);
  }
}
```

---

## ⚛️ Atomic Design

### Átomos (Atoms)
**Elementos más básicos e indivisibles**

#### Brand Component
```typescript
interface BrandProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```
- Logo con gradiente japan
- Texto japonés: "和の家計簿" (Wa no Kakeibo)
- Variaciones de tamaño

#### MetricCard
```typescript
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'accent';
}
```

#### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  icon?: ComponentType;
  disabled?: boolean;
}
```

#### ThemeToggle
- Cambio smooth entre modos
- Iconos Moon/Sun con rotación
- Estados hover zen

### Moléculas (Molecules)

#### NavList
- Agrupación semántica de NavItems
- Separadores minimalistas con gradientes
- Secciones: メイン (Main), 管理 (Management)

#### MetricGrid
- Grid responsivo de MetricCards
- Espaciado Ma (間) entre elementos
- Auto-reorganización mobile-first

#### ImportButton
- Botón destacado con indicador visual
- Micro-animaciones sutiles
- Estado de "importante" diferenciado

### Organismos (Organisms)

#### Navbar
- Desktop: Sidebar fijo 280px
- Mobile: Overlay deslizante
- Header móvil con backdrop blur
- Citas zen en footer

#### Dashboard
- Métricas clave en grid
- Gráficos minimalistas
- Información contextual japonesa

---

## 🎯 Principios Minimalistas

### Regla de Reducción
1. **¿Es esencial para la función?** Si no, eliminar
2. **¿Mejora la comprensión?** Si no, simplificar  
3. **¿Respeta el Ma (間)?** Debe tener espacio para respirar

### Jerarquía Visual
```
1. Información crítica: Métricas principales
2. Navegación: Acceso rápido a funciones
3. Contexto: Información de soporte
4. Decoración: Elementos zen mínimos
```

### Interacciones Sutiles
- **Hover**: Transformaciones ligeras (2-4px)
- **Focus**: Sombras suaves con colores japan
- **Loading**: Animaciones orgánicas, no mecánicas
- **Transiciones**: Easing natural (cubic-bezier)

---

## 📏 Sistema de Espaciado Ma (間)

### Escala de Espaciado
```css
--space-minimal: 0.125rem;  /* 2px  - Separación interna */
--space-xs: 0.25rem;        /* 4px  - Entre elementos relacionados */
--space-sm: 0.5rem;         /* 8px  - Padding interno */
--space-md: 1rem;           /* 16px - Separación estándar */
--space-lg: 1.5rem;         /* 24px - Entre secciones */
--space-xl: 2rem;           /* 32px - Respiración principal */
--space-2xl: 3rem;          /* 48px - Separación mayor */
--space-3xl: 4rem;          /* 64px - Espacios contemplativos */
```

### Aplicación del Ma
- **Entre componentes**: space-lg mínimo
- **Dentro de componentes**: space-sm a space-md
- **Secciones principales**: space-xl a space-2xl
- **Espacios contemplativos**: space-3xl

---

## ✒️ Tipografía Zen

### Fuente Principal
```css
font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Escalas Tipográficas
```css
.text-zen {
  font-weight: 300;           /* Peso ligero */
  letter-spacing: 0.025em;    /* Espaciado sutil */
  line-height: 1.7;           /* Altura de línea relajada */
}

.text-emphasis {
  font-weight: 500;           /* Énfasis moderado */
  color: var(--primary);      /* Color de marca */
}

.text-subtle {
  color: var(--text-muted);   /* Información secundaria */
  font-size: 0.875rem;       /* Tamaño reducido */
}
```

### Elementos Japoneses
- **Títulos de sección**: Kanji + traducción
  - メイン (Main)
  - 管理 (Management) 
  - 和 (Harmony)
- **Citas zen**: Frases inspiradoras en footer
- **Placeholder text**: Contexto cultural japonés

---

## 🧩 Componentes Base

### Navbar (Organismo Principal)
```typescript
interface NavbarProps {
  // Sin props, self-contained
}

// Estados internos
let isMobileSidebarOpen = $state(false);
let currentTheme = $state('light');
```

**Estructura:**
- Header móvil con Brand compacto
- Sidebar desktop con navegación completa
- Overlay móvil con animación slide-in
- ThemeToggle integrado
- Citas zen en footer

### Dashboard Metrics

#### Ratio de Gasto (Métrica Principal)
```typescript
interface SpendingRatioProps {
  totalIncome: number;
  totalSpent: number;
}

// Cálculo: "X de cada 10 euros gastas"
const ratio = $derived(() => Math.round((totalSpent / totalIncome) * 10));
```

#### Health Score Financiero
```typescript
interface FinancialHealthProps {
  savingsRate: number;      // % de ahorro
  investmentRate: number;   // % en inversiones
  debtRatio: number;        // % de deudas
}

// Score: 0-100 basado en ratios saludables
```

#### Métricas Rápidas
- **Ingresos del mes**: Con tendencia vs mes anterior
- **Gastos principales**: Top 3 categorías
- **Inversiones**: Valor total + rendimiento
- **Ahorro objetivo**: Progreso visual minimalista

---

## 🏷️ Dashboard - Métricas Clave

### Layout Principal
```
┌─────────────────┬─────────────────┐
│   Ratio Gasto   │  Health Score   │
│  "2 de cada 10" │    "Buena"      │
├─────────────────┼─────────────────┤
│    Ingresos     │   Inversiones   │
│   €2,450 📈     │   €8,500 📊     │
├─────────────────┴─────────────────┤
│         Top Gastos (Mini)         │
│   🍽️ Alimentación  🏠 Hogar      │
└───────────────────────────────────┘
```

### Métricas Específicas

#### 1. Ratio de Gasto (Hero Metric)
- **Cálculo**: `Math.round((gastos / ingresos) * 10)`
- **Visualización**: Número grande + texto explicativo
- **Colores**: Verde (≤6), Amarillo (7-8), Rojo (≥9)
- **Ejemplo**: "2 de cada 10 euros gastas"

#### 2. Salud Financiera Score
- **Componentes**:
  - 40% Ratio ahorro (>20% = excelente)
  - 30% Diversificación inversiones
  - 20% Control gastos fijos
  - 10% Crecimiento tendencia
- **Visualización**: Círculo de progreso minimalista
- **Estados**: 優秀 (Excelente), 良好 (Bueno), 改善 (Mejorar)

#### 3. Inversiones Dashboard
- **Total invertido**: Valor actual
- **ROI mes**: % cambio desde mes anterior  
- **Asset allocation**: Gráfico de dona simple
- **Próxima inversión**: Recordatorio/sugerencia

#### 4. Flujo de Efectivo
- **Ingresos**: Mes actual vs promedio
- **Gastos fijos**: % del total
- **Disponible**: Después de gastos fijos
- **Predicción**: Fin de mes estimado

---

## 📚 Guías de Implementación

### Orden de Desarrollo
1. **Paleta CSS** → Variables y clases base
2. **Layout Base** → Estructura mínima
3. **Átomos** → Brand, Button, MetricCard
4. **Moléculas** → NavList, MetricGrid  
5. **Organismos** → Navbar completo
6. **Dashboard** → Métricas implementadas
7. **Refinamiento** → Animaciones y pulido

### Testing Guidelines
```typescript
// Cada componente debe tener:
- Props validation
- Responsive behavior test  
- Accessibility audit
- Performance check (< 16ms render)
```

### Accessibility (A11y)
- **Contraste**: Mínimo 4.5:1 en todos los textos
- **Focus management**: Orden lógico de tabulación
- **ARIA labels**: En japonés e inglés
- **Keyboard navigation**: Acceso completo sin ratón
- **Screen readers**: Contexto para métricas numéricas

### Performance Targets
- **First Contentful Paint**: < 1.2s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle size**: < 150KB (gzipped)

---

## 🎌 Elementos Culturales Japoneses

### Frases Zen para Footer
```
シンプルは美しい (Simple wa utsukushii) - "Simplicity is beautiful"
和 (Wa) - "Harmony"  
間 (Ma) - "The power of space"
一期一会 (Ichigo ichie) - "One time, one meeting"
```

### Iconografía
- **Colores naturales**: Inspirados en estaciones japonesas
- **Formas orgánicas**: Bordes suavemente redondeados
- **Sombras sutiles**: Como luz filtrada por shoji
- **Transiciones**: Movimientos de agua, no mecánicos

### Estados de la Aplicación
- **Loading**: "読み込み中..." (Loading...)
- **Empty states**: "空 - Kara" (Empty) con sugerencias zen
- **Success**: "完了 - Kanryō" (Complete)
- **Error**: "少々お待ちください" (Please wait a moment)

---

## 📝 Notas de Implementación

### CSS Custom Properties Strategy
```css
/* Nivel 1: Colores base japan */
--evening-sea, --froly, etc.

/* Nivel 2: Semántica */  
--primary, --accent, --surface, etc.

/* Nivel 3: Componentes */
--button-primary-bg: var(--primary);
--navbar-surface: var(--surface-elevated);
```

### Responsive Breakpoints
```css
/* Mobile First */
sm: 640px   /* Tablets */
md: 768px   /* Desktop small */
lg: 1024px  /* Desktop standard */
xl: 1280px  /* Desktop large */
```

### Animation Easing
```css
--ease-zen: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-gentle: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

*Documento creado: 2025-09-13*  
*Versión: 1.0*  
*"シンプルは美しい - La simplicidad es hermosa"*
