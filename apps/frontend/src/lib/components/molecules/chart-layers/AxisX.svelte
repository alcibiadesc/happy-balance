<script lang="ts">
  import { getContext } from 'svelte';

  interface Props {
    gridlines?: boolean;
    tickMarks?: boolean;
    baseline?: boolean;
    snapTicks?: boolean;
    formatTick?: (d: any) => string;
    ticks?: number | any[];
  }

  let {
    gridlines = true,
    tickMarks = false,
    baseline = false,
    snapTicks = false,
    formatTick = (d: any) => d,
    ticks = undefined
  }: Props = $props();

  const { xScale, yRange, width } = getContext('LayerCake');

  let tickVals = $derived.by(() => {
    if (Array.isArray(ticks)) {
      return ticks;
    }

    if (typeof $xScale.ticks === 'function') {
      return $xScale.ticks(ticks);
    }

    // For scalePoint or scaleBand
    return $xScale.domain();
  });

  function getTickPosition(tick: any) {
    const pos = $xScale(tick);
    // For scalePoint, center the tick
    if (typeof $xScale.bandwidth === 'function') {
      return pos + $xScale.bandwidth() / 2;
    }
    return pos;
  }
</script>

<g class="axis axis-x">
  {#each tickVals as tick, i (i)}
    {@const tickPosition = getTickPosition(tick)}

    <g class="tick tick-{i}" transform="translate({tickPosition},{$yRange[0]})">
      {#if gridlines}
        <line
          class="gridline"
          y1={0}
          y2={-$yRange[0]}
          x1={0}
          x2={0}
        />
      {/if}

      {#if tickMarks}
        <line
          class="tick-mark"
          y1={0}
          y2={6}
          x1={0}
          x2={0}
        />
      {/if}

      <text
        class="tick-text"
        y={16}
        text-anchor="middle"
      >
        {formatTick(tick)}
      </text>
    </g>
  {/each}

  {#if baseline}
    <line
      class="baseline"
      y1={$yRange[0]}
      y2={$yRange[0]}
      x1={0}
      x2={$width}
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
