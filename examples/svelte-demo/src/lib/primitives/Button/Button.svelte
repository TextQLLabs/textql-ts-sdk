<script lang="ts">
  import type { Snippet } from "svelte";

  type Variant =
    | "solid"
    | "classic"
    | "soft"
    | "surface"
    | "outline"
    | "ghost"
    | "danger"
    | "danger-soft";
  type Size = "xs" | "sm" | "md" | "lg" | "xl";

  interface Props {
    variant?: Variant;
    size?: Size;
    href?: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    variant = "solid",
    size = "md",
    href,
    disabled = false,
    class: className = "",
    children,
    ...rest
  }: Props = $props();

  const base =
    "inline-flex select-none items-center justify-center gap-1.5 rounded-md font-sans whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

  const sizes: Record<Size, string> = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
    xl: "px-5 py-2.5 text-base",
  };

  const variants: Record<Variant, string> = {
    solid: "bg-accent text-paper hover:opacity-90",
    // Raised/embossed: inner top highlight + drop shadow, lifts on hover.
    classic:
      "bg-accent text-paper shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_2px_4px_-1px_rgba(10,10,10,0.45)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_3px_6px_-1px_rgba(10,10,10,0.5)] active:translate-y-px active:shadow-[inset_0_1px_2px_0_rgba(10,10,10,0.4)]",
    soft: "bg-accent/10 text-accent hover:bg-accent/20",
    surface:
      "border border-line bg-paper text-ink hover:border-accent hover:text-accent",
    outline: "border border-accent text-accent hover:bg-accent/10",
    ghost: "text-muted hover:bg-line/40 hover:text-accent",
    // Destructive: solid red for confirm-to-delete style actions.
    danger: "bg-red-600 text-paper hover:bg-red-700",
    "danger-soft": "bg-red-500/10 text-red-600 hover:bg-red-500/20",
  };

  const cls = $derived(
    `${base} ${sizes[size]} ${variants[variant]} ${className}`,
  );
</script>

<!-- A disabled link isn't inert, so fall back to a real disabled <button>. -->
{#if href && !disabled}
  <a {href} class={cls} {...rest}>{@render children?.()}</a>
{:else}
  <button {disabled} class={cls} {...rest}>{@render children?.()}</button>
{/if}
