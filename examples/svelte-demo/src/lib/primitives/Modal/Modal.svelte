<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  interface Props {
    /** Bindable open state. */
    open?: boolean;
    title?: string;
    /** Body content. */
    children?: Snippet;
    /**
     * Footer buttons. Convention: pass the dismiss/secondary button FIRST and
     * the primary action LAST — the row is right-aligned, so the primary action
     * sits on the right and the dismiss to its left.
     */
    actions?: Snippet;
    /** Called when dismissed via backdrop or Escape (not on programmatic close). */
    onclose?: () => void;
    /** Allow clicking the backdrop to dismiss. */
    dismissable?: boolean;
  }

  let {
    open = $bindable(false),
    title,
    children,
    actions,
    onclose,
    dismissable = true,
  }: Props = $props();

  function dismiss() {
    open = false;
    onclose?.();
  }

  function onKeydown(e: KeyboardEvent) {
    if (open && dismissable && e.key === "Escape") dismiss();
  }

  // Panel entrance: fade + a subtle rise and scale, matching the polished feel
  // of Tooltip.svelte (cubicOut, short duration, opacity + transform).
  function reveal(_node: Element, { duration = 180 } = {}) {
    return {
      duration,
      easing: cubicOut,
      css: (t: number, u: number) =>
        `opacity:${t};transform:translateY(${6 * u}px) scale(${0.97 + 0.03 * t})`,
    };
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <button
      class="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
      transition:fade|global={{ duration: 160, easing: cubicOut }}
      onclick={() => dismissable && dismiss()}
      aria-label="Close"
      tabindex="-1"
    ></button>

    <div
      class="relative z-10 w-full max-w-xs rounded-lg border border-line bg-paper px-4 py-3 shadow-[0_20px_60px_-12px_rgba(15,15,20,0.18)] [will-change:transform,opacity]"
      transition:reveal|global={{ duration: 180 }}
    >
      {#if title}
        <h2 class="font-sans text-base font-medium leading-tight text-ink">{title}</h2>
      {/if}
      {#if children}
        <div class="mt-1.5 font-sans text-sm leading-relaxed text-muted">
          {@render children()}
        </div>
      {/if}
      {#if actions}
        <!-- Right-aligned: dismiss (first) on the left, primary action (last)
             on the right. -->
        <div class="mt-4 flex justify-end gap-2">
          {@render actions()}
        </div>
      {/if}
    </div>
  </div>
{/if}
