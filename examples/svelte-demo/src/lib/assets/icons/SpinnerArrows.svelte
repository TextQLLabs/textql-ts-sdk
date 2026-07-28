<script lang="ts">
  let className = "";
  export { className as class };
  import { getBrand } from "$/lib/brand/config";

  const {
    theme: {
      floating_colors: {
        spinnerArrows: { arrows },
      },
    },
  } = getBrand();
</script>

<svg
  class={className}
  width="14"
  height="19"
  viewBox="0 0 14 19"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M7 3.5C5.86838 3.5 4.75984 3.82002 3.80232 4.4231C2.84481 5.02619 2.07736 5.88777 1.58858 6.90838C1.09979 7.92898 0.909591 9.06701 1.03993 10.1911C1.17027 11.3152 1.61584 12.3795 2.32521 13.2612"
    stroke="url(#paint0_linear_1147_51813)"
    stroke-width="1.5"
  />
  <path d="M10 3.5L7 6.09808L7 0.901924L10 3.5Z" fill={arrows.fill} />
  <path
    d="M7 15.5C8.13162 15.5 9.24016 15.18 10.1977 14.5769C11.1552 13.9738 11.9226 13.1122 12.4114 12.0916C12.9002 11.071 13.0904 9.93299 12.9601 8.80891C12.8297 7.68482 12.3842 6.62052 11.6748 5.73884"
    stroke="url(#paint1_linear_1147_51813)"
    stroke-width="1.5"
  />
  <path d="M4 15.5L7 12.9019L7 18.0981L4 15.5Z" fill={arrows.fill} />
  <defs>
    <linearGradient
      id="paint0_linear_1147_51813"
      x1="3"
      y1="3"
      x2="0.999999"
      y2="13"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color={arrows.gradient.start} />
      <stop
        offset="0.265"
        stop-color={arrows.gradient.mid}
        stop-opacity="0.75"
      />
      <stop
        offset="1"
        stop-color={arrows.gradient.end}
        stop-opacity="0.05"
      />
    </linearGradient>
    <linearGradient
      id="paint1_linear_1147_51813"
      x1="11"
      y1="16"
      x2="13"
      y2="6"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color={arrows.gradient.start} />
      <stop
        offset="0.265"
        stop-color={arrows.gradient.mid}
        stop-opacity="0.75"
      />
      <stop
        offset="1"
        stop-color={arrows.gradient.end}
        stop-opacity="0.05"
      />
    </linearGradient>
  </defs>
</svg>
