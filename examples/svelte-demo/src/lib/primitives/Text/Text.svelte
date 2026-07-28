<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    textSizeStyles,
    textColorStyles,
    textDefaultStyles,
    textLinkStyles,
    textTypeStyles,
    textTypeIsPixel,
    textHiddenMeasureStyles,
    SCRAMBLE_CHARS_PIXEL,
    SCRAMBLE_CHARS_FULL,
    type TextSize,
    type TextColor,
    type TextType,
  } from './text.css';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLParagraphElement> {
    size?: TextSize;
    color?: TextColor;
    children?: Snippet;
    type?: TextType;
    animate?: boolean;
    /** Trigger scramble animation when element enters viewport */
    animateOnView?: boolean;
    animateOnHover?: boolean;
    animationSpeed?: number;
    /** Total animation duration in ms - overrides animationSpeed to ensure consistent timing regardless of text length */
    duration?: number;
    cyclesPerChar?: number;
    /** IntersectionObserver threshold for animateOnView (0-1) */
    viewThreshold?: number;
    /** Charset used while scrambling. Defaults to a pixel-safe set for heading/important, full set otherwise. */
    chars?: string;
    /** Animate a smooth blue underline on links inside the text. */
    links?: boolean;
  }

  let {
    size = 'md',
    color = 'black',
    children,
    class: className,
    type = 'paragraph',
    animate = false,
    animateOnView = false,
    animateOnHover = false,
    animationSpeed = 15,
    duration = 800,
    cyclesPerChar = 3,
    viewThreshold = 0.1,
    chars,
    links = false,
    ...rest
  }: Props = $props();

  const charset = $derived(
    chars ?? (textTypeIsPixel[type] ? SCRAMBLE_CHARS_PIXEL : SCRAMBLE_CHARS_FULL)
  );

  let intervalId: ReturnType<typeof setInterval> | undefined = undefined;
  let displayText = $state('');
  let isAnimating = $state(false);
  let hiddenEl: HTMLSpanElement | null = $state(null);
  let containerEl: HTMLParagraphElement | null = $state(null);
  let viewObserver: IntersectionObserver | null = null;

  // Split charset by code point so multi-byte glyphs (CJK) are atomic.
  const glyphs = $derived([...charset]);
  const randomChar = () => glyphs[Math.floor(Math.random() * glyphs.length)];
  const isStable = (ch: string) => ch === ' ' || ch === '\n' || ch === '\t';

  const startAnimation = () => {
    const text = hiddenEl?.textContent ?? '';
    if (!text) {
      isAnimating = false;
      return;
    }

    clearInterval(intervalId);
    isAnimating = true;

    // Split by code point so CJK / multi-byte glyphs resolve as one unit.
    const target = [...text];

    // Everything from `index` onward is still scrambling (spaces pass through).
    const scrambleFrom = (start: number) =>
      target
        .slice(start)
        .map((ch) => (isStable(ch) ? ch : randomChar()))
        .join('');

    const nonSpace = target.filter((ch) => !isStable(ch)).length || 1;
    const totalTicks = nonSpace * (cyclesPerChar + 1);
    const speed = duration ? Math.max(1, Math.floor(duration / totalTicks)) : animationSpeed;

    let index = 0; // next position to lock — reveals left → right
    let cycle = 0;

    displayText = scrambleFrom(0); // initial fully-scrambled frame

    intervalId = setInterval(() => {
      // skip spaces/newlines instantly
      while (index < target.length && isStable(target[index])) index++;

      if (index >= target.length) {
        displayText = text;
        clearInterval(intervalId);
        isAnimating = false;
        return;
      }

      const locked = target.slice(0, index).join('');

      if (cycle < cyclesPerChar) {
        // current slot flickers through random glyphs before settling
        displayText = locked + randomChar() + scrambleFrom(index + 1);
        cycle++;
      } else {
        index++; // lock the current character
        cycle = 0;
        displayText = target.slice(0, index).join('') + scrambleFrom(index);
      }
    }, speed);
  };

  const handleMouseEnter = () => {
    if (animateOnHover) {
      startAnimation();
    }
  };

  onMount(() => {
    if (animate) {
      startAnimation();
    }

    if (animateOnView && containerEl) {
      viewObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startAnimation();
              viewObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: viewThreshold }
      );
      viewObserver.observe(containerEl);
    }
  });

  onDestroy(() => {
    clearInterval(intervalId);
    viewObserver?.disconnect();
  });
</script>

{#if animate || animateOnView || animateOnHover}
  <span
    bind:this={hiddenEl}
    aria-hidden="true"
    class="{textSizeStyles[size]} {textTypeStyles[type]} {textHiddenMeasureStyles}"
  >
    {@render children?.()}
  </span>
{/if}

<!-- Self-animating Text owns its own scramble and toggles its content between
     {displayText} and {@render children}. The rave word-swap mutates the DOM
     directly (replaceWith), which Svelte can't reconcile across that toggle —
     leaving orphaned wrapped words behind. Opt these out of the rave collector. -->
<p
  bind:this={containerEl}
  class="{textSizeStyles[size]} {textColorStyles[color]} {textDefaultStyles} {textTypeStyles[type]} {links ? textLinkStyles : ''} {className ?? ''}"
  onmouseenter={handleMouseEnter}
  data-no-rave={animate || animateOnView || animateOnHover ? "" : undefined}
  {...rest}
>
  {#if isAnimating}
    {displayText}
  {:else}
    {@render children?.()}
  {/if}
</p>

<style>
  /* Buttons styled as links get the same animated underline (and a button
     reset) so an in-text action can be a real <button> without looking like one. */
  .text-link-animate :global(a),
  .text-link-animate :global(button) {
    color: inherit;
    text-decoration: none;
    background-color: transparent;
    border: 0;
    padding: 0;
    font: inherit;
    cursor: pointer;
    background-image: linear-gradient(var(--color-accent), var(--color-accent));
    background-position: 0% 100%;
    background-size: 0% 0.075em;
    background-repeat: no-repeat;
    transition: background-size 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .text-link-animate :global(a:hover),
  .text-link-animate :global(button:hover) {
    background-size: 100% 0.075em;
  }
</style>
