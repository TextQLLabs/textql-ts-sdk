<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Text } from "../Text";
  import Debug from "./Debug.svelte";
  import { debugStore } from "../../debugStore";
  import {
    deviceType,
    initBreakpointListener,
    initScrollListener,
  } from "../../deviceStore";
  import { isDebugEnabled } from "../../utils";

  let { children, path } = $props<{ children?: Snippet; path: string }>();

  let homeLink: HTMLAnchorElement | null = $state(null);
  let blogLink: HTMLAnchorElement | null = $state(null);
  let componentsLink: HTMLAnchorElement | null = $state(null);
  let navEl: HTMLElement | null = $state(null);
  let indicatorStyle = $state("top: 0px; height: 0px;");

  const isBlogPath = (p: string) => p === "/blog" || p.startsWith("/blog/");

  const updateIndicator = () => {
    let activeLink: HTMLAnchorElement | null = null;
    if (path === "/") activeLink = homeLink;
    else if (isBlogPath(path)) activeLink = blogLink;
    else activeLink = componentsLink;

    if (activeLink && navEl) {
      const linkRect = activeLink.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      indicatorStyle = `top: ${linkRect.top - navRect.top}px; height: ${linkRect.height}px;`;
    }
  };

  $effect(() => {
    path;
    homeLink;
    blogLink;
    componentsLink;
    navEl;
    updateIndicator();
  });

  $effect(() => {
    const onPop = () => {
      debugStore.set(isDebugEnabled());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  onMount(() => {
    const stopBreakpoints = initBreakpointListener();
    const stopScroll = initScrollListener();
    return () => {
      stopBreakpoints();
      stopScroll();
    };
  });
</script>

{#if $debugStore}
  <Debug />
{/if}

<div class="relative z-[1] min-h-screen">
  {#if $deviceType === "desktop"}
    <aside
      class="fixed top-0 left-[12.5%] z-10 h-screen w-[12.5%] px-4 py-20"
    >
      <div class="sidebar-rule" aria-hidden="true">
        <div class="sidebar-rule__base"></div>
        <div class="sidebar-rule__shine"></div>
      </div>

      <nav bind:this={navEl} class="relative flex flex-col gap-0 text-right">
        <div
          class="absolute -right-3 top-0 w-0.5 bg-accent transition-all duration-300 ease-out"
          style={indicatorStyle}
        ></div>

        <Text
          type="paragraph"
          size="sm"
          color={path === "/" ? "accent" : "black"}
          links={path !== "/"}
          class="w-full"
        >
          <a
            bind:this={homeLink}
            href="/"
            class={path === "/" ? "no-underline" : ""}>home</a
          >
        </Text>

        <Text
          type="paragraph"
          size="sm"
          color={isBlogPath(path) ? "accent" : "black"}
          links={!isBlogPath(path)}
          class="w-full"
        >
          <a
            bind:this={blogLink}
            href="/blog"
            class={isBlogPath(path) ? "no-underline" : ""}>blog</a
          >
        </Text>

        {#if $debugStore}
          <Text
            type="paragraph"
            size="sm"
            color={path === "/xyz" ? "accent" : "black"}
            links={path !== "/xyz"}
            class="w-full"
          >
            <a
              bind:this={componentsLink}
              href="/xyz"
              class={path === "/xyz" ? "no-underline" : ""}>components</a
            >
          </Text>
        {/if}
      </nav>
    </aside>
  {:else}
    <nav
      class="fixed top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-4 backdrop-blur"
    >
      <div class="flex items-center gap-4">
        <Text
          type="paragraph"
          size="sm"
          color={path === "/" ? "accent" : "black"}
          links={path !== "/"}
        >
          <a href="/" class={path === "/" ? "no-underline" : ""}>home</a>
        </Text>

        <Text
          type="paragraph"
          size="sm"
          color={isBlogPath(path) ? "accent" : "black"}
          links={!isBlogPath(path)}
        >
          <a href="/blog" class={isBlogPath(path) ? "no-underline" : ""}>blog</a
          >
        </Text>

        {#if $debugStore}
          <Text
            type="paragraph"
            size="sm"
            color={path === "/xyz" ? "accent" : "black"}
            links={path !== "/xyz"}
          >
            <a href="/xyz" class={path === "/xyz" ? "no-underline" : ""}
              >components</a
            >
          </Text>
        {/if}
      </div>
    </nav>
  {/if}

  <div class="relative {$deviceType === 'desktop' ? 'pt-0' : 'pt-16'}">
    {@render children?.()}
  </div>
</div>

<style>
  .sidebar-rule {
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 64%;
    overflow: hidden;
  }

  .sidebar-rule__base {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      var(--color-line) 0%,
      var(--color-line) 45%,
      transparent 100%
    );
    transform: scaleY(0);
    transform-origin: top;
    animation: sidebar-rule-draw 1.15s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .sidebar-rule__shine {
    position: absolute;
    left: -0.5px;
    width: 2px;
    height: 28%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      color-mix(in srgb, var(--color-accent) 35%, white) 42%,
      color-mix(in srgb, var(--color-accent) 55%, white) 55%,
      transparent 100%
    );
    opacity: 0;
    filter: blur(0.3px);
    transform: translateY(-120%);
    animation: sidebar-rule-shine 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.1s
      forwards;
  }

  @keyframes sidebar-rule-draw {
    to {
      transform: scaleY(1);
    }
  }

  @keyframes sidebar-rule-shine {
    0% {
      opacity: 0;
      transform: translateY(-120%);
    }
    18% {
      opacity: 0.65;
    }
    70% {
      opacity: 0.28;
    }
    100% {
      opacity: 0;
      transform: translateY(280%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sidebar-rule__base {
      animation: none;
      transform: scaleY(1);
    }
    .sidebar-rule__shine {
      animation: none;
      opacity: 0;
    }
  }
</style>
