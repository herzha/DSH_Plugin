/**
 * DSH-Theme-OpenDisplay-Stalker — host half.
 *
 * The plugin is entirely browser-side: it paints a boot splash in the renderer
 * through one namespaced stylesheet plus a portal mounted on document.body.
 * This entry exists so the Cordis loader can discover the package, register the
 * row in the plugin inventory, and give the web client entry a client bundle to
 * request. It intentionally holds no state, no service and no listener, so it
 * has nothing to clean up on unload.
 */

/** Public plugin name, matching the loader row id. */
export const name = 'DSH-Theme-OpenDisplay-Stalker'

/** No host-side capability is contributed. */
export function apply () {}
