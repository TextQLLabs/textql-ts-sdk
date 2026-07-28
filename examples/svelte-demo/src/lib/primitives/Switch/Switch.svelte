<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLButtonAttributes, "onchange"> {
    /** Bindable on/off state. */
    checked?: boolean;
    /** Called with the new state when toggled. */
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    onCheckedChange,
    disabled = false,
    class: className,
    ...rest
  }: Props = $props();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onCheckedChange?.(checked);
  }
</script>

<!-- Squared switch in the editorial palette: paper track + ink thumb that
     inverts to an accent track + paper thumb when on. -->
<button
  {...rest}
  type="button"
  role="switch"
  aria-checked={checked}
  {disabled}
  data-checked={checked ? "" : undefined}
  onclick={toggle}
  class="inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line bg-paper p-0.5 outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40 data-[checked]:border-accent data-[checked]:bg-accent {className ??
    ''}"
>
  <span
    data-checked={checked ? "" : undefined}
    class="size-3.5 rounded-full bg-ink transition-[translate,background-color] duration-150 data-[checked]:translate-x-[18px] data-[checked]:bg-paper"
  ></span>
</button>
