<script lang="ts">
  export let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  export let size: 'sm' | 'md' = 'md';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  const variantClasses = {
    default: 'bg-evening-sea bg-opacity-10 text-evening-sea',
    success: 'bg-acapulco bg-opacity-20 text-acapulco',
    warning: 'bg-sunglow bg-opacity-20 text-sunglow',
    danger: 'bg-froly bg-opacity-20 text-froly',
    info: 'bg-evening-sea bg-opacity-20 text-evening-sea'
  };
</script>

<span class="inline-flex items-center font-medium rounded-full {sizeClasses[size]} {variantClasses[variant]}">
  <slot />
</span>
