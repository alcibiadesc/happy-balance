<script lang="ts">
  import { BarChart3, PieChart, TrendingUp, Shield, Upload, Wallet } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Happy Balance - Financial harmony</title>
  <meta
    name="description"
    content="Take control of your finances with smart categorization, visual dashboards, and investment tracking."
  />
</svelte:head>

<!-- Hero -->
<section class="hero">
  <div class="hero-inner">
    <h1 class="hero-title">
      Tu dinero, <span class="highlight">en equilibrio</span>
    </h1>
    <p class="hero-subtitle">
      Importa tus transacciones bancarias, categoriza gastos de forma inteligente y visualiza tu
      salud financiera en un solo lugar.
    </p>
    <div class="hero-actions">
      <a href="/login" class="btn-primary">Acceder</a>
    </div>
  </div>
</section>

<!-- Features -->
<section class="features">
  <div class="features-inner">
    <h2 class="section-title">Todo lo que necesitas</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <Upload size={24} />
        </div>
        <h3>Importa CSV</h3>
        <p>Sube tus extractos bancarios y detecta duplicados automaticamente.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <PieChart size={24} />
        </div>
        <h3>Categoriza inteligente</h3>
        <p>Aprende tus patrones y clasifica gastos con un solo click.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <BarChart3 size={24} />
        </div>
        <h3>Dashboard visual</h3>
        <p>Graficas mensuales, trimestrales y anuales de ingresos y gastos.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <TrendingUp size={24} />
        </div>
        <h3>Inversiones</h3>
        <p>Sigue tu portfolio, contribuciones y rendimiento a lo largo del tiempo.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <Wallet size={24} />
        </div>
        <h3>Presupuestos</h3>
        <p>Define limites por categoria y controla tu gasto mensual.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <Shield size={24} />
        </div>
        <h3>Privado y seguro</h3>
        <p>Tus datos se quedan en tu servidor. Sin terceros, sin tracking.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="cta-inner">
    <h2>Empieza a controlar tus finanzas hoy</h2>
    <a href="/login" class="btn-primary btn-lg">Acceder</a>
  </div>
</section>

<style>
  /* Hero */
  .hero {
    padding: 5rem 1.5rem 4rem;
    text-align: center;
  }

  .hero-inner {
    max-width: 700px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    line-height: 1.15;
    color: var(--text-primary);
    margin-bottom: 1.25rem;
  }

  .highlight {
    color: var(--primary);
  }

  .hero-subtitle {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    line-height: 1.6;
    color: var(--text-secondary);
    margin-bottom: 2rem;
    max-width: 550px;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 2rem;
    background: var(--primary);
    color: var(--primary-foreground, #fff);
    border-radius: 10px;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn-primary:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .btn-lg {
    padding: 0.875rem 2.5rem;
    font-size: 1.1rem;
  }

  /* Features */
  .features {
    padding: 3rem 1.5rem 4rem;
    background: var(--surface-muted);
  }

  .features-inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  .section-title {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2.5rem;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
  }

  .feature-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
  }

  .feature-card:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  .feature-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light, rgba(2, 60, 70, 0.08));
    color: var(--primary);
    border-radius: 10px;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .feature-card p {
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 0;
  }

  /* CTA */
  .cta {
    padding: 4rem 1.5rem;
    text-align: center;
  }

  .cta-inner {
    max-width: 500px;
    margin: 0 auto;
  }

  .cta h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .hero {
      padding: 3rem 1rem 2.5rem;
    }

    .features {
      padding: 2rem 1rem 3rem;
    }

    .cta {
      padding: 3rem 1rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
