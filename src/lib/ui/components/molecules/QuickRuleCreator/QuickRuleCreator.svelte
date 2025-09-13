<script lang="ts">
  import { Plus, Brain, ArrowRight } from 'lucide-svelte';
  import { Button } from '$lib/ui/components/atoms/Button/index.js';
  import { goto } from '$app/navigation';

  interface Transaction {
    id: string;
    counterparty: string;
    paymentReference?: string;
    amount: number;
    categoryId?: string;
  }

  interface Props {
    transaction: Transaction;
    onRuleCreated?: () => void;
  }

  let { transaction, onRuleCreated }: Props = $props();

  async function createQuickRule(ruleType: 'counterparty' | 'paymentReference') {
    const pattern = ruleType === 'counterparty' 
      ? { value: transaction.counterparty }
      : { value: transaction.paymentReference || '' };

    // For quick rule creation, we'll redirect to intelligence page with pre-filled data
    const params = new URLSearchParams({
      prefill: 'true',
      name: `Auto: ${ruleType === 'counterparty' ? transaction.counterparty : transaction.paymentReference}`,
      ruleType,
      pattern: JSON.stringify(pattern),
      transactionId: transaction.id
    });

    goto(`/intelligence?${params.toString()}`);
  }

  function goToIntelligence() {
    goto('/intelligence');
  }
</script>

<div class="flex items-center gap-2 text-xs">
  <span class="text-gray-500">Sin categorizar:</span>
  
  {#if transaction.counterparty}
    <button
      onclick={() => createQuickRule('counterparty')}
      class="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors hover:bg-blue-50 hover:text-blue-600"
      title="Crear regla basada en contraparte: {transaction.counterparty}"
    >
      <Plus class="w-3 h-3" />
      Contraparte
    </button>
  {/if}
  
  {#if transaction.paymentReference}
    <button
      onclick={() => createQuickRule('paymentReference')}
      class="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors hover:bg-blue-50 hover:text-blue-600"
      title="Crear regla basada en referencia: {transaction.paymentReference}"
    >
      <Plus class="w-3 h-3" />
      Referencia
    </button>
  {/if}
  
  <button
    onclick={goToIntelligence}
    class="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors hover:bg-purple-50 hover:text-purple-600"
    title="Ir a Inteligencia de Categorización"
  >
    <Brain class="w-3 h-3" />
    IA
  </button>
</div>