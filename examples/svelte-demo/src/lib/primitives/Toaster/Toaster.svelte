<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Toaster as Sonner } from "svelte-sonner";

  let { ...props }: ComponentProps<typeof Sonner> = $props();
</script>

<!--
  richColors gives success a green / error a red treatment; we keep the mono
  font + shape but leave colours to sonner so type styling shows through.
-->
<Sonner
  position="top-right"
  richColors
  toastOptions={{
    classes: {
      toast:
        "!font-mono !rounded-sm !shadow-[0_8px_30px_-6px_rgba(10,10,10,0.18)]",
      title: "!font-mono !text-sm !font-medium",
      description: "!font-mono !text-xs",
      actionButton: "!bg-accent !text-paper !font-mono !text-xs !rounded-sm",
      cancelButton: "!bg-line !text-ink !font-mono !text-xs !rounded-sm",
    },
  }}
  {...props}
/>
