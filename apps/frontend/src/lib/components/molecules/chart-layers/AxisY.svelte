<script lang="ts">
  import { getContext } from 'svelte';

  interface Props {
    gridlines?: boolean;
    tickMarks?: boolean;
    baseline?: boolean;
    formatTick?: (d: any) => string;
    ticks?: number;
  }

  let {
    gridlines = true,
    tickMarks = false,
    baseline = false,
    formatTick = (d: any) => d,
    ticks = 6
  }: Props = $props();

  const { xRange, yScale, height } = getContext('LayerCake');

  let tickVals = $derived.by(() => {
    if (typeof $yScale.ticks === 'function') {
      return $yScale.ticks(ticks);
    }
    return $yScale.domain();
  });
</script>

<g class="axis axis-y">
  {#each tickVals as tick, i (i)}
    {@const tickPosition = $yScale(tick)}

    <g class="tick tick-{i}" transform="translate(0,{tickPosition})">
      {#if gridlines}
        <line
          class="gridline"
          x1={0}
          x2={$xRange[1]}
          y1={0}
          y2={0}
        />
      {/if}

      {#if tickMarks}
        <line
          class="tick-mark"
          x1={-6}
          x2={0}
          y1={0}
          y2={0}
        />
      {/if}

      <text
        class="tick-text"
        x={-10}
        y={0}
        dy=".32em"
        text-anchor="end"
      >
        {formatTick(tick)}
      </text>
    </g>
  {/each}

  {#if baseline}
    <line
      class="baseline"
      x1={0}
      x2={0}
      y1={0}
      y2={$height}
    />
  {/if}
</g>

<style>
  .tick {
    font-size: 12px;
    font-weight: 500;
  }

  .tick-text {
    fill: #000000;
  }

  .gridline {
    stroke: #e5e7eb;
    stroke-dasharray: 4 4;
    opacity: 0.15;
  }

  .tick-mark {
    stroke: #000000;
    stroke-width: 1;
  }

  .baseline {
    stroke: #e5e7eb;
    stroke-width: 1;
  }
</style>
