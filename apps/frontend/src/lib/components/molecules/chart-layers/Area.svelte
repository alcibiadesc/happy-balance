<script lang="ts">
  import { getContext } from 'svelte';

  interface Props {
    y?: string;
    fill?: string;
    opacity?: number;
  }

  let { y = 'y', fill = '#ab00d6', opacity = 0.2 }: Props = $props();

  const { data, xGet, yGet, yRange } = getContext('LayerCake');

  // Generate path for the area
  let path = $derived.by(() => {
    if (!$data || $data.length === 0) return '';

    const baseline = $yRange[0]; // Bottom of the chart

    // Top line (same as Line component)
    const topPath = $data
      .map((d: any) => {
        const xVal = $xGet(d);
        const yVal = typeof y === 'string' ? $yGet(d, y) : $yGet(d);
        return `${xVal},${yVal}`;
      })
      .join('L');

    // Bottom line (reverse order to close the path)
    const bottomPath = [...$data]
      .reverse()
      .map((d: any) => {
        const xVal = $xGet(d);
        return `${xVal},${baseline}`;
      })
      .join('L');

    return `M${topPath}L${bottomPath}Z`;
  });
</script>

<path
  class="path-area"
  d={path}
  style:fill={fill}
  style:fill-opacity={opacity}
/>

<style>
  .path-area {
    stroke: none;
  }
</style>
