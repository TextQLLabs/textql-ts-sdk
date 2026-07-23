import { mount, unmount } from "svelte";
import Confirm from "./Confirm.svelte";
import type { ConfirmOptions } from "./types";

/**
 * Imperatively ask the user to confirm an action. Resolves `true` if they
 * confirm, `false` if they cancel/dismiss. Mounts its own dialog, so no host
 * component is required.
 *
 * @example
 *   if (!(await confirm({ tone: "danger", title: "Delete thread?" }))) return;
 *   await api.delete(id);
 */
export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  // Guard against SSR — confirmations are inherently interactive.
  if (typeof document === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      // Play the outro, then tear down the mount point.
      Promise.resolve(unmount(app, { outro: true })).then(() => {
        target.remove();
      });
      resolve(result);
    };

    const app = mount(Confirm, {
      target,
      props: {
        ...options,
        open: true,
        onconfirm: () => finish(true),
        oncancel: () => finish(false),
      },
    });
  });
}
