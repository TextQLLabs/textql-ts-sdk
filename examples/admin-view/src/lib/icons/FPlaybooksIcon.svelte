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
    d="M11.9127 13.1665H4.23222C3.62625 13.1665 3.13501 12.6753 3.13501 12.0693C3.13501 11.4633 3.62625 10.9721 4.23222 10.9721H9.71829H10.6588C11.3513 10.9721 11.9127 10.4106 11.9127 9.7181V3.13482C11.9127 2.44228 11.3513 1.88086 10.6588 1.88086H9.71829M3.13501 12.226V3.13482C3.13501 2.44228 3.69643 1.88086 4.38897 1.88086H9.71829M9.71829 1.88086V9.09112"
    stroke="currentColor"
    stroke-width="1.25396"
    stroke-linecap="round"
  />
</svg>
