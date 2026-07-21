<script module lang="ts">
  const TIME_FMT = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Text, type TextSize } from "../Text";
  import { deviceType } from "../../deviceStore";
  import { getRouteLabel } from "../../utils";

  let {
    title,
    label,
    lead,
    titleSize = "lg",
    contentClass = "flex flex-col gap-8",
    showTime = false,
    children,
  }: {
    title: string;
    label?: string;
    lead?: string;
    titleSize?: TextSize;
    contentClass?: string;
    showTime?: boolean;
    children?: Snippet;
  } = $props();

  let currentPath = $state(
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  $effect(() => {
    const onPop = () => (currentPath = window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  const derivedLabel = $derived(label ?? getRouteLabel(currentPath));

  let timeString = $state("");

  const updateTime = () => {
    const parts = TIME_FMT.formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    timeString = `${part("hour")}:${part("minute")}:${part("second")} ${part("timeZoneName")}`;
  };

  onMount(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });
</script>

<main
  class="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-12 {$deviceType ===
  'mobile'
    ? 'px-4 pt-12 pb-28'
    : 'px-6 py-20'}"
>
  <header class="flex flex-col">
    <div class="flex items-baseline justify-between gap-3">
      {#if derivedLabel}
        <Text type="label" size="xs" color="muted" class="leading-none"
          >{derivedLabel}</Text
        >
      {:else}
        <span></span>
      {/if}
      {#if showTime}
        <Text type="label" size="xs" color="muted" class="leading-none"
          >New York City, NY</Text
        >
      {/if}
    </div>
    <div class="flex flex-row items-baseline justify-between gap-2">
      <Text
        type="heading"
        size={titleSize}
        color="black"
        animate
        animateOnHover
        class="leading-tight"
      >
        {title}
      </Text>
      {#if showTime}
        <Text
          type="label"
          size="xs"
          color="muted"
          animate
          duration={200}
          class="shrink-0"
        >
          {timeString}
        </Text>
      {/if}
    </div>
    {#if lead}
      <Text type="paragraph" size="sm" color="muted" class="mt-2">{lead}</Text>
    {/if}
  </header>

  <div class={contentClass}>
    {@render children?.()}
  </div>
</main>
