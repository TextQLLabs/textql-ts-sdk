<script lang="ts">
  import type { Snippet } from "svelte";
  import Modal from "./Modal.svelte";
  import Button from "../Button/Button.svelte";
  import type { ConfirmTone } from "./types";

  interface Props {
    /** Bindable open state. */
    open?: boolean;
    title?: string;
    /** Message body. Ignored if a `children` snippet is provided. */
    description?: string;
    /** Rich body content; overrides `description`. */
    children?: Snippet;
    confirmLabel?: string;
    cancelLabel?: string;
    /**
     * Visual class of the dialog. `danger` for destructive actions (deletes),
     * `warning` for risky-but-reversible, `info`/`neutral` for plain confirms.
     */
    tone?: ConfirmTone;
    /**
     * Show a busy state on the confirm button and block dismissal — set this
     * while an async `onconfirm` is in flight. The dialog does NOT close itself
     * on confirm, so the caller controls closing after the work completes.
     */
    loading?: boolean;
    /** Fired when the primary action is pressed. May be async. */
    onconfirm?: () => void;
    /** Fired on cancel, backdrop, or Escape. Dialog closes itself first. */
    oncancel?: () => void;
  }

  let {
    open = $bindable(false),
    title = "Are you sure?",
    description,
    children: body,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    tone = "info",
    loading = $bindable(false),
    onconfirm,
    oncancel,
  }: Props = $props();

  const confirmVariant = $derived(tone === "danger" ? "danger" : "solid");

  const toneAccent: Record<ConfirmTone, string> = {
    danger: "bg-red-500/12 text-red-600",
    warning: "bg-amber-500/12 text-amber-600",
    info: "bg-accent/12 text-accent",
    neutral: "bg-line/60 text-muted",
  };

  function cancel() {
    if (loading) return;
    open = false;
    oncancel?.();
  }
</script>

<Modal bind:open {title} dismissable={!loading} onclose={oncancel}>
  <div class="flex items-start gap-3">
    <span
      class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full {toneAccent[
        tone
      ]}"
      aria-hidden="true"
    >
      {#if tone === "danger" || tone === "warning"}
        <!-- alert triangle -->
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      {:else}
        <!-- info circle -->
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      {/if}
    </span>
    <div class="min-w-0 flex-1">
      {#if body}
        {@render body()}
      {:else if description}
        <p>{description}</p>
      {/if}
    </div>
  </div>

  {#snippet actions()}
    <Button variant="ghost" disabled={loading} onclick={cancel}>
      {cancelLabel}
    </Button>
    <Button variant={confirmVariant} disabled={loading} onclick={onconfirm}>
      {loading ? "Working…" : confirmLabel}
    </Button>
  {/snippet}
</Modal>
