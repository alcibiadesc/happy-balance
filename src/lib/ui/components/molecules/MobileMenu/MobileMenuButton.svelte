<script lang="ts">
  import { Menu } from 'lucide-svelte';
  
  interface Props {
    onclick?: () => void;
  }
  
  let { onclick }: Props = $props();
</script>

<!-- Botón hamburguesa FORZADO a ser visible en móvil -->
<button
  class="mobile-menu-btn"
  {onclick}
  type="button"
  aria-label="Abrir menú de navegación"
  title="Menú"
>
  <Menu class="menu-icon" />
</button>

<style>
  .mobile-menu-btn {
    /* Forzar visibilidad absoluta */
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    
    /* Posicionamiento y tamaño */
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    min-width: 3rem;
    min-height: 3rem;
    
    /* Estilos visuales */
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    /* Colores para tema claro */
    color: #374151;
  }
  
  .mobile-menu-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .mobile-menu-btn:active {
    background-color: rgba(0, 0, 0, 0.15);
  }
  
  .menu-icon {
    /* Forzar visibilidad del ícono */
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    
    /* Tamaño del ícono */
    width: 1.5rem !important;
    height: 1.5rem !important;
    
    /* Estilos del stroke */
    stroke: currentColor !important;
    fill: none !important;
    stroke-width: 2 !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
  }
  
  /* Tema oscuro */
  :global(html.dark) .mobile-menu-btn {
    color: #f3f4f6;
  }
  
  :global(html.dark) .mobile-menu-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  :global(html.dark) .mobile-menu-btn:active {
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  /* Media query para móvil - forzar en pantallas pequeñas */
  @media (max-width: 1023px) {
    .mobile-menu-btn {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: 50 !important;
    }
    
    .menu-icon {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  }
  
  /* Esconder en desktop */
  @media (min-width: 1024px) {
    .mobile-menu-btn {
      display: none !important;
    }
  }
</style>
