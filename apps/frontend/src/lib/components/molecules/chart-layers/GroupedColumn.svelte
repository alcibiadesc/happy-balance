<script lang="ts">
  import { getContext } from 'svelte';

  interface Props {
    groupKeys: string[];
    colors: Record<string, string>;
  }

  let { groupKeys, colors }: Props = $props();

  const { data, xGet, yGet, xScale, yRange } = getContext('LayerCake');

  // Calculate bar width and positions for grouped bars
  let barWidth = $derived.by(() => {
    if (typeof $xScale.bandwidth === 'function') {
      return $xScale.bandwidth() / groupKeys.length;
    }
    return 20; // Default width
  });

  function getBarX(d: any, groupIndex: number) {
    const baseX = $xGet(d);
    return baseX + (groupIndex * barWidth);
  }

  function getBarY(d: any, key: string) {
    return $yGet(d, key);
  }

  function getBarHeight(d: any, key: string) {
    const y = $yGet(d, key);
    return $yRange[0] - y;
  }
</script>

<g class="grouped-columns">
  {#each $data as d, i}
    {#each groupKeys as key, groupIndex}
      {@const x = getBarX(d, groupIndex)}
      {@const y = getBarY(d, key)}
      {@const height = getBarHeight(d, key)}
      {@const color = colors[key] || '#cccccc'}

      <rect
        class="bar"
        {x}
        {y}
        width={barWidth * 0.9}
        {height}
        fill={color}
        rx={4}
      />
    {/each}
  {/each}
</g>

<style>
  .bar {
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .bar:hover {
    opacity: 1;
  }
</style>
