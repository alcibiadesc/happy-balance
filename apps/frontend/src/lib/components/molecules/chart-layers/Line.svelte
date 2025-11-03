<script lang="ts">
  import { getContext } from 'svelte';

  interface Props {
    y?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  let { y = 'y', stroke = '#ab00d6', strokeWidth = 2 }: Props = $props();

  const { data, xGet, yGet } = getContext('LayerCake');

  // Generate path for the line
  let path = $derived.by(() => {
    if (!$data || $data.length === 0) return '';

    return 'M' + $data
      .map((d: any) => {
        const xVal = $xGet(d);
        const yVal = typeof y === 'string' ? $yGet(d, y) : $yGet(d);
        return `${xVal},${yVal}`;
      })
      .join('L');
  });
</script>

<path
  class="path-line"
  d={path}
  style:stroke={stroke}
  style:stroke-width={strokeWidth}
/>

<style>
  .path-line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
</style>
