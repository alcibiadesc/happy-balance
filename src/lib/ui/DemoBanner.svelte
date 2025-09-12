<script lang="ts">
  import { ExternalLink, Github, Info, CreditCard, Tag, BarChart3, Target, TrendingUp, Upload } from 'lucide-svelte';
</script>

<div class="bg-gradient-to-r from-happy-teal to-happy-gold text-white shadow-lg">
  <div class="px-6 py-4">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          <Info class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-lg font-semibold">
            Modo Demo - Happy Balance
          </p>
          <p class="text-white/80 text-sm mt-1">
            Estás viendo datos de ejemplo. Los cambios no se guardarán permanentemente.
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <a 
          href="https://github.com/yourusername/happy-balance" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-white transition-colors backdrop-blur-sm"
        >
          <Github class="w-5 h-5" />
          <span class="hidden sm:inline">Ver en GitHub</span>
          <ExternalLink class="w-4 h-4" />
        </a>
        
        <div class="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <span class="text-sm font-medium">✨ Prueba todas las funcionalidades</span>
        </div>
      </div>
    </div>
    
    <!-- Features highlight for demo -->
    <div class="mt-4 flex flex-wrap gap-2">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
        <CreditCard class="w-3 h-3" />
        Gestión de Transacciones
      </span>
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
        <Tag class="w-3 h-3" />
        Categorización Inteligente
      </span>
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
        <BarChart3 class="w-3 h-3" />
        Dashboard Financiero
      </span>
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
        <Target class="w-3 h-3" />
        Presupuestos y Metas
      </span>
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
        <TrendingUp class="w-3 h-3" />
        Análisis de Gastos
      </span>
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
        <Upload class="w-3 h-3" />
        Importación CSV (N26)
      </span>
    </div>
  </div>
</div>