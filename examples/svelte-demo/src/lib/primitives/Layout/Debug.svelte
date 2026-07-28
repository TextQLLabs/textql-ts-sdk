<script lang="ts">
  import { debugStore } from "../../debugStore";
  import { Button } from "../Button";

  let divisions = $state(8);

  // Read initial divisions from the URL if a numeric value is provided.
  const params = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const debugParam = params.get("debug");
  if (debugParam && debugParam !== "true" && !isNaN(Number(debugParam))) {
    divisions = Number(debugParam);
  }

  const writeDebugParam = (value: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value === null) url.searchParams.delete("debug");
    else url.searchParams.set("debug", value);
    history.replaceState({}, "", url.toString());
  };

  const setDivisions = (n: number) => {
    divisions = n;
    writeDebugParam(String(n));
  };

  const close = () => {
    writeDebugParam(null);
    debugStore.set(false);
  };
</script>

<!-- Grid overlay -->
<div class="pointer-events-none fixed inset-0 z-50 flex">
  {#each Array.from({ length: divisions - 1 }, (_, i) => i + 1) as i}
    <div
      class="absolute top-0 h-full w-px bg-accent/30"
      style="left: {(i / divisions) * 100}%"
    ></div>
  {/each}
</div>

<!-- Toggle panel -->
<div
  class="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-sm border border-line bg-paper p-2 shadow-sm"
>
  <span class="font-mono text-xs text-muted">grid</span>
  {#each [4, 8, 16] as n}
    <Button
      size="sm"
      variant={divisions === n ? "solid" : "ghost"}
      onclick={() => setDivisions(n)}
    >
      {n}
    </Button>
  {/each}
  <Button
    size="sm"
    variant="ghost"
    aria-label="Close debug grid"
    onclick={close}
  >
    ×
  </Button>
</div>
