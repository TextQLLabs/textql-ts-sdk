<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";
  let {
    class: className = "",
    ...rest
  }: SVGAttributes<SVGSVGElement> = $props();
</script>

<!--
  Two-tone "eye": the light glint (#F0F0EE) sits on top of the currentColor iris,
  so it stays visible on both light and dark themes. Only the iris + lid arc
  follow currentColor.
-->
<svg
  class={className}
  {...rest}
  width="1em"
  height="1em"
  viewBox="0 0 15 15"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle cx="7.52379" cy="8.77769" r="2.50792" fill="currentColor" />
  <circle cx="7.8372" cy="8.46415" r="0.940469" fill="#F0F0EE" />
  <path
    d="M12.5395 9.40475C12.5395 6.63458 10.2938 4.38892 7.52365 4.38892C4.75348 4.38892 2.50781 6.63458 2.50781 9.40475"
    stroke="currentColor"
    stroke-width="1.56745"
    stroke-linecap="round"
  />
</svg>
