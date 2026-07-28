<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";
  let {
    class: className = "",
    ...rest
  }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
  class={className}
  {...rest}
  width="1em"
  height="1em"
  viewBox="0 0 15 15"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M1.875 3.75V10.9569C1.875 11.0671 2.00705 11.1234 2.08652 11.0472L3.80399 9.40021C4.03672 9.17703 4.3467 9.05242 4.66916 9.05242H10C10.6904 9.05242 11.25 8.49277 11.25 7.80242V3.75C11.25 3.05964 10.6904 2.5 10 2.5H3.125C2.43464 2.5 1.875 3.05964 1.875 3.75Z"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
  />
  <path
    d="M13.125 5V12.8319C13.125 12.9421 12.993 12.9984 12.9135 12.9222L11.196 11.2752C10.9633 11.052 10.6533 10.9274 10.3308 10.9274H5.625"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
  />
</svg>
