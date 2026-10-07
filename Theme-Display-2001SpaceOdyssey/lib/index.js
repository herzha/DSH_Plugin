/**
 * DSH-theme-display-2001SpaceOdyssey — host half.
 *
 * The plugin is entirely browser-side: it paints a display layer through
 * `ctx.theme.overrideTokens()` and one namespaced stylesheet. This entry
 * exists so the Cordis loader can discover the package, register the row in
 * the plugin inventory, and give the web client entry a client bundle to
 * request. It intentionally holds no state, no service and no listener, so it
 * has nothing to clean up on unload.
 */

/** Public plugin name, matching the loader row id. */
export const name = 'dsh-theme-display-2001SpaceOdyssey'

/** No host-side capability is contributed. */
export function apply () {}
