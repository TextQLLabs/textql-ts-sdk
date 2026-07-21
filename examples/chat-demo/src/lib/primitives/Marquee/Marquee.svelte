<script lang="ts">
  import { tick } from "svelte";

  let {
    text,
    class: className = "",
    speed = 40, // scroll speed in px/second
    gap = 32, // px between the repeated copies
    center = false, // centre the text when it fits (still scrolls left when it overflows)
  }: {
    text: string;
    class?: string;
    speed?: number;
    gap?: number;
    center?: boolean;
  } = $props();

  let outer = $state<HTMLElement | null>(null);
  let first = $state<HTMLElement | null>(null);
  let scroll = $state(false);
  const reduced =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

  $effect(() => {
    text;
    gap;
    speed; // re-measure when any of these change
    if (reduced || !outer || !first) return;
    let anim: Animation | null = null;
    const measure = async () => {
      anim?.cancel();
      anim = null;
      const over = first!.scrollWidth > outer!.clientWidth + 1;
      if (over !== scroll) {
        scroll = over;
        await tick(); // let the second copy mount before animating the track
      }
      if (!scroll) return;
      const shift = first!.scrollWidth + gap;
      const track = first!.parentElement as HTMLElement;
      anim = track.animate(
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${-shift}px)` },
        ],
        {
          duration: (shift / speed) * 1000,
          iterations: Infinity,
          easing: "linear",
        },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    return () => {
      ro.disconnect();
      anim?.cancel();
    };
  });
</script>

<div bind:this={outer} class="overflow-hidden {className}">
  <!-- w-max keeps the track at content width for the scroll animation; when it
       fits and `center` is set, go full-width + justify-center to centre it. -->
  <div
    class="flex whitespace-nowrap {center && !scroll
      ? 'w-full justify-center'
      : 'w-max'}"
    style="gap: {gap}px"
  >
    <span bind:this={first}>{text}</span>
    {#if scroll}<span aria-hidden="true">{text}</span>{/if}
  </div>
</div>
