/**
 * DSH-theme-display-2001SpaceOdyssey — web client half.
 *
 * Display contract (why this plugin stays stackable):
 *
 *  1. It replaces no Slot that another plugin owns. It ADDS one settings page
 *     (`settings.section`, a list slot: a fresh id is added beside the shipped
 *     entries) and otherwise only stacks a token layer with
 *     `ctx.theme.overrideTokens()` plus one stylesheet scoped to
 *     `html[data-dsh-2001]`. Unload removes all three without residue.
 *  2. The host DOM it names is either an attribute the shell publishes on
 *     purpose (`[data-slot=…]` outlet anchors, `[data-composer-card]`,
 *     `[data-row-key]`, `[data-windows-menu]`, `html[data-windows-titlebar]`)
 *     or a CSS-module local name used through a `[class*=…]` substring match.
 *     Losing any of them drops decoration only — never layout or function.
 *  3. The backdrop is data, not a path: a picked image is copied into
 *     IndexedDB as a Blob and served back through an object URL, so deleting
 *     the original file cannot break the background, and a missing or
 *     unreadable record falls back to the bundled rendition.
 */
window.__ModuleLoader__.load({
	id: "dsh-theme-display-2001-space-odyssey",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/** React is a baseline module of the web module table. */
		const React = require("react");
		const h = React.createElement;

		/** Package id; also the identity of the token layer this plugin stacks. */
		const PLUGIN_ID = "dsh-theme-display-2001-space-odyssey";
		/** Attribute that scopes every rule this plugin injects. */
		const ROOT_ATTRIBUTE = "data-dsh-2001";
		/** Marker on the injected stylesheet, so it can be found and removed. */
		const STYLE_ATTRIBUTE = "data-dsh-2001-style";
		/** Marker set on <html> while a user plate is active. */
		const PLATE_ATTRIBUTE = "data-dsh-2001-plate";

		/* ── background source ────────────────────────────────────────────────
		 * BACKGROUND_URL is empty by default, which uses the bundled SVG
		 * rendition. The settings page writes the picked image into
		 * `--dsh-2001-plate` instead, so this constant stays the fallback.
		 * `tools/set-background.mjs` can also rewrite it, including from a
		 * local image file. ─────────────────────────────────────────────── */
		const BACKGROUND_URL = "";
		const BACKGROUND_RENDITION = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDEwODAiIHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIHNsaWNlIj4KPGRlZnM+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9Im1vdXRoIiBjeD0iNTAlIiBjeT0iNDYlIiByPSI0NiUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZWFmNGZmIiBzdG9wLW9wYWNpdHk9IjAuNTAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0MiUiIHN0b3AtY29sb3I9IiM5ZGM0ZmYiIHN0b3Atb3BhY2l0eT0iMC4xOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwYTE1MjYiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iaGF6ZSIgY3g9IjUwJSIgY3k9IjQ2JSIgcj0iNzQlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzBhMTIyMCIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iNDYlIiBzdG9wLWNvbG9yPSIjMDcwYzE1IiBzdG9wLW9wYWNpdHk9IjAuMjIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDMwNjBiIiBzdG9wLW9wYWNpdHk9IjAuODQiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9InZpZyIgY3g9IjUwJSIgY3k9IjQ2JSIgcj0iODAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwMCIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iNTUlIiBzdG9wLWNvbG9yPSIjMDAwIiBzdG9wLW9wYWNpdHk9IjAuMjYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDAwIiBzdG9wLW9wYWNpdHk9IjAuOTAiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRlIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwYjJhNTUiIHN0b3Atb3BhY2l0eT0iMC4zNCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUyJSIgc3RvcC1jb2xvcj0iIzA0MTAxZiIgc3RvcC1vcGFjaXR5PSIwLjMwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAxMDQwOSIgc3RvcC1vcGFjaXR5PSIwLjY2Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJsaWdodEJhciIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZmZmZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0NiUiIHN0b3AtY29sb3I9IiNmMmY4ZmYiIHN0b3Atb3BhY2l0eT0iMC45NSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZmZmZmYiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMwMzA2MGIiLz4KPHJlY3QgeD0iLTE0OTAuMCIgeT0iLTkyMC4wIiB3aWR0aD0iNDkwMC4wIiBoZWlnaHQ9IjI4NDAuMCIgcng9IjQ4Mi44IiBmaWxsPSIjZWVmM2Y5Ii8+CjxyZWN0IHg9Ii0xNDkwLjAiIHk9Ii05MjAuMCIgd2lkdGg9IjQ5MDAuMCIgaGVpZ2h0PSI0MjYuMCIgcng9IjM4Ni4yIiBmaWxsPSIjYzJjYmQ4Ii8+CjxyZWN0IHg9Ii0xNDkwLjAiIHk9Ijg0MC44IiB3aWR0aD0iNDkwMC4wIiBoZWlnaHQ9IjEwNzkuMiIgcng9IjMzOC4wIiBmaWxsPSIjYTRhZWJjIi8+CjxyZWN0IHg9IjkzNS41IiB5PSI4NDAuOCIgd2lkdGg9IjQ5LjAiIGhlaWdodD0iMTA3OS4yIiBmaWxsPSIjMzk0MzRmIiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9Ii0xNDkwLjAiIHk9Ii05MjAuMCIgd2lkdGg9IjQ5MDAuMCIgaGVpZ2h0PSIyODQwLjAiIHJ4PSI0ODIuOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzk0MzRmIiBzdHJva2Utb3BhY2l0eT0iMC44NTAiIHN0cm9rZS13aWR0aD0iOC41Ii8+CjxyZWN0IHg9Ii0xNDkwLjAiIHk9Ii05Ni40IiB3aWR0aD0iNDkwMC4wIiBoZWlnaHQ9IjEyLjgiIGZpbGw9IiMzOTQzNGYiIG9wYWNpdHk9IjAuNDQwIi8+CjxyZWN0IHg9Ii0xNDkwLjAiIHk9IjY5OC44IiB3aWR0aD0iNDkwMC4wIiBoZWlnaHQ9IjEyLjgiIGZpbGw9IiMzOTQzNGYiIG9wYWNpdHk9IjAuNDQwIi8+CjxyZWN0IHg9IjM5Ni41IiB5PSItODM0LjgiIHdpZHRoPSIxMTI3LjAiIGhlaWdodD0iMzEuMiIgcng9IjE1LjYiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjkyMCIvPgo8cmVjdCB4PSItNTUyLjMiIHk9Ii0zNzYuNSIgd2lkdGg9IjMwMjQuNyIgaGVpZ2h0PSIxNzUzLjEiIHJ4PSIyOTguMCIgZmlsbD0iI2I2YmRjNyIvPgo8cmVjdCB4PSItNTUyLjMiIHk9Ii0zNzYuNSIgd2lkdGg9IjMwMjQuNyIgaGVpZ2h0PSIyNjMuMCIgcng9IjIzOC40IiBmaWxsPSIjYTZhZWJhIi8+CjxyZWN0IHg9Ii01NTIuMyIgeT0iNzEwLjQiIHdpZHRoPSIzMDI0LjciIGhlaWdodD0iNjY2LjIiIHJ4PSIyMDguNiIgZmlsbD0iIzdkODg5NSIvPgo8cmVjdCB4PSI5NDQuOSIgeT0iNzEwLjQiIHdpZHRoPSIzMC4yIiBoZWlnaHQ9IjY2Ni4yIiBmaWxsPSIjMzMzZDQ4IiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9Ii01NTIuMyIgeT0iLTM3Ni41IiB3aWR0aD0iMzAyNC43IiBoZWlnaHQ9IjE3NTMuMSIgcng9IjI5OC4wIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzNkNDgiIHN0cm9rZS1vcGFjaXR5PSIwLjc3MyIgc3Ryb2tlLXdpZHRoPSI1LjMiLz4KPHJlY3QgeD0iLTU1Mi4zIiB5PSIxMzEuOSIgd2lkdGg9IjMwMjQuNyIgaGVpZ2h0PSI3LjkiIGZpbGw9IiMzMzNkNDgiIG9wYWNpdHk9IjAuNDAwIi8+CjxyZWN0IHg9Ii01NTIuMyIgeT0iNjIyLjciIHdpZHRoPSIzMDI0LjciIGhlaWdodD0iNy45IiBmaWxsPSIjMzMzZDQ4IiBvcGFjaXR5PSIwLjQwMCIvPgo8cmVjdCB4PSI2MTIuMiIgeT0iLTMyNC4wIiB3aWR0aD0iNjk1LjciIGhlaWdodD0iMTkuMyIgcng9IjkuNiIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuODI1Ii8+CjxyZWN0IHg9Ii0xMzMuOCIgeT0iLTEzMy45IiB3aWR0aD0iMjE4Ny41IiBoZWlnaHQ9IjEyNjcuOSIgcng9IjIxNS41IiBmaWxsPSIjYjhiZGMzIi8+CjxyZWN0IHg9Ii0xMzMuOCIgeT0iLTEzMy45IiB3aWR0aD0iMjE4Ny41IiBoZWlnaHQ9IjE5MC4yIiByeD0iMTcyLjQiIGZpbGw9IiM5NjllYWEiLz4KPHJlY3QgeD0iLTEzMy44IiB5PSI2NTIuMSIgd2lkdGg9IjIxODcuNSIgaGVpZ2h0PSI0ODEuOCIgcng9IjE1MC45IiBmaWxsPSIjN2Y4ODk0Ii8+CjxyZWN0IHg9Ijk0OS4xIiB5PSI2NTIuMSIgd2lkdGg9IjIxLjkiIGhlaWdodD0iNDgxLjgiIGZpbGw9IiMzMDM5NDUiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iLTEzMy44IiB5PSItMTMzLjkiIHdpZHRoPSIyMTg3LjUiIGhlaWdodD0iMTI2Ny45IiByeD0iMjE1LjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMwMzk0NSIgc3Ryb2tlLW9wYWNpdHk9IjAuNzMyIiBzdHJva2Utd2lkdGg9IjMuOCIvPgo8cmVjdCB4PSItMTMzLjgiIHk9IjIzMy44IiB3aWR0aD0iMjE4Ny41IiBoZWlnaHQ9IjUuNyIgZmlsbD0iIzMwMzk0NSIgb3BhY2l0eT0iMC4zNzkiLz4KPHJlY3QgeD0iLTEzMy44IiB5PSI1ODguOCIgd2lkdGg9IjIxODcuNSIgaGVpZ2h0PSI1LjciIGZpbGw9IiMzMDM5NDUiIG9wYWNpdHk9IjAuMzc5Ii8+CjxyZWN0IHg9IjcwOC40IiB5PSItOTUuOSIgd2lkdGg9IjUwMy4xIiBoZWlnaHQ9IjEzLjkiIHJ4PSI3LjAiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjc3MyIvPgo8cmVjdCB4PSIxMDMuNCIgeT0iMy41IiB3aWR0aD0iMTcxMy4zIiBoZWlnaHQ9Ijk5My4wIiByeD0iMTY4LjgiIGZpbGw9IiM5YWExYWIiLz4KPHJlY3QgeD0iMTAzLjQiIHk9IjMuNSIgd2lkdGg9IjE3MTMuMyIgaGVpZ2h0PSIxNDkuMCIgcng9IjEzNS4wIiBmaWxsPSIjOGM5NDlmIi8+CjxyZWN0IHg9IjEwMy40IiB5PSI2MTkuMiIgd2lkdGg9IjE3MTMuMyIgaGVpZ2h0PSIzNzcuMyIgcng9IjExOC4yIiBmaWxsPSIjNmI3NDgwIi8+CjxyZWN0IHg9Ijk1MS40IiB5PSI2MTkuMiIgd2lkdGg9IjE3LjEiIGhlaWdodD0iMzc3LjMiIGZpbGw9IiMyZjM3NDIiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iMTAzLjQiIHk9IjMuNSIgd2lkdGg9IjE3MTMuMyIgaGVpZ2h0PSI5OTMuMCIgcng9IjE2OC44IiBmaWxsPSJub25lIiBzdHJva2U9IiMyZjM3NDIiIHN0cm9rZS1vcGFjaXR5PSIwLjcwNSIgc3Ryb2tlLXdpZHRoPSIzLjAiLz4KPHJlY3QgeD0iMTAzLjQiIHk9IjI5MS41IiB3aWR0aD0iMTcxMy4zIiBoZWlnaHQ9IjQuNSIgZmlsbD0iIzJmMzc0MiIgb3BhY2l0eT0iMC4zNjUiLz4KPHJlY3QgeD0iMTAzLjQiIHk9IjU2OS41IiB3aWR0aD0iMTcxMy4zIiBoZWlnaHQ9IjQuNSIgZmlsbD0iIzJmMzc0MiIgb3BhY2l0eT0iMC4zNjUiLz4KPHJlY3QgeD0iNzYzLjAiIHk9IjMzLjMiIHdpZHRoPSIzOTQuMSIgaGVpZ2h0PSIxMC45IiByeD0iNS41IiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC43NDAiLz4KPHJlY3QgeD0iMjU2LjAiIHk9IjkyLjAiIHdpZHRoPSIxNDA4LjAiIGhlaWdodD0iODE2LjEiIHJ4PSIxMzguNyIgZmlsbD0iI2EzYThhZSIvPgo8cmVjdCB4PSIyNTYuMCIgeT0iOTIuMCIgd2lkdGg9IjE0MDguMCIgaGVpZ2h0PSIxMjIuNCIgcng9IjExMS4wIiBmaWxsPSIjODU4ZDk4Ii8+CjxyZWN0IHg9IjI1Ni4wIiB5PSI1OTcuOSIgd2lkdGg9IjE0MDguMCIgaGVpZ2h0PSIzMTAuMSIgcng9Ijk3LjEiIGZpbGw9IiM3MTc5ODUiLz4KPHJlY3QgeD0iOTUzLjAiIHk9IjU5Ny45IiB3aWR0aD0iMTQuMSIgaGVpZ2h0PSIzMTAuMSIgZmlsbD0iIzJkMzY0MSIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSIyNTYuMCIgeT0iOTIuMCIgd2lkdGg9IjE0MDguMCIgaGVpZ2h0PSI4MTYuMSIgcng9IjEzOC43IiBmaWxsPSJub25lIiBzdHJva2U9IiMyZDM2NDEiIHN0cm9rZS1vcGFjaXR5PSIwLjY4NiIgc3Ryb2tlLXdpZHRoPSIyLjQiLz4KPHJlY3QgeD0iMjU2LjAiIHk9IjMyOC42IiB3aWR0aD0iMTQwOC4wIiBoZWlnaHQ9IjMuNyIgZmlsbD0iIzJkMzY0MSIgb3BhY2l0eT0iMC4zNTUiLz4KPHJlY3QgeD0iMjU2LjAiIHk9IjU1Ny4xIiB3aWR0aD0iMTQwOC4wIiBoZWlnaHQ9IjMuNyIgZmlsbD0iIzJkMzY0MSIgb3BhY2l0eT0iMC4zNTUiLz4KPHJlY3QgeD0iNzk4LjEiIHk9IjExNi40IiB3aWR0aD0iMzIzLjkiIGhlaWdodD0iOS4wIiByeD0iNC41IiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC43MTciLz4KPHJlY3QgeD0iMzYyLjQiIHk9IjE1My43IiB3aWR0aD0iMTE5NS4xIiBoZWlnaHQ9IjY5Mi43IiByeD0iMTE3LjgiIGZpbGw9IiM4YzkzOWMiLz4KPHJlY3QgeD0iMzYyLjQiIHk9IjE1My43IiB3aWR0aD0iMTE5NS4xIiBoZWlnaHQ9IjEwMy45IiByeD0iOTQuMiIgZmlsbD0iIzgwODc5MiIvPgo8cmVjdCB4PSIzNjIuNCIgeT0iNTgzLjEiIHdpZHRoPSIxMTk1LjEiIGhlaWdodD0iMjYzLjIiIHJ4PSI4Mi40IiBmaWxsPSIjNjE2YTc2Ii8+CjxyZWN0IHg9Ijk1NC4wIiB5PSI1ODMuMSIgd2lkdGg9IjEyLjAiIGhlaWdodD0iMjYzLjIiIGZpbGw9IiMyYzM1M2YiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iMzYyLjQiIHk9IjE1My43IiB3aWR0aD0iMTE5NS4xIiBoZWlnaHQ9IjY5Mi43IiByeD0iMTE3LjgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJjMzUzZiIgc3Ryb2tlLW9wYWNpdHk9IjAuNjcyIiBzdHJva2Utd2lkdGg9IjIuMSIvPgo8cmVjdCB4PSIzNjIuNCIgeT0iMzU0LjUiIHdpZHRoPSIxMTk1LjEiIGhlaWdodD0iMy4xIiBmaWxsPSIjMmMzNTNmIiBvcGFjaXR5PSIwLjM0NyIvPgo8cmVjdCB4PSIzNjIuNCIgeT0iNTQ4LjUiIHdpZHRoPSIxMTk1LjEiIGhlaWdodD0iMy4xIiBmaWxsPSIjMmMzNTNmIiBvcGFjaXR5PSIwLjM0NyIvPgo8cmVjdCB4PSI4MjIuNiIgeT0iMTc0LjQiIHdpZHRoPSIyNzQuOSIgaGVpZ2h0PSI3LjYiIHJ4PSIzLjgiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjY5OSIvPgo8Zz4KICAgIDxlbGxpcHNlIGN4PSI4NzYuMyIgY3k9IjU1MC42IiByeD0iMjkuNCIgcnk9IjMuNSIgZmlsbD0iIzA1MDgwYyIgb3BhY2l0eT0iMC40NSIvPgogICAgPHBhdGggZD0iTSA4NTIuMCA1NDguNSBMIDg1Ny42IDQ1MS41IEwgODYyLjMgNDI3LjMgTCA4NjcuMCA0MDguMiBMIDg4NS43IDQwOC4yIEwgODkwLjQgNDI3LjMgTCA4OTUuMCA0NTEuNSBMIDkwMC43IDU0OC41IEwgODg0LjggNTQ4LjUgTCA4NzkuNiA0NzUuOCBMIDg3MC4zIDQ3NS44IEwgODY3LjAgNTQ4LjUgWiIgZmlsbD0iIzA0MDcwYiIvPgogICAgPGNpcmNsZSBjeD0iODc0LjUiIGN5PSIzOTMuNSIgcj0iMTIuNSIgZmlsbD0iIzA0MDcwYiIvPgogICAgPHBhdGggZD0iTSA4NTIuMCA1NDguNSBMIDg1Ny42IDQ1MS41IEwgODYyLjMgNDI3LjMgTCA4NjcuMCA0MDguMiBMIDg4NS43IDQwOC4yIEwgODkwLjQgNDI3LjMgTCA4OTUuMCA0NTEuNSBMIDkwMC43IDU0OC41IEwgODg0LjggNTQ4LjUgTCA4NzkuNiA0NzUuOCBMIDg3MC4zIDQ3NS44IEwgODY3LjAgNTQ4LjUgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGZjMGZmIiBzdHJva2Utb3BhY2l0eT0iMC40MCIgc3Ryb2tlLXdpZHRoPSIyLjYwIi8+CiAgICA8Y2lyY2xlIGN4PSI4NjkuMiIgY3k9IjM5Mi4wIiByPSIxMC43IiBmaWxsPSIjOGZjMGZmIiBvcGFjaXR5PSIwLjIyIi8+CiAgPC9nPgo8cmVjdCB4PSI0NDAuOSIgeT0iMTk5LjIiIHdpZHRoPSIxMDM4LjEiIGhlaWdodD0iNjAxLjciIHJ4PSIxMDIuMyIgZmlsbD0iIzk3OWNhMiIvPgo8cmVjdCB4PSI0NDAuOSIgeT0iMTk5LjIiIHdpZHRoPSIxMDM4LjEiIGhlaWdodD0iOTAuMyIgcng9IjgxLjgiIGZpbGw9IiM3YzgzOGUiLz4KPHJlY3QgeD0iNDQwLjkiIHk9IjU3Mi4yIiB3aWR0aD0iMTAzOC4xIiBoZWlnaHQ9IjIyOC42IiByeD0iNzEuNiIgZmlsbD0iIzY5NzE3YyIvPgo8cmVjdCB4PSI5NTQuOCIgeT0iNTcyLjIiIHdpZHRoPSIxMC40IiBoZWlnaHQ9IjIyOC42IiBmaWxsPSIjMmIzNDNlIiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9IjQ0MC45IiB5PSIxOTkuMiIgd2lkdGg9IjEwMzguMSIgaGVpZ2h0PSI2MDEuNyIgcng9IjEwMi4zIiBmaWxsPSJub25lIiBzdHJva2U9IiMyYjM0M2UiIHN0cm9rZS1vcGFjaXR5PSIwLjY2MSIgc3Ryb2tlLXdpZHRoPSIxLjgiLz4KPHJlY3QgeD0iNDQwLjkiIHk9IjM3My42IiB3aWR0aD0iMTAzOC4xIiBoZWlnaHQ9IjIuNyIgZmlsbD0iIzJiMzQzZSIgb3BhY2l0eT0iMC4zNDEiLz4KPHJlY3QgeD0iNDQwLjkiIHk9IjU0Mi4xIiB3aWR0aD0iMTAzOC4xIiBoZWlnaHQ9IjIuNyIgZmlsbD0iIzJiMzQzZSIgb3BhY2l0eT0iMC4zNDEiLz4KPHJlY3QgeD0iODQwLjYiIHk9IjIxNy4yIiB3aWR0aD0iMjM4LjgiIGhlaWdodD0iNi42IiByeD0iMy4zIiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42ODUiLz4KPHJlY3QgeD0iNTAxLjIiIHk9IjIzNC4xIiB3aWR0aD0iOTE3LjYiIGhlaWdodD0iNTMxLjgiIHJ4PSI5MC40IiBmaWxsPSIjODQ4YTk0Ii8+CjxyZWN0IHg9IjUwMS4yIiB5PSIyMzQuMSIgd2lkdGg9IjkxNy42IiBoZWlnaHQ9Ijc5LjgiIHJ4PSI3Mi4zIiBmaWxsPSIjNzg4MDhhIi8+CjxyZWN0IHg9IjUwMS4yIiB5PSI1NjMuOCIgd2lkdGg9IjkxNy42IiBoZWlnaHQ9IjIwMi4xIiByeD0iNjMuMyIgZmlsbD0iIzVjNjQ3MCIvPgo8cmVjdCB4PSI5NTUuNCIgeT0iNTYzLjgiIHdpZHRoPSI5LjIiIGhlaWdodD0iMjAyLjEiIGZpbGw9IiMyYjMzM2QiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iNTAxLjIiIHk9IjIzNC4xIiB3aWR0aD0iOTE3LjYiIGhlaWdodD0iNTMxLjgiIHJ4PSI5MC40IiBmaWxsPSJub25lIiBzdHJva2U9IiMyYjMzM2QiIHN0cm9rZS1vcGFjaXR5PSIwLjY1MSIgc3Ryb2tlLXdpZHRoPSIxLjYiLz4KPHJlY3QgeD0iNTAxLjIiIHk9IjM4OC4zIiB3aWR0aD0iOTE3LjYiIGhlaWdodD0iMi40IiBmaWxsPSIjMmIzMzNkIiBvcGFjaXR5PSIwLjMzNyIvPgo8cmVjdCB4PSI1MDEuMiIgeT0iNTM3LjIiIHdpZHRoPSI5MTcuNiIgaGVpZ2h0PSIyLjQiIGZpbGw9IiMyYjMzM2QiIG9wYWNpdHk9IjAuMzM3Ii8+CjxyZWN0IHg9Ijg1NC41IiB5PSIyNTAuMCIgd2lkdGg9IjIxMS4wIiBoZWlnaHQ9IjUuOSIgcng9IjIuOSIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuNjc0Ii8+CjxyZWN0IHg9IjU0OC45IiB5PSIyNjEuNyIgd2lkdGg9IjgyMi4xIiBoZWlnaHQ9IjQ3Ni41IiByeD0iODEuMCIgZmlsbD0iIzhmOTQ5YSIvPgo8cmVjdCB4PSI1NDguOSIgeT0iMjYxLjciIHdpZHRoPSI4MjIuMSIgaGVpZ2h0PSI3MS41IiByeD0iNjQuOCIgZmlsbD0iIzc2N2Q4NyIvPgo8cmVjdCB4PSI1NDguOSIgeT0iNTU3LjIiIHdpZHRoPSI4MjIuMSIgaGVpZ2h0PSIxODEuMSIgcng9IjU2LjciIGZpbGw9IiM2NDZjNzciLz4KPHJlY3QgeD0iOTU1LjkiIHk9IjU1Ny4yIiB3aWR0aD0iOC4yIiBoZWlnaHQ9IjE4MS4xIiBmaWxsPSIjMmEzMjNkIiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9IjU0OC45IiB5PSIyNjEuNyIgd2lkdGg9IjgyMi4xIiBoZWlnaHQ9IjQ3Ni41IiByeD0iODEuMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMmEzMjNkIiBzdHJva2Utb3BhY2l0eT0iMC42NDQiIHN0cm9rZS13aWR0aD0iMS40Ii8+CjxyZWN0IHg9IjU0OC45IiB5PSIzOTkuOSIgd2lkdGg9IjgyMi4xIiBoZWlnaHQ9IjIuMSIgZmlsbD0iIzJhMzIzZCIgb3BhY2l0eT0iMC4zMzMiLz4KPHJlY3QgeD0iNTQ4LjkiIHk9IjUzMy40IiB3aWR0aD0iODIyLjEiIGhlaWdodD0iMi4xIiBmaWxsPSIjMmEzMjNkIiBvcGFjaXR5PSIwLjMzMyIvPgo8cmVjdCB4PSI4NjUuNSIgeT0iMjc2LjAiIHdpZHRoPSIxODkuMSIgaGVpZ2h0PSI1LjIiIHJ4PSIyLjYiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjY2NCIvPgo8cmVjdCB4PSI1ODcuNyIgeT0iMjg0LjIiIHdpZHRoPSI3NDQuNyIgaGVpZ2h0PSI0MzEuNiIgcng9IjczLjQiIGZpbGw9IiM3ZTg0OGUiLz4KPHJlY3QgeD0iNTg3LjciIHk9IjI4NC4yIiB3aWR0aD0iNzQ0LjciIGhlaWdodD0iNjQuNyIgcng9IjU4LjciIGZpbGw9IiM3MzdhODUiLz4KPHJlY3QgeD0iNTg3LjciIHk9IjU1MS44IiB3aWR0aD0iNzQ0LjciIGhlaWdodD0iMTY0LjAiIHJ4PSI1MS40IiBmaWxsPSIjNTg2MDZjIi8+CjxyZWN0IHg9Ijk1Ni4zIiB5PSI1NTEuOCIgd2lkdGg9IjcuNCIgaGVpZ2h0PSIxNjQuMCIgZmlsbD0iIzJhMzIzYyIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSI1ODcuNyIgeT0iMjg0LjIiIHdpZHRoPSI3NDQuNyIgaGVpZ2h0PSI0MzEuNiIgcng9IjczLjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJhMzIzYyIgc3Ryb2tlLW9wYWNpdHk9IjAuNjM3IiBzdHJva2Utd2lkdGg9IjEuMyIvPgo8cmVjdCB4PSI1ODcuNyIgeT0iNDA5LjQiIHdpZHRoPSI3NDQuNyIgaGVpZ2h0PSIxLjkiIGZpbGw9IiMyYTMyM2MiIG9wYWNpdHk9IjAuMzI5Ii8+CjxyZWN0IHg9IjU4Ny43IiB5PSI1MzAuMiIgd2lkdGg9Ijc0NC43IiBoZWlnaHQ9IjEuOSIgZmlsbD0iIzJhMzIzYyIgb3BhY2l0eT0iMC4zMjkiLz4KPHJlY3QgeD0iODc0LjQiIHk9IjI5Ny4xIiB3aWR0aD0iMTcxLjMiIGhlaWdodD0iNC43IiByeD0iMi40IiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42NTYiLz4KPHJlY3QgeD0iNjE5LjciIHk9IjMwMi44IiB3aWR0aD0iNjgwLjYiIGhlaWdodD0iMzk0LjQiIHJ4PSI2Ny4xIiBmaWxsPSIjOGE4ZTk1Ii8+CjxyZWN0IHg9IjYxOS43IiB5PSIzMDIuOCIgd2lkdGg9IjY4MC42IiBoZWlnaHQ9IjU5LjIiIHJ4PSI1My42IiBmaWxsPSIjNzE3ODgyIi8+CjxyZWN0IHg9IjYxOS43IiB5PSI1NDcuMyIgd2lkdGg9IjY4MC42IiBoZWlnaHQ9IjE0OS45IiByeD0iNDYuOSIgZmlsbD0iIzYwNjg3MyIvPgo8cmVjdCB4PSI5NTYuNiIgeT0iNTQ3LjMiIHdpZHRoPSI2LjgiIGhlaWdodD0iMTQ5LjkiIGZpbGw9IiMyOTMxM2MiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iNjE5LjciIHk9IjMwMi44IiB3aWR0aD0iNjgwLjYiIGhlaWdodD0iMzk0LjQiIHJ4PSI2Ny4xIiBmaWxsPSJub25lIiBzdHJva2U9IiMyOTMxM2MiIHN0cm9rZS1vcGFjaXR5PSIwLjYzMSIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4KPHJlY3QgeD0iNjE5LjciIHk9IjQxNy4yIiB3aWR0aD0iNjgwLjYiIGhlaWdodD0iMS44IiBmaWxsPSIjMjkzMTNjIiBvcGFjaXR5PSIwLjMyNiIvPgo8cmVjdCB4PSI2MTkuNyIgeT0iNTI3LjYiIHdpZHRoPSI2ODAuNiIgaGVpZ2h0PSIxLjgiIGZpbGw9IiMyOTMxM2MiIG9wYWNpdHk9IjAuMzI2Ii8+CjxyZWN0IHg9Ijg4MS43IiB5PSIzMTQuNiIgd2lkdGg9IjE1Ni41IiBoZWlnaHQ9IjQuMyIgcng9IjIuMiIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuNjQ5Ii8+CjxyZWN0IHg9IjY0Ni43IiB5PSIzMTguNCIgd2lkdGg9IjYyNi42IiBoZWlnaHQ9IjM2My4yIiByeD0iNjEuNyIgZmlsbD0iIzdhODA4OSIvPgo8cmVjdCB4PSI2NDYuNyIgeT0iMzE4LjQiIHdpZHRoPSI2MjYuNiIgaGVpZ2h0PSI1NC41IiByeD0iNDkuNCIgZmlsbD0iIzZmNzY4MCIvPgo8cmVjdCB4PSI2NDYuNyIgeT0iNTQzLjYiIHdpZHRoPSI2MjYuNiIgaGVpZ2h0PSIxMzguMCIgcng9IjQzLjIiIGZpbGw9IiM1NTVkNjgiLz4KPHJlY3QgeD0iOTU2LjkiIHk9IjU0My42IiB3aWR0aD0iNi4zIiBoZWlnaHQ9IjEzOC4wIiBmaWxsPSIjMjkzMTNiIiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9IjY0Ni43IiB5PSIzMTguNCIgd2lkdGg9IjYyNi42IiBoZWlnaHQ9IjM2My4yIiByeD0iNjEuNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjkzMTNiIiBzdHJva2Utb3BhY2l0eT0iMC42MjYiIHN0cm9rZS13aWR0aD0iMS4xIi8+CjxyZWN0IHg9IjY0Ni43IiB5PSI0MjMuNyIgd2lkdGg9IjYyNi42IiBoZWlnaHQ9IjEuNiIgZmlsbD0iIzI5MzEzYiIgb3BhY2l0eT0iMC4zMjQiLz4KPHJlY3QgeD0iNjQ2LjciIHk9IjUyNS40IiB3aWR0aD0iNjI2LjYiIGhlaWdodD0iMS42IiBmaWxsPSIjMjkzMTNiIiBvcGFjaXR5PSIwLjMyNCIvPgo8cmVjdCB4PSI4ODcuOSIgeT0iMzI5LjMiIHdpZHRoPSIxNDQuMSIgaGVpZ2h0PSI0LjAiIHJ4PSIyLjAiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjY0MyIvPgo8cmVjdCB4PSI2NjkuNyIgeT0iMzMxLjgiIHdpZHRoPSI1ODAuNiIgaGVpZ2h0PSIzMzYuNSIgcng9IjU3LjIiIGZpbGw9IiM4NjhhOTEiLz4KPHJlY3QgeD0iNjY5LjciIHk9IjMzMS44IiB3aWR0aD0iNTgwLjYiIGhlaWdodD0iNTAuNSIgcng9IjQ1LjgiIGZpbGw9IiM2ZTc0N2YiLz4KPHJlY3QgeD0iNjY5LjciIHk9IjU0MC40IiB3aWR0aD0iNTgwLjYiIGhlaWdodD0iMTI3LjkiIHJ4PSI0MC4wIiBmaWxsPSIjNWQ2NTZmIi8+CjxyZWN0IHg9Ijk1Ny4xIiB5PSI1NDAuNCIgd2lkdGg9IjUuOCIgaGVpZ2h0PSIxMjcuOSIgZmlsbD0iIzI5MzEzYiIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSI2NjkuNyIgeT0iMzMxLjgiIHdpZHRoPSI1ODAuNiIgaGVpZ2h0PSIzMzYuNSIgcng9IjU3LjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI5MzEzYiIgc3Ryb2tlLW9wYWNpdHk9IjAuNjIyIiBzdHJva2Utd2lkdGg9IjEuMCIvPgo8cmVjdCB4PSI2NjkuNyIgeT0iNDI5LjMiIHdpZHRoPSI1ODAuNiIgaGVpZ2h0PSIxLjUiIGZpbGw9IiMyOTMxM2IiIG9wYWNpdHk9IjAuMzIxIi8+CjxyZWN0IHg9IjY2OS43IiB5PSI1MjMuNiIgd2lkdGg9IjU4MC42IiBoZWlnaHQ9IjEuNSIgZmlsbD0iIzI5MzEzYiIgb3BhY2l0eT0iMC4zMjEiLz4KPHJlY3QgeD0iODkzLjIiIHk9IjM0MS44IiB3aWR0aD0iMTMzLjUiIGhlaWdodD0iMy43IiByeD0iMS45IiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42MzciLz4KPHJlY3QgeD0iNjg5LjYiIHk9IjM0My4zIiB3aWR0aD0iNTQwLjgiIGhlaWdodD0iMzEzLjUiIHJ4PSI1My4zIiBmaWxsPSIjNzY3ZDg2Ii8+CjxyZWN0IHg9IjY4OS42IiB5PSIzNDMuMyIgd2lkdGg9IjU0MC44IiBoZWlnaHQ9IjQ3LjAiIHJ4PSI0Mi42IiBmaWxsPSIjNmM3MzdkIi8+CjxyZWN0IHg9IjY4OS42IiB5PSI1MzcuNiIgd2lkdGg9IjU0MC44IiBoZWlnaHQ9IjExOS4xIiByeD0iMzcuMyIgZmlsbD0iIzUzNWI2NiIvPgo8cmVjdCB4PSI5NTcuMyIgeT0iNTM3LjYiIHdpZHRoPSI1LjQiIGhlaWdodD0iMTE5LjEiIGZpbGw9IiMyODMwM2EiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iNjg5LjYiIHk9IjM0My4zIiB3aWR0aD0iNTQwLjgiIGhlaWdodD0iMzEzLjUiIHJ4PSI1My4zIiBmaWxsPSJub25lIiBzdHJva2U9IiMyODMwM2EiIHN0cm9rZS1vcGFjaXR5PSIwLjYxOCIgc3Ryb2tlLXdpZHRoPSIwLjkiLz4KPHJlY3QgeD0iNjg5LjYiIHk9IjQzNC4yIiB3aWR0aD0iNTQwLjgiIGhlaWdodD0iMS40IiBmaWxsPSIjMjgzMDNhIiBvcGFjaXR5PSIwLjMxOSIvPgo8cmVjdCB4PSI2ODkuNiIgeT0iNTIxLjkiIHdpZHRoPSI1NDAuOCIgaGVpZ2h0PSIxLjQiIGZpbGw9IiMyODMwM2EiIG9wYWNpdHk9IjAuMzE5Ii8+CjxyZWN0IHg9Ijg5Ny44IiB5PSIzNTIuNyIgd2lkdGg9IjEyNC40IiBoZWlnaHQ9IjMuNCIgcng9IjEuNyIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuNjMzIi8+CjxyZWN0IHg9IjcwNi45IiB5PSIzNTMuMyIgd2lkdGg9IjUwNi4yIiBoZWlnaHQ9IjI5My40IiByeD0iNDkuOSIgZmlsbD0iIzgyODc4ZCIvPgo8cmVjdCB4PSI3MDYuOSIgeT0iMzUzLjMiIHdpZHRoPSI1MDYuMiIgaGVpZ2h0PSI0NC4wIiByeD0iMzkuOSIgZmlsbD0iIzZiNzI3YyIvPgo8cmVjdCB4PSI3MDYuOSIgeT0iNTM1LjIiIHdpZHRoPSI1MDYuMiIgaGVpZ2h0PSIxMTEuNSIgcng9IjM0LjkiIGZpbGw9IiM1YjYyNmQiLz4KPHJlY3QgeD0iOTU3LjUiIHk9IjUzNS4yIiB3aWR0aD0iNS4xIiBoZWlnaHQ9IjExMS41IiBmaWxsPSIjMjgzMDNhIiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9IjcwNi45IiB5PSIzNTMuMyIgd2lkdGg9IjUwNi4yIiBoZWlnaHQ9IjI5My40IiByeD0iNDkuOSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjgzMDNhIiBzdHJva2Utb3BhY2l0eT0iMC42MTUiIHN0cm9rZS13aWR0aD0iMC45Ii8+CjxyZWN0IHg9IjcwNi45IiB5PSI0MzguNCIgd2lkdGg9IjUwNi4yIiBoZWlnaHQ9IjEuMyIgZmlsbD0iIzI4MzAzYSIgb3BhY2l0eT0iMC4zMTgiLz4KPHJlY3QgeD0iNzA2LjkiIHk9IjUyMC41IiB3aWR0aD0iNTA2LjIiIGhlaWdodD0iMS4zIiBmaWxsPSIjMjgzMDNhIiBvcGFjaXR5PSIwLjMxOCIvPgo8cmVjdCB4PSI5MDEuOCIgeT0iMzYyLjEiIHdpZHRoPSIxMTYuNCIgaGVpZ2h0PSIzLjIiIHJ4PSIxLjYiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjYyOCIvPgo8cmVjdCB4PSI3MjIuMSIgeT0iMzYyLjEiIHdpZHRoPSI0NzUuNyIgaGVpZ2h0PSIyNzUuNyIgcng9IjQ2LjkiIGZpbGw9IiM3NDdhODMiLz4KPHJlY3QgeD0iNzIyLjEiIHk9IjM2Mi4xIiB3aWR0aD0iNDc1LjciIGhlaWdodD0iNDEuNCIgcng9IjM3LjUiIGZpbGw9IiM2YTcwN2IiLz4KPHJlY3QgeD0iNzIyLjEiIHk9IjUzMy4xIiB3aWR0aD0iNDc1LjciIGhlaWdodD0iMTA0LjgiIHJ4PSIzMi44IiBmaWxsPSIjNTE1OTY0Ii8+CjxyZWN0IHg9Ijk1Ny42IiB5PSI1MzMuMSIgd2lkdGg9IjQuOCIgaGVpZ2h0PSIxMDQuOCIgZmlsbD0iIzI4MzAzYSIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSI3MjIuMSIgeT0iMzYyLjEiIHdpZHRoPSI0NzUuNyIgaGVpZ2h0PSIyNzUuNyIgcng9IjQ2LjkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI4MzAzYSIgc3Ryb2tlLW9wYWNpdHk9IjAuNjEyIiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8cmVjdCB4PSI3MjIuMSIgeT0iNDQyLjEiIHdpZHRoPSI0NzUuNyIgaGVpZ2h0PSIxLjIiIGZpbGw9IiMyODMwM2EiIG9wYWNpdHk9IjAuMzE2Ii8+CjxyZWN0IHg9IjcyMi4xIiB5PSI1MTkuMyIgd2lkdGg9IjQ3NS43IiBoZWlnaHQ9IjEuMiIgZmlsbD0iIzI4MzAzYSIgb3BhY2l0eT0iMC4zMTYiLz4KPHJlY3QgeD0iOTA1LjMiIHk9IjM3MC40IiB3aWR0aD0iMTA5LjQiIGhlaWdodD0iMy4wIiByeD0iMS41IiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42MjQiLz4KPHJlY3QgeD0iNzM1LjYiIHk9IjM3MC4wIiB3aWR0aD0iNDQ4LjciIGhlaWdodD0iMjYwLjEiIHJ4PSI0NC4yIiBmaWxsPSIjN2Y4NDhhIi8+CjxyZWN0IHg9IjczNS42IiB5PSIzNzAuMCIgd2lkdGg9IjQ0OC43IiBoZWlnaHQ9IjM5LjAiIHJ4PSIzNS40IiBmaWxsPSIjNjk2Zjc5Ii8+CjxyZWN0IHg9IjczNS42IiB5PSI1MzEuMiIgd2lkdGg9IjQ0OC43IiBoZWlnaHQ9Ijk4LjgiIHJ4PSIzMC45IiBmaWxsPSIjNTk2MDZiIi8+CjxyZWN0IHg9Ijk1Ny44IiB5PSI1MzEuMiIgd2lkdGg9IjQuNSIgaGVpZ2h0PSI5OC44IiBmaWxsPSIjMjgyZjNhIiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9IjczNS42IiB5PSIzNzAuMCIgd2lkdGg9IjQ0OC43IiBoZWlnaHQ9IjI2MC4xIiByeD0iNDQuMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjgyZjNhIiBzdHJva2Utb3BhY2l0eT0iMC42MDkiIHN0cm9rZS13aWR0aD0iMC44Ii8+CjxyZWN0IHg9IjczNS42IiB5PSI0NDUuNCIgd2lkdGg9IjQ0OC43IiBoZWlnaHQ9IjEuMiIgZmlsbD0iIzI4MmYzYSIgb3BhY2l0eT0iMC4zMTQiLz4KPHJlY3QgeD0iNzM1LjYiIHk9IjUxOC4yIiB3aWR0aD0iNDQ4LjciIGhlaWdodD0iMS4yIiBmaWxsPSIjMjgyZjNhIiBvcGFjaXR5PSIwLjMxNCIvPgo8cmVjdCB4PSI5MDguNCIgeT0iMzc3LjgiIHdpZHRoPSIxMDMuMiIgaGVpZ2h0PSIyLjkiIHJ4PSIxLjQiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjYyMSIvPgo8cmVjdCB4PSI3NDcuNyIgeT0iMzc2LjkiIHdpZHRoPSI0MjQuNiIgaGVpZ2h0PSIyNDYuMSIgcng9IjQxLjgiIGZpbGw9IiM3MTc3ODEiLz4KPHJlY3QgeD0iNzQ3LjciIHk9IjM3Ni45IiB3aWR0aD0iNDI0LjYiIGhlaWdodD0iMzYuOSIgcng9IjMzLjUiIGZpbGw9IiM2ODZlNzgiLz4KPHJlY3QgeD0iNzQ3LjciIHk9IjUyOS41IiB3aWR0aD0iNDI0LjYiIGhlaWdodD0iOTMuNSIgcng9IjI5LjMiIGZpbGw9IiM0ZjU3NjIiLz4KPHJlY3QgeD0iOTU3LjkiIHk9IjUyOS41IiB3aWR0aD0iNC4yIiBoZWlnaHQ9IjkzLjUiIGZpbGw9IiMyNzJmMzkiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iNzQ3LjciIHk9IjM3Ni45IiB3aWR0aD0iNDI0LjYiIGhlaWdodD0iMjQ2LjEiIHJ4PSI0MS44IiBmaWxsPSJub25lIiBzdHJva2U9IiMyNzJmMzkiIHN0cm9rZS1vcGFjaXR5PSIwLjYwNiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KPHJlY3QgeD0iNzQ3LjciIHk9IjQ0OC4zIiB3aWR0aD0iNDI0LjYiIGhlaWdodD0iMS4xIiBmaWxsPSIjMjcyZjM5IiBvcGFjaXR5PSIwLjMxMyIvPgo8cmVjdCB4PSI3NDcuNyIgeT0iNTE3LjIiIHdpZHRoPSI0MjQuNiIgaGVpZ2h0PSIxLjEiIGZpbGw9IiMyNzJmMzkiIG9wYWNpdHk9IjAuMzEzIi8+CjxyZWN0IHg9IjkxMS4yIiB5PSIzODQuMyIgd2lkdGg9Ijk3LjciIGhlaWdodD0iMi43IiByeD0iMS40IiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42MTciLz4KPHJlY3QgeD0iNzU4LjUiIHk9IjM4My4yIiB3aWR0aD0iNDAzLjAiIGhlaWdodD0iMjMzLjYiIHJ4PSIzOS43IiBmaWxsPSIjN2Q4Mjg4Ii8+CjxyZWN0IHg9Ijc1OC41IiB5PSIzODMuMiIgd2lkdGg9IjQwMy4wIiBoZWlnaHQ9IjM1LjAiIHJ4PSIzMS44IiBmaWxsPSIjNjc2ZDc3Ii8+CjxyZWN0IHg9Ijc1OC41IiB5PSI1MjguMCIgd2lkdGg9IjQwMy4wIiBoZWlnaHQ9Ijg4LjgiIHJ4PSIyNy44IiBmaWxsPSIjNTc1ZjY5Ii8+CjxyZWN0IHg9Ijk1OC4wIiB5PSI1MjguMCIgd2lkdGg9IjQuMCIgaGVpZ2h0PSI4OC44IiBmaWxsPSIjMjcyZjM5IiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9Ijc1OC41IiB5PSIzODMuMiIgd2lkdGg9IjQwMy4wIiBoZWlnaHQ9IjIzMy42IiByeD0iMzkuNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjcyZjM5IiBzdHJva2Utb3BhY2l0eT0iMC42MDQiIHN0cm9rZS13aWR0aD0iMC44Ii8+CjxyZWN0IHg9Ijc1OC41IiB5PSI0NTEuMCIgd2lkdGg9IjQwMy4wIiBoZWlnaHQ9IjEuMSIgZmlsbD0iIzI3MmYzOSIgb3BhY2l0eT0iMC4zMTIiLz4KPHJlY3QgeD0iNzU4LjUiIHk9IjUxNi4zIiB3aWR0aD0iNDAzLjAiIGhlaWdodD0iMS4xIiBmaWxsPSIjMjcyZjM5IiBvcGFjaXR5PSIwLjMxMiIvPgo8cmVjdCB4PSI5MTMuNyIgeT0iMzkwLjIiIHdpZHRoPSI5Mi43IiBoZWlnaHQ9IjIuNiIgcng9IjEuMyIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuNjE0Ii8+CjxyZWN0IHg9Ijc2OC4zIiB5PSIzODguOSIgd2lkdGg9IjM4My40IiBoZWlnaHQ9IjIyMi4yIiByeD0iMzcuOCIgZmlsbD0iIzcwNzY3ZiIvPgo8cmVjdCB4PSI3NjguMyIgeT0iMzg4LjkiIHdpZHRoPSIzODMuNCIgaGVpZ2h0PSIzMy4zIiByeD0iMzAuMiIgZmlsbD0iIzY2NmM3NiIvPgo8cmVjdCB4PSI3NjguMyIgeT0iNTI2LjciIHdpZHRoPSIzODMuNCIgaGVpZ2h0PSI4NC40IiByeD0iMjYuNCIgZmlsbD0iIzRlNTY2MSIvPgo8cmVjdCB4PSI5NTguMSIgeT0iNTI2LjciIHdpZHRoPSIzLjgiIGhlaWdodD0iODQuNCIgZmlsbD0iIzI3MmYzOSIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSI3NjguMyIgeT0iMzg4LjkiIHdpZHRoPSIzODMuNCIgaGVpZ2h0PSIyMjIuMiIgcng9IjM3LjgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI3MmYzOSIgc3Ryb2tlLW9wYWNpdHk9IjAuNjAxIiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8cmVjdCB4PSI3NjguMyIgeT0iNDUzLjMiIHdpZHRoPSIzODMuNCIgaGVpZ2h0PSIxLjAiIGZpbGw9IiMyNzJmMzkiIG9wYWNpdHk9IjAuMzExIi8+CjxyZWN0IHg9Ijc2OC4zIiB5PSI1MTUuNiIgd2lkdGg9IjM4My40IiBoZWlnaHQ9IjEuMCIgZmlsbD0iIzI3MmYzOSIgb3BhY2l0eT0iMC4zMTEiLz4KPHJlY3QgeD0iOTE1LjkiIHk9IjM5NS42IiB3aWR0aD0iODguMiIgaGVpZ2h0PSIyLjQiIHJ4PSIxLjIiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjYxMiIvPgo8cmVjdCB4PSI3NzcuMiIgeT0iMzk0LjAiIHdpZHRoPSIzNjUuNyIgaGVpZ2h0PSIyMTEuOSIgcng9IjM2LjAiIGZpbGw9IiM3YjgwODYiLz4KPHJlY3QgeD0iNzc3LjIiIHk9IjM5NC4wIiB3aWR0aD0iMzY1LjciIGhlaWdodD0iMzEuOCIgcng9IjI4LjgiIGZpbGw9IiM2NTZjNzYiLz4KPHJlY3QgeD0iNzc3LjIiIHk9IjUyNS40IiB3aWR0aD0iMzY1LjciIGhlaWdodD0iODAuNSIgcng9IjI1LjIiIGZpbGw9IiM1NjVkNjgiLz4KPHJlY3QgeD0iOTU4LjIiIHk9IjUyNS40IiB3aWR0aD0iMy43IiBoZWlnaHQ9IjgwLjUiIGZpbGw9IiMyNzJmMzkiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iNzc3LjIiIHk9IjM5NC4wIiB3aWR0aD0iMzY1LjciIGhlaWdodD0iMjExLjkiIHJ4PSIzNi4wIiBmaWxsPSJub25lIiBzdHJva2U9IiMyNzJmMzkiIHN0cm9rZS1vcGFjaXR5PSIwLjU5OSIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KPHJlY3QgeD0iNzc3LjIiIHk9IjQ1NS41IiB3aWR0aD0iMzY1LjciIGhlaWdodD0iMS4wIiBmaWxsPSIjMjcyZjM5IiBvcGFjaXR5PSIwLjMxMCIvPgo8cmVjdCB4PSI3NzcuMiIgeT0iNTE0LjgiIHdpZHRoPSIzNjUuNyIgaGVpZ2h0PSIxLjAiIGZpbGw9IiMyNzJmMzkiIG9wYWNpdHk9IjAuMzEwIi8+CjxyZWN0IHg9IjkxNy45IiB5PSI0MDAuNCIgd2lkdGg9Ijg0LjEiIGhlaWdodD0iMi4zIiByeD0iMS4yIiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42MDkiLz4KPHJlY3QgeD0iNzg1LjIiIHk9IjM5OC43IiB3aWR0aD0iMzQ5LjUiIGhlaWdodD0iMjAyLjYiIHJ4PSIzNC40IiBmaWxsPSIjNmU3NDdkIi8+CjxyZWN0IHg9Ijc4NS4yIiB5PSIzOTguNyIgd2lkdGg9IjM0OS41IiBoZWlnaHQ9IjMwLjQiIHJ4PSIyNy41IiBmaWxsPSIjNjQ2Yjc1Ii8+CjxyZWN0IHg9Ijc4NS4yIiB5PSI1MjQuMyIgd2lkdGg9IjM0OS41IiBoZWlnaHQ9Ijc3LjAiIHJ4PSIyNC4xIiBmaWxsPSIjNGQ1NTVmIi8+CjxyZWN0IHg9Ijk1OC4zIiB5PSI1MjQuMyIgd2lkdGg9IjMuNSIgaGVpZ2h0PSI3Ny4wIiBmaWxsPSIjMjcyZjM5IiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9Ijc4NS4yIiB5PSIzOTguNyIgd2lkdGg9IjM0OS41IiBoZWlnaHQ9IjIwMi42IiByeD0iMzQuNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjcyZjM5IiBzdHJva2Utb3BhY2l0eT0iMC41OTciIHN0cm9rZS13aWR0aD0iMC44Ii8+CjxyZWN0IHg9Ijc4NS4yIiB5PSI0NTcuNSIgd2lkdGg9IjM0OS41IiBoZWlnaHQ9IjAuOSIgZmlsbD0iIzI3MmYzOSIgb3BhY2l0eT0iMC4zMDkiLz4KPHJlY3QgeD0iNzg1LjIiIHk9IjUxNC4yIiB3aWR0aD0iMzQ5LjUiIGhlaWdodD0iMC45IiBmaWxsPSIjMjcyZjM5IiBvcGFjaXR5PSIwLjMwOSIvPgo8cmVjdCB4PSI5MTkuOCIgeT0iNDA0LjgiIHdpZHRoPSI4MC40IiBoZWlnaHQ9IjIuMiIgcng9IjEuMSIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuNjA3Ii8+CjxyZWN0IHg9Ijc5Mi43IiB5PSI0MDMuMCIgd2lkdGg9IjMzNC43IiBoZWlnaHQ9IjE5NC4wIiByeD0iMzMuMCIgZmlsbD0iIzc5N2U4NCIvPgo8cmVjdCB4PSI3OTIuNyIgeT0iNDAzLjAiIHdpZHRoPSIzMzQuNyIgaGVpZ2h0PSIyOS4xIiByeD0iMjYuNCIgZmlsbD0iIzY0NmE3NCIvPgo8cmVjdCB4PSI3OTIuNyIgeT0iNTIzLjMiIHdpZHRoPSIzMzQuNyIgaGVpZ2h0PSI3My43IiByeD0iMjMuMSIgZmlsbD0iIzU1NWM2NiIvPgo8cmVjdCB4PSI5NTguMyIgeT0iNTIzLjMiIHdpZHRoPSIzLjMiIGhlaWdodD0iNzMuNyIgZmlsbD0iIzI3MmUzOCIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSI3OTIuNyIgeT0iNDAzLjAiIHdpZHRoPSIzMzQuNyIgaGVpZ2h0PSIxOTQuMCIgcng9IjMzLjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI3MmUzOCIgc3Ryb2tlLW9wYWNpdHk9IjAuNTk1IiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8cmVjdCB4PSI3OTIuNyIgeT0iNDU5LjMiIHdpZHRoPSIzMzQuNyIgaGVpZ2h0PSIwLjkiIGZpbGw9IiMyNzJlMzgiIG9wYWNpdHk9IjAuMzA4Ii8+CjxyZWN0IHg9Ijc5Mi43IiB5PSI1MTMuNiIgd2lkdGg9IjMzNC43IiBoZWlnaHQ9IjAuOSIgZmlsbD0iIzI3MmUzOCIgb3BhY2l0eT0iMC4zMDgiLz4KPHJlY3QgeD0iOTIxLjUiIHk9IjQwOC44IiB3aWR0aD0iNzcuMCIgaGVpZ2h0PSIyLjEiIHJ4PSIxLjEiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjYwNCIvPgo8cmVjdCB4PSI3OTkuNCIgeT0iNDA2LjkiIHdpZHRoPSIzMjEuMSIgaGVpZ2h0PSIxODYuMSIgcng9IjMxLjYiIGZpbGw9IiM2YzcyN2IiLz4KPHJlY3QgeD0iNzk5LjQiIHk9IjQwNi45IiB3aWR0aD0iMzIxLjEiIGhlaWdodD0iMjcuOSIgcng9IjI1LjMiIGZpbGw9IiM2MzZhNzQiLz4KPHJlY3QgeD0iNzk5LjQiIHk9IjUyMi4zIiB3aWR0aD0iMzIxLjEiIGhlaWdodD0iNzAuNyIgcng9IjIyLjEiIGZpbGw9IiM0YzU0NWUiLz4KPHJlY3QgeD0iOTU4LjQiIHk9IjUyMi4zIiB3aWR0aD0iMy4yIiBoZWlnaHQ9IjcwLjciIGZpbGw9IiMyNzJlMzgiIG9wYWNpdHk9IjAuNTUiLz4KPHJlY3QgeD0iNzk5LjQiIHk9IjQwNi45IiB3aWR0aD0iMzIxLjEiIGhlaWdodD0iMTg2LjEiIHJ4PSIzMS42IiBmaWxsPSJub25lIiBzdHJva2U9IiMyNzJlMzgiIHN0cm9rZS1vcGFjaXR5PSIwLjU5NCIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KPHJlY3QgeD0iNzk5LjQiIHk9IjQ2MC45IiB3aWR0aD0iMzIxLjEiIGhlaWdodD0iMC44IiBmaWxsPSIjMjcyZTM4IiBvcGFjaXR5PSIwLjMwNyIvPgo8cmVjdCB4PSI3OTkuNCIgeT0iNTEzLjAiIHdpZHRoPSIzMjEuMSIgaGVpZ2h0PSIwLjgiIGZpbGw9IiMyNzJlMzgiIG9wYWNpdHk9IjAuMzA3Ii8+CjxyZWN0IHg9IjkyMy4xIiB5PSI0MTIuNSIgd2lkdGg9IjczLjkiIGhlaWdodD0iMi4wIiByeD0iMS4wIiBmaWxsPSJ1cmwoI2xpZ2h0QmFyKSIgb3BhY2l0eT0iMC42MDIiLz4KPHJlY3QgeD0iODA1LjciIHk9IjQxMC42IiB3aWR0aD0iMzA4LjYiIGhlaWdodD0iMTc4LjgiIHJ4PSIzMC40IiBmaWxsPSIjNzg3YzgzIi8+CjxyZWN0IHg9IjgwNS43IiB5PSI0MTAuNiIgd2lkdGg9IjMwOC42IiBoZWlnaHQ9IjI2LjgiIHJ4PSIyNC4zIiBmaWxsPSIjNjM2OTczIi8+CjxyZWN0IHg9IjgwNS43IiB5PSI1MjEuNSIgd2lkdGg9IjMwOC42IiBoZWlnaHQ9IjY4LjAiIHJ4PSIyMS4zIiBmaWxsPSIjNTQ1YjY1Ii8+CjxyZWN0IHg9Ijk1OC41IiB5PSI1MjEuNSIgd2lkdGg9IjMuMSIgaGVpZ2h0PSI2OC4wIiBmaWxsPSIjMjYyZTM4IiBvcGFjaXR5PSIwLjU1Ii8+CjxyZWN0IHg9IjgwNS43IiB5PSI0MTAuNiIgd2lkdGg9IjMwOC42IiBoZWlnaHQ9IjE3OC44IiByeD0iMzAuNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjYyZTM4IiBzdHJva2Utb3BhY2l0eT0iMC41OTIiIHN0cm9rZS13aWR0aD0iMC44Ii8+CjxyZWN0IHg9IjgwNS43IiB5PSI0NjIuNCIgd2lkdGg9IjMwOC42IiBoZWlnaHQ9IjAuOCIgZmlsbD0iIzI2MmUzOCIgb3BhY2l0eT0iMC4zMDYiLz4KPHJlY3QgeD0iODA1LjciIHk9IjUxMi41IiB3aWR0aD0iMzA4LjYiIGhlaWdodD0iMC44IiBmaWxsPSIjMjYyZTM4IiBvcGFjaXR5PSIwLjMwNiIvPgo8cmVjdCB4PSI5MjQuNSIgeT0iNDE1LjkiIHdpZHRoPSI3MS4wIiBoZWlnaHQ9IjIuMCIgcng9IjEuMCIgZmlsbD0idXJsKCNsaWdodEJhcikiIG9wYWNpdHk9IjAuNjAwIi8+CjxyZWN0IHg9IjgxMS41IiB5PSI0MTMuOSIgd2lkdGg9IjI5Ny4wIiBoZWlnaHQ9IjE3Mi4xIiByeD0iMjkuMyIgZmlsbD0iIzZiNzE3YSIvPgo8cmVjdCB4PSI4MTEuNSIgeT0iNDEzLjkiIHdpZHRoPSIyOTcuMCIgaGVpZ2h0PSIyNS44IiByeD0iMjMuNCIgZmlsbD0iIzYyNjg3MiIvPgo8cmVjdCB4PSI4MTEuNSIgeT0iNTIwLjciIHdpZHRoPSIyOTcuMCIgaGVpZ2h0PSI2NS40IiByeD0iMjAuNSIgZmlsbD0iIzRiNTM1ZCIvPgo8cmVjdCB4PSI5NTguNSIgeT0iNTIwLjciIHdpZHRoPSIzLjAiIGhlaWdodD0iNjUuNCIgZmlsbD0iIzI2MmUzOCIgb3BhY2l0eT0iMC41NSIvPgo8cmVjdCB4PSI4MTEuNSIgeT0iNDEzLjkiIHdpZHRoPSIyOTcuMCIgaGVpZ2h0PSIxNzIuMSIgcng9IjI5LjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzI2MmUzOCIgc3Ryb2tlLW9wYWNpdHk9IjAuNTkxIiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8cmVjdCB4PSI4MTEuNSIgeT0iNDYzLjkiIHdpZHRoPSIyOTcuMCIgaGVpZ2h0PSIwLjgiIGZpbGw9IiMyNjJlMzgiIG9wYWNpdHk9IjAuMzA1Ii8+CjxyZWN0IHg9IjgxMS41IiB5PSI1MTIuMCIgd2lkdGg9IjI5Ny4wIiBoZWlnaHQ9IjAuOCIgZmlsbD0iIzI2MmUzOCIgb3BhY2l0eT0iMC4zMDUiLz4KPHJlY3QgeD0iOTI1LjgiIHk9IjQxOS4xIiB3aWR0aD0iNjguMyIgaGVpZ2h0PSIxLjkiIHJ4PSIwLjkiIGZpbGw9InVybCgjbGlnaHRCYXIpIiBvcGFjaXR5PSIwLjU5OCIvPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI21vdXRoKSIvPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI2hhemUpIi8+CjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9InVybCgjZ3JhZGUpIi8+CjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMwMzA2MGIiIG9wYWNpdHk9IjAuMTQiLz4KPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0idXJsKCN2aWcpIi8+Cjwvc3ZnPg==";
		const BACKGROUND = BACKGROUND_URL !== "" ? BACKGROUND_URL : BACKGROUND_RENDITION;

		/* ── tunables ─────────────────────────────────────────────────────────
		 * Every value below is a deliberate knob; the stylesheet interpolates
		 * them, so changing one here changes one thing. ──────────────────── */
		const BRAND_BLUE = "#4d6bfe";      /* deepseek brand seat: whale + wordmark */
		const CYAN = "#7fdcff";            /* workspace icons                       */
		const LINE = "rgba(126,163,255,0.78)";
		const LINE_DIM = "rgba(126,163,255,0.34)";

		/* ── scrap palette ────────────────────────────────────────────────────
		 * Nav entries read as riveted sheet metal rather than a flat fill: rust
		 * body, brass edge, cold white type — the Machinarium / wasteland
		 * register. The type is deliberately NOT a warm tint: bone-on-rust sat
		 * too close to the plate, so the label is pure white with a hard dark
		 * outline and a cold rim, which is what keeps it legible over a busy
		 * metal texture.
		 * ──────────────────────────────────────────────────────────────────── */
		const SCRAP_IRON = "#6b4118";       /* riveted plate body          */
		const SCRAP_IRON_HOVER = "#8a5420"; /* plate under the pointer     */
		const SCRAP_EDGE = "#2e1c0c";       /* plate rim / seam            */
		const SCRAP_BRASS = "#e2b75f";      /* brass highlight + heading   */
		const SCRAP_TYPE = "#ffffff";       /* nav type: cold, never the plate colour */
		const SCRAP_TYPE_RIM = "rgba(158,208,255,0.34)"; /* cold rim lifting it off the metal */

		const BUILT_IN_PLATE_OPACITY = 1;   /* the bundled rendition, as drawn */
		const CUSTOM_PLATE_OPACITY = 0.55;  /* a picked photo starts calmer    */

		/* ── viewport frame ───────────────────────────────────────────────────
		 * A rainbow ring around the whole screen. Four plain edge strips carry
		 * the spectrum — no mask, no clip-path, no border-image — so there is no
		 * "everything is covered in rainbow" failure mode if a property is
		 * unsupported: the worst case is a missing edge.
		 *
		 * Each edge is a slice of one continuous cycle around the perimeter:
		 *   top    红 → 紫   (left to right)
		 *   right  紫 → 红   (top to bottom)
		 *   bottom 紫 → 红   (left to right)
		 *   left   红 → 紫   (top to bottom)
		 * so the four ends agree where they overlap in the corners.
		 * The cycle is a hue rotation, which returns to an identical frame after
		 * one turn, so the loop is seamless and needs no gradient interpolation.
		 * ──────────────────────────────────────────────────────────────────── */
		const FRAME_SPECTRUM = ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#32d0e0", "#4d6bfe", "#af52de"];
		const FRAME_FORWARD = FRAME_SPECTRUM.join(", ");
		const FRAME_REVERSE = [...FRAME_SPECTRUM].reverse().join(", ");
		const FRAME_SECONDS = 5;            /* one full hue turn                     */

		/* ── conversation surface ─────────────────────────────────────────────
		 * The transcript and the composer both read `--dsh-content-font-size`.
		 * The shell derives `--dsh-content-font-delta` and the secondary pair
		 * from that size ON <body>, so overriding only the size inside a region
		 * would grow body text while leaving the heading/table ladder behind —
		 * the region therefore re-derives all four.
		 * ──────────────────────────────────────────────────────────────────── */
		const CONVERSATION_FONT_SIZE = "16px";  /* up from the 14px default        */
		/* The conversation text borrows the mode chip's treatment — a tinted
		 * metal with a soft halo — in a cool hue. Deliberately neither white
		 * (it would read as plain default type) nor the chip's brass (the two
		 * must stay distinguishable). */
		const CONVERSATION_TEXT = "#c8e4ff";
		const CONVERSATION_TEXT_SOFT = "rgba(178,214,255,0.88)";
		const CONVERSATION_TEXT_GLOW = "rgba(122,196,255,0.35)";

		/* The current Session title in the conversation header gets the same chip
		 * treatment as the mode chip, in cyan. The two sit side by side, so a
		 * shared hue would make them read as one control. */
		const TITLE_TEXT = "#9fe8ff";
		const TITLE_FILL = "rgba(50,208,224,0.16)";
		const TITLE_RING = "rgba(50,208,224,0.55)";
		const TITLE_GLOW = "rgba(50,208,224,0.28)";

		/* ── caption band palette ─────────────────────────────────────────────
		 * One hue per round, advancing through the spectrum in the order
		 * 红 → 橙 → 黄 → 绿 → 青 → 蓝 → 紫. Both bands always carry the SAME
		 * hue, so when they meet the bar reads as one colour, and the collision
		 * itself shows up as a flare (higher alpha, stronger bloom) rather than
		 * a hue change. Values are `r,g,b` triples; alpha is applied per phase.
		 * ──────────────────────────────────────────────────────────────────── */
		const RAIL_COLOURS = [
			"255,59,48",    /* 红 */
			"255,149,0",    /* 橙 */
			"255,214,10",   /* 黄 */
			"52,199,89",    /* 绿 */
			"50,208,224",   /* 青 */
			"77,107,254",   /* 蓝 */
			"175,82,222",   /* 紫 */
		];
		const RAIL_ALPHA_COLD = 0.3;       /* travelling wash — the bar is 40px tall */
		const RAIL_ALPHA_HOT = 0.52;       /* flare at and after the collision      */
		const RAIL_GLOW_COLD = 0.35;       /* bloom under the travelling band       */
		const RAIL_GLOW_HOT = 0.62;        /* bloom at and after the collision      */
		const RAIL_SECONDS_PER_ROUND = 3;  /* ~3s per collision                     */

		/**
		 * Where each beat of a round sits, as a FRACTION of that round rather
		 * than a percentage of the whole animation. Scaling by the round keeps
		 * the rhythm at `RAIL_SECONDS_PER_ROUND` for any palette length, and —
		 * critically — keeps every stop inside its own round. Writing these as
		 * absolute percentages is what broke the motion when the palette grew
		 * from 3 hues to 7: rounds became 14.3% long, the stops of neighbouring
		 * rounds interleaved, and the browser sorted them into a nonsense
		 * sequence that read as the middle spreading outwards.
		 */
		const RAIL_PHASES = {
			enter: 0,        /* off-stage, invisible                        */
			visible: 0.02,   /* opaque at the outer edge                    */
			meet: 0.33,      /* reaches the centre line (~1s)               */
			flare: 0.35,     /* collision: same hue, brighter + more bloom  */
			hold: 0.5,       /* ends the flare                              */
			gone: 0.72,      /* faded out, well before the next round       */
		};

		/**
		 * Build both band keyframe blocks from the palette above. One animation
		 * cycle is `RAIL_COLOURS.length` rounds; every round resets its position
		 * during a frame that is fully transparent, so the sweep never looks
		 * like it slides back out. Both blocks are built from the same hue each
		 * round — only the travel direction differs, and both travel inwards.
		 *
		 * The fill and its bloom are animated directly as `background-color` and
		 * `box-shadow`. An earlier revision animated `color` and read it back
		 * through `currentColor` inside a gradient; that produced no visible
		 * band at all, so the paint properties are spelled out per stop here.
		 * @returns the `@keyframes` text for both bands.
		 */
		function railKeyframes() {
			const span = 100 / RAIL_COLOURS.length;
			const number = (value) => value.toFixed(3).replace(/\.?0+$/, "");
			const rgba = (triple, alpha) => `rgba(${triple},${alpha})`;
			const blocks = [];
			const emit = (name, from, to) => {
				const lines = [`@keyframes ${name} {`];
				for (let index = 0; index < RAIL_COLOURS.length; index++) {
					const base = index * span;
					const hue = RAIL_COLOURS[index];
					const wash = rgba(hue, RAIL_ALPHA_COLD);
					const washGlow = rgba(hue, RAIL_GLOW_COLD);
					const flare = rgba(hue, RAIL_ALPHA_HOT);
					const flareGlow = rgba(hue, RAIL_GLOW_HOT);
					const stop = (phase, transform, opacity, fill, glow) => lines.push(
						`\t${number(base + phase * span)}% { transform: translateX(${transform}); opacity: ${opacity}; background-color: ${fill}; box-shadow: 0 0 16px 3px ${glow}; }`,
					);
					stop(RAIL_PHASES.enter, from, 0, wash, washGlow);
					stop(RAIL_PHASES.visible, from, 1, wash, washGlow);
					stop(RAIL_PHASES.meet, to, 1, wash, washGlow);
					stop(RAIL_PHASES.flare, to, 1, flare, flareGlow);
					stop(RAIL_PHASES.hold, to, 1, flare, flareGlow);
					stop(RAIL_PHASES.gone, to, 0, flare, flareGlow);
				}
				const first = RAIL_COLOURS[0];
				lines.push(`\t100% { transform: translateX(${from}); opacity: 0; background-color: ${rgba(first, RAIL_ALPHA_COLD)}; box-shadow: 0 0 16px 3px ${rgba(first, RAIL_GLOW_COLD)}; }`);
				lines.push("}");
				blocks.push(lines.join("\n"));
			};
			emit("dsh2001-rail-left", "-100%", "0");
			emit("dsh2001-rail-right", "100%", "0");
			return blocks.join("\n\n");
		}

		/* ── token layer ──────────────────────────────────────────────────────
		 * Alias/specific tokens only, each with both modes, per the theme
		 * contract (a bare string value is rejected at runtime).
		 *
		 * The shell stacks two or three translucent surfaces over the plate, so
		 * the dark alphas are chosen against (1 - a)^3: 0.22 keeps roughly 47%
		 * of the plate visible in the reading column, which still leaves body
		 * text above 7:1 contrast. ──────────────────────────────────────── */
		const TOKENS = {
			"--dsw-alias-bg-base": { light: "rgba(232,239,249,0.90)", dark: "rgba(4,9,17,0.22)" },
			"--dsw-alias-bg-layer-1": { light: "rgba(248,251,255,0.93)", dark: "rgba(9,14,23,0.84)" },
			"--dsw-alias-bg-layer-2": { light: "rgba(255,255,255,0.96)", dark: "rgba(13,19,30,0.88)" },
			"--dsw-alias-bg-overlay": { light: "rgba(250,252,255,0.97)", dark: "rgba(6,10,18,0.95)" },
			"--dsw-alias-border-l1": { light: "rgba(46,84,190,0.20)", dark: "rgba(96,132,255,0.26)" },
			"--dsw-alias-border-l2": { light: "rgba(40,76,180,0.34)", dark: "rgba(120,158,255,0.46)" },
			"--dsw-alias-brand-primary": { light: "#2B49D6", dark: "#5C7BFF" },
			"--dsw-alias-label-primary": { light: "#08111F", dark: "#E8EFFA" },
			"--dsw-alias-label-secondary": { light: "rgba(22,38,64,0.70)", dark: "rgba(197,213,236,0.74)" },
			"--dsw-alias-state-error-primary": { light: "#C62839", dark: "#FF5F6E" },
			"--dsw-alias-state-idle-primary": { light: "rgba(70,92,124,0.72)", dark: "rgba(140,160,190,0.72)" },
			"--dsw-alias-state-success-primary": { light: "#0E8F6B", dark: "#39D6A2" },
			"--dsw-alias-state-warn-primary": { light: "#A66A00", dark: "#FFC55C" },
			"--dsw-specific-sidebar-fill": { light: "rgba(226,235,246,0.86)", dark: "rgba(4,9,17,0.24)" },
			"--dsw-specific-input-major": { light: "rgba(255,255,255,0.90)", dark: "rgba(7,12,22,0.86)" },
			"--dsw-specific-bubble": { light: "rgba(219,229,247,0.95)", dark: "rgba(17,28,54,0.82)" },
			"--dsw-specific-bubble-highlight": { light: "rgba(43,73,214,0.16)", dark: "rgba(92,123,255,0.20)" },
			"--dsw-specific-menu": { light: "rgba(250,252,255,0.97)", dark: "rgba(6,11,19,0.96)" },
			"--dsw-specific-selector": { light: "rgba(255,255,255,0.95)", dark: "rgba(9,15,26,0.92)" },
			"--dsw-specific-tip": { light: "rgba(248,251,255,0.96)", dark: "rgba(7,12,21,0.94)" },
		};

		/* ── display stylesheet ───────────────────────────────────────────────
		 * Scoped to html[data-dsh-2001] so it is inert the moment the attribute
		 * goes away. Structural tokens the alias layer does not own (radius
		 * scale, focus ring) live here, which keeps the theme layer strictly
		 * colour-only and easy to layer over.
		 *
		 * z-index budget for the desktop caption bar:
		 *   5     bar background    (html::after)
		 *   30    the shell's fixed New Session chip
		 *   1100  the caption menu (应用 / 编辑)
		 *   1200  the two collision rails — they ride over the whole bar, and
		 *         stay readable underneath only because they are translucent
		 * ──────────────────────────────────────────────────────────────────── */
		const CSS = `
/* ══ DSH-theme-display-2001SpaceOdyssey · display layer ══════════════════
   Scope: html[${ROOT_ATTRIBUTE}]. Removing that attribute restores the
   stock Harness display with no residue.                                    */

html[${ROOT_ATTRIBUTE}] {
	background-color: #03060b;
}

/* The plate lives on a fixed pseudo-element rather than on html itself so a
   picked photo can be dimmed without re-encoding it. */
html[${ROOT_ATTRIBUTE}]::before {
	content: "";
	position: fixed;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	background-image: var(--dsh-2001-plate, url("${BACKGROUND}"));
	background-position: center center;
	background-repeat: no-repeat;
	background-size: cover;
	opacity: var(--dsh-2001-plate-opacity, 1);
}

/* The frame paints --dsw-alias-bg-base over the plate; body must not add an
   opaque canvas of its own or the plate is hidden. */
html[${ROOT_ATTRIBUTE}] body {
	background-color: transparent;
	--dsw-radius-xs: 2px;
	--dsw-radius-sm: 4px;
	--dsw-radius-md: 6px;
	--dsw-radius-lg: 8px;
	--dsw-radius-xl: 12px;
	--dsw-radius-panel: 10px;
	--dsw-focus-ring-color: #5c7bff;
	--dsh-2001-line: ${LINE};
	--dsh-2001-line-dim: ${LINE_DIM};
	--dsh-2001-blue: ${BRAND_BLUE};
	--dsh-2001-scrap: ${SCRAP_IRON};
	--dsh-2001-scrap-hover: ${SCRAP_IRON_HOVER};
	--dsh-2001-scrap-edge: ${SCRAP_EDGE};
	--dsh-2001-brass: ${SCRAP_BRASS};
	--dsh-2001-type: ${SCRAP_TYPE};
	--dsh-2001-type-rim: ${SCRAP_TYPE_RIM};
	--dsh-2001-cyan: ${CYAN};
}

/* ── 1 · New Session + panel entries: riveted scrap plate ─────────────────
   New Session is its own button (class name ending in _newSession, fixed
   into the caption strip on Windows as a 28px chip); 插件 / 自动化任务 are the
   'sidebar.panellist' rows, reached through the outlet anchor those rows
   render inside themselves.

   The plate is built from gradients only — brushed-metal streaks, a warm top
   light, grime at the bottom, and two rivets — so it stays crisp at any size
   and needs no image asset. */
html[${ROOT_ATTRIBUTE}] button[class*="_newSession"],
html[${ROOT_ATTRIBUTE}] button:has([data-slot="sidebar.panellist"]) {
	border: 1px solid var(--dsh-2001-scrap-edge);
	border-radius: 3px;
	color: var(--dsh-2001-type);
	font-weight: 800;
	font-size: 15px;
	letter-spacing: 0.04em;
	background-color: var(--dsh-2001-scrap);
	/* Nine stacked layers, no image asset: four corner rivets, a hazard
	   stripe along the bottom edge, brushed-metal streaks, a panel seam, a
	   diagonal specular sweep, and the warm-top / grimed-bottom ramp. The
	   per-layer size/position lists run parallel to the image list, so keep
	   the three lists in the same order when editing. */
	background-image:
		radial-gradient(circle at 7px 7px, rgba(252,234,196,0.95) 0 1.3px, rgba(58,32,9,0.9) 1.4px 2.1px, rgba(0,0,0,0) 2.8px),
		radial-gradient(circle at calc(100% - 7px) 7px, rgba(252,234,196,0.95) 0 1.3px, rgba(58,32,9,0.9) 1.4px 2.1px, rgba(0,0,0,0) 2.8px),
		radial-gradient(circle at 7px calc(100% - 8px), rgba(252,234,196,0.9) 0 1.3px, rgba(58,32,9,0.9) 1.4px 2.1px, rgba(0,0,0,0) 2.8px),
		radial-gradient(circle at calc(100% - 7px) calc(100% - 8px), rgba(252,234,196,0.9) 0 1.3px, rgba(58,32,9,0.9) 1.4px 2.1px, rgba(0,0,0,0) 2.8px),
		repeating-linear-gradient(115deg, rgba(24,14,5,0.9) 0 4px, rgba(226,183,95,0.62) 4px 8px),
		repeating-linear-gradient(97deg, rgba(0,0,0,0.24) 0 1px, rgba(255,255,255,0.06) 1px 3px),
		linear-gradient(180deg, rgba(0,0,0,0) 0 53%, rgba(0,0,0,0.5) 53% 55%, rgba(255,216,152,0.18) 55% 57%, rgba(0,0,0,0) 57%),
		linear-gradient(115deg, rgba(255,230,184,0.20) 0 16%, rgba(255,255,255,0) 36%),
		linear-gradient(180deg, rgba(255,206,140,0.34), rgba(120,70,20,0.10) 44%, rgba(0,0,0,0.52));
	background-size:
		100% 100%, 100% 100%, 100% 100%, 100% 100%,
		100% 4px,
		100% 100%, 100% 100%, 100% 100%, 100% 100%;
	background-position:
		left top, right top, left bottom, right bottom,
		left bottom,
		left top, left top, left top, left top;
	background-repeat: no-repeat;
	box-shadow:
		inset 0 0 0 1px rgba(226,183,95,0.38),
		inset 0 1px 0 rgba(255,236,190,0.30),
		inset 0 -1px 0 rgba(0,0,0,0.65),
		inset 0 -3px 8px rgba(0,0,0,0.50),
		0 2px 10px rgba(0,0,0,0.60);
	text-shadow:
		0 0 2px rgba(0,0,0,0.95),
		0 1px 1px rgba(0,0,0,0.9),
		0 0 12px rgba(0,0,0,0.8),
		0 0 16px var(--dsh-2001-type-rim);
}
html[${ROOT_ATTRIBUTE}] button[class*="_newSession"]:hover,
html[${ROOT_ATTRIBUTE}] button:has([data-slot="sidebar.panellist"]):hover {
	background-color: var(--dsh-2001-scrap-hover);
	color: var(--dsh-2001-type);
	border-color: #4a2f14;
}
html[${ROOT_ATTRIBUTE}] button[class*="_newSession"] svg,
html[${ROOT_ATTRIBUTE}] button:has([data-slot="sidebar.panellist"]) svg,
html[${ROOT_ATTRIBUTE}] button[class*="_newSession"] * {
	color: var(--dsh-2001-type);
}
/* Icons get the same treatment as the label: a dark edge plus a cold rim, so
   a glyph never sinks into the brushed metal behind it. */
html[${ROOT_ATTRIBUTE}] button[class*="_newSession"] svg,
html[${ROOT_ATTRIBUTE}] button:has([data-slot="sidebar.panellist"]) svg {
	filter: drop-shadow(0 0 2px rgba(0,0,0,0.95)) drop-shadow(0 0 9px var(--dsh-2001-type-rim));
}

/* ── 2 · Workspace region: a bracketed instrument bay ─────────────────────
   The region is the direct parent of the 'sidebar.workspaces' anchor. */
html[${ROOT_ATTRIBUTE}] div:has(> [data-slot="sidebar.workspaces"]) {
	position: relative;
	margin: 4px 2px 10px;
	padding: 8px 5px 6px;
	border: 1px solid var(--dsh-2001-line-dim);
	border-radius: 5px;
	background-image: linear-gradient(180deg, rgba(77,107,254,0.12), rgba(4,9,17,0.30));
	box-shadow:
		inset 0 0 0 1px rgba(3,6,12,0.55),
		inset 0 0 26px rgba(77,107,254,0.12);
}
html[${ROOT_ATTRIBUTE}] div:has(> [data-slot="sidebar.workspaces"])::before {
	content: "";
	position: absolute;
	inset: 4px;
	pointer-events: none;
	opacity: 0.85;
	background-image:
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line));
	background-size:
		14px 2px, 2px 14px,
		14px 2px, 2px 14px,
		14px 2px, 2px 14px,
		14px 2px, 2px 14px;
	background-position:
		left top, left top,
		right top, right top,
		left bottom, left bottom,
		right bottom, right bottom;
	background-repeat: no-repeat;
}

/* ── 3 · Workspace heading + rows ─────────────────────────────────────────
   The section heading ships in 'label-tertiary' — the dimmest token — so
   "工作区" reads as a label rather than a title. It is promoted here to a
   brass title with a lit accent bar, and the rows below are pulled up to
   match. 'data-row-key' is the row identity the browser publishes; the
   '[class*="_…"]' matches carry the CSS-module local name, so they survive a
   content-hash change on the shell side. */
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_sectionHeader"] {
	position: relative;
	padding-left: 11px;
	color: var(--dsh-2001-brass);
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_sectionHeader"]::before {
	content: "";
	position: absolute;
	left: 0;
	top: 50%;
	width: 3px;
	height: 17px;
	border-radius: 2px;
	transform: translateY(-50%);
	background-image: linear-gradient(180deg, var(--dsh-2001-brass), ${SCRAP_IRON});
	box-shadow: 0 0 10px rgba(226,183,95,0.55);
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_sectionLabel"] {
	font-size: 15px;
	font-weight: 700;
	letter-spacing: 0.16em;
	color: var(--dsh-2001-brass);
	text-shadow: 0 0 12px rgba(226,183,95,0.45), 0 1px 0 rgba(0,0,0,0.7);
}
/* The whole heading row is highlighted, so its own controls go brass too
   instead of the region's cyan. */
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_sectionHeader"] svg {
	color: var(--dsh-2001-brass);
	filter: drop-shadow(0 0 7px rgba(226,183,95,0.5));
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] {
	font-weight: 500;
	letter-spacing: 0.01em;
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] svg {
	color: var(--dsh-2001-cyan);
	filter: drop-shadow(0 0 6px rgba(127,220,255,0.40));
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [data-row-key] {
	font-weight: 600;
	color: #eaf2ff;
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [data-row-key]:hover {
	background-image: linear-gradient(90deg, rgba(77,107,254,0.22), rgba(77,107,254,0));
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_title"] {
	font-size: 15px;
	font-weight: 600;
	color: #eaf2ff;
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_sessionRow"] svg,
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.workspaces"] [class*="_workspaceRow"] svg {
	width: 17px;
	height: 17px;
}

/* ── 4 · Desktop caption strip: tech rail with a collision sweep ──────────
   The desktop shell marks <html data-windows-titlebar> and fixes a 40px
   strip at the top holding the New Session chip plus the 应用 / 编辑 menubar
   (the menubar, z-index 1100, stays above every rule here). */
html[${ROOT_ATTRIBUTE}][data-windows-titlebar]::after {
	content: "";
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: var(--dsh-windows-titlebar-height, 40px);
	z-index: 5;
	pointer-events: none;
	/* One flat translucent fill: no texture, no gradients, no rules. */
	background-color: rgba(3,6,12,0.86);
	background-image: none;
	border: 0;
	box-shadow: none;
}

/* The caption menubar lives in its own shadow root; only inherited custom
   properties cross that boundary, so the buttons are re-tinted through the
   token names their shadow stylesheet already reads. */
html[${ROOT_ATTRIBUTE}] [data-windows-menu] {
	--dsw-alias-label-secondary: #c3d4f2;
	--dsw-alias-label-primary: #ffffff;
	--dsw-alias-interactive-bg-hover: rgba(77,107,254,0.28);
	--dsw-alias-state-business-primary: #7ea3ff;
}

/* Two full-height bands sweep across the caption bar and collide on the
   centre line, covering the whole bar between them. They ride ABOVE the bar's
   own controls (z-index 1200 clears the shell's fixed chip at 30 and the
   应用 / 编辑 menubar at 1100), which is only acceptable because a band is a
   translucent wash rather than a solid block. Bands are kept full height and
   the fill is deliberately light so the caption text stays legible while one
   passes over it; each band fades out at its trailing end through a mask, and
   the keyframes drive background-color and box-shadow per stop, so no paint
   property depends on currentColor. */
html[${ROOT_ATTRIBUTE}][data-windows-titlebar] body::before,
html[${ROOT_ATTRIBUTE}][data-windows-titlebar] body::after {
	content: "";
	position: fixed;
	top: 0;
	width: 50vw;
	height: var(--dsh-windows-titlebar-height, 40px);
	z-index: 1200;
	pointer-events: none;
	background-color: rgba(${RAIL_COLOURS[0]},${RAIL_ALPHA_COLD});
	box-shadow: 0 0 18px 2px rgba(${RAIL_COLOURS[0]},${RAIL_GLOW_COLD});
	animation-duration: ${RAIL_COLOURS.length * RAIL_SECONDS_PER_ROUND}s;
	animation-timing-function: cubic-bezier(.45,.05,.25,1);
	animation-iteration-count: infinite;
}
html[${ROOT_ATTRIBUTE}][data-windows-titlebar] body::before {
	left: 0;
	-webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 42%, #000 100%);
	mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 42%, #000 100%);
	animation-name: dsh2001-rail-left;
}
html[${ROOT_ATTRIBUTE}][data-windows-titlebar] body::after {
	right: 0;
	-webkit-mask-image: linear-gradient(270deg, rgba(0,0,0,0) 0%, #000 42%, #000 100%);
	mask-image: linear-gradient(270deg, rgba(0,0,0,0) 0%, #000 42%, #000 100%);
	animation-name: dsh2001-rail-right;
}

${railKeyframes()}

/* ── brand seat ───────────────────────────────────────────────────────────
   The official whale mark and wordmark both paint with currentColor, so the
   published slot anchors tint the *official* artwork DeepSeek blue. No Slot
   is replaced, so another theme plugin can still own these seats.          */
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.brand.mark"],
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.brand.name"] {
	color: var(--dsh-2001-blue);
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.brand.mark"] svg {
	filter: drop-shadow(0 0 7px rgba(77,107,254,0.60));
}
html[${ROOT_ATTRIBUTE}] [data-slot="sidebar.brand.name"] svg {
	filter: drop-shadow(0 0 10px rgba(77,107,254,0.42));
}

/* ── 5 · viewport frame: a rainbow ring around the whole screen ───────────
   Four edge strips, nothing else — no bloom layer, no blur, no shadow, so the
   frame is a clean 4px line and the screen edge stays crisp. Strips are plain
   fixed divs with a linear gradient, so nothing here depends on mask,
   clip-path or border-image support: the worst case of an unsupported property
   is a missing edge rather than a rainbow sheet over the whole app. Every
   strip is pointer-transparent and sits above the app, so the frame never
   intercepts input.

   The only animated property is the filter function, and a single animation
   drives all four strips so they stay in phase. */
html[${ROOT_ATTRIBUTE}] .dsh2001FrameEdge {
	position: fixed;
	pointer-events: none;
	--dsh-2001-edge: 4px;
	z-index: 1300;
	animation-name: dsh2001-frame-hue;
	animation-duration: ${FRAME_SECONDS}s;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
}
html[${ROOT_ATTRIBUTE}] [data-edge="top"] {
	top: 0;
	left: 0;
	right: 0;
	height: var(--dsh-2001-edge);
	background-image: linear-gradient(90deg, ${FRAME_FORWARD});
}
html[${ROOT_ATTRIBUTE}] [data-edge="bottom"] {
	bottom: 0;
	left: 0;
	right: 0;
	height: var(--dsh-2001-edge);
	background-image: linear-gradient(90deg, ${FRAME_REVERSE});
}
html[${ROOT_ATTRIBUTE}] [data-edge="left"] {
	top: 0;
	bottom: 0;
	left: 0;
	width: var(--dsh-2001-edge);
	background-image: linear-gradient(180deg, ${FRAME_FORWARD});
}
html[${ROOT_ATTRIBUTE}] [data-edge="right"] {
	top: 0;
	bottom: 0;
	right: 0;
	width: var(--dsh-2001-edge);
	background-image: linear-gradient(180deg, ${FRAME_REVERSE});
}

@keyframes dsh2001-frame-hue {
	from { filter: hue-rotate(0deg); }
	to { filter: hue-rotate(360deg); }
}

/* ── composer: instrument panel instead of a soft card ────────────────────
   [data-composer-card] is the marker the composer itself publishes. The
   official border is replaced with box-shadow rings, so nothing here changes
   layout or hit areas.                                                     */
html[${ROOT_ATTRIBUTE}] [data-composer-card] {
	box-shadow:
		0 0 0 1px rgba(120,158,255,0.38),
		0 0 26px rgba(77,107,254,0.16),
		0 18px 46px rgba(0,0,0,0.55);
}
html[${ROOT_ATTRIBUTE}] [data-composer-card]::before {
	content: "";
	position: absolute;
	inset: 4px;
	pointer-events: none;
	opacity: 0.9;
	background-image:
		linear-gradient(90deg, rgba(126,163,255,0) 0%, var(--dsh-2001-line) 50%, rgba(126,163,255,0) 100%),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line)),
		linear-gradient(var(--dsh-2001-line), var(--dsh-2001-line));
	background-size:
		calc(100% - 36px) 1px,
		15px 2px, 2px 15px,
		15px 2px, 2px 15px,
		15px 2px, 2px 15px,
		15px 2px, 2px 15px;
	background-position:
		center top,
		left top, left top,
		right top, right top,
		left bottom, left bottom,
		right bottom, right bottom;
	background-repeat: no-repeat;
}

/* ── 6 · conversation surface ─────────────────────────────────────────────
   Both the transcript and the composer carry a data-conversation-region
   attribute, so this one rule sizes the whole conversation. The text ladder is
   re-derived here rather than declared as literals, which keeps
   CONVERSATION_FONT_SIZE a single knob: change it and headings, tables and
   flow rows follow.

   Colour: primary and secondary labels are promoted, tertiary is deliberately
   left alone — brightening the top of the ramp is what makes the ramp read as
   a hierarchy, whereas lifting every step would flatten it again.
   The tint plus a wide, low-alpha halo is the same treatment the mode chip
   carries, in a cool hue rather than the chip's brass; the halo inherits down
   the subtree, so it lights the whole transcript without touching layout. */
html[${ROOT_ATTRIBUTE}] [data-conversation-region] {
	--dsh-content-font-size: ${CONVERSATION_FONT_SIZE};
	--dsh-content-font-delta: calc(var(--dsh-content-font-size) - 14px);
	--dsh-content-font-size-secondary: min(calc(var(--dsh-content-font-size) - 1px), max(13px, calc(var(--dsh-content-font-size) - 2px)));
	--dsh-content-font-delta-secondary: calc(var(--dsh-content-font-size-secondary) - 13px);
	--dsw-alias-label-primary: ${CONVERSATION_TEXT};
	--dsw-alias-label-secondary: ${CONVERSATION_TEXT_SOFT};
	text-shadow: 0 0 12px ${CONVERSATION_TEXT_GLOW};
}

/* The session-header mode chip (标准模式 / 创造模式 …) ships at 12px in
   label-tertiary — the smallest, dimmest pair in the row — so it reads as a
   footnote next to the title. It is promoted to a brass chip here.
   The :not(button *) guard keeps this on the bare chip itself: neighbouring
   header actions are buttons, and a *_label nested inside one must not inherit
   a second chip background. display is deliberately not touched, so the
   shell's narrow-header rule that hides the chip still wins. */
html[${ROOT_ATTRIBUTE}] [data-slot="conversation.session.header.actions"] span[class*="_label"]:not(button *) {
	color: var(--dsh-2001-brass);
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.02em;
	height: 26px;
	line-height: 26px;
	padding: 0 9px;
	border-radius: 3px;
	background-color: rgba(226,183,95,0.16);
	box-shadow:
		inset 0 0 0 1px rgba(226,183,95,0.45),
		0 0 10px rgba(226,183,95,0.18);
	text-shadow: 0 0 10px rgba(226,183,95,0.35);
}
html[${ROOT_ATTRIBUTE}] [data-slot="conversation.session.header.actions"] span[class*="_label"]:not(button *) svg {
	color: var(--dsh-2001-brass);
	opacity: 1;
	filter: drop-shadow(0 0 6px rgba(226,183,95,0.5));
}

/* The current Session title in the conversation header — the crumb the shell
   styles as a bare label-primary run — gets the mode chip's treatment in cyan.
   The two sit side by side, so sharing the brass would make them read as one
   control; cyan also matches the frame spectrum and the sidebar glyphs.
   Scoped through the header that owns the actions slot, so a crumb class
   anywhere else in the tree cannot pick this up, and the display property is
   left alone so the shell keeps its own inline-block ellipsis behaviour. */
html[${ROOT_ATTRIBUTE}] header:has([data-slot="conversation.session.header.actions"]) [class*="_crumbCurrent"] {
	color: ${TITLE_TEXT};
	font-size: 15px;
	font-weight: 700;
	letter-spacing: 0.01em;
	padding: 3px 10px;
	border-radius: 3px;
	background-color: ${TITLE_FILL};
	box-shadow:
		inset 0 0 0 1px ${TITLE_RING},
		0 0 10px ${TITLE_GLOW};
	text-shadow: 0 0 10px ${TITLE_GLOW};
}

/* ── settings page: plate picker ──────────────────────────────────────────
   Own surface, so it carries its own plugin root class and never assumes the
   sidebar or the composer is its ancestor. */
html[${ROOT_ATTRIBUTE}] .dsh2001Panel {
	display: flex;
	flex-direction: column;
	gap: 14px;
	max-width: 620px;
	color: var(--dsw-alias-label-primary);
}
html[${ROOT_ATTRIBUTE}] .dsh2001PlateRow {
	display: flex;
	gap: 14px;
	align-items: center;
}
html[${ROOT_ATTRIBUTE}] .dsh2001PlateThumb {
	position: relative;
	flex: none;
	width: 168px;
	aspect-ratio: 16 / 9;
	border: 1px solid var(--dsh-2001-line-dim);
	border-radius: 4px;
	overflow: hidden;
	background-color: rgba(3,6,12,0.75);
	box-shadow: inset 0 0 18px rgba(0,0,0,0.55);
}
/* The bundled rendition previews on its own layer so the opacity slider is
   honest for it too, not just for a picked image. */
html[${ROOT_ATTRIBUTE}] .dsh2001PlateThumbPlate {
	width: 100%;
	height: 100%;
	background-image: url("${BACKGROUND}");
	background-position: center;
	background-size: cover;
	opacity: var(--dsh-2001-plate-opacity, 1);
}
html[${ROOT_ATTRIBUTE}] .dsh2001PlateThumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: var(--dsh-2001-plate-opacity, 1);
}
html[${ROOT_ATTRIBUTE}] .dsh2001PlateMeta {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
html[${ROOT_ATTRIBUTE}] .dsh2001PlateTitle {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	line-height: 20px;
}
html[${ROOT_ATTRIBUTE}] .dsh2001PlateHint {
	margin: 0;
	font-size: 12px;
	line-height: 18px;
	color: var(--dsw-alias-label-secondary);
}
html[${ROOT_ATTRIBUTE}] .dsh2001Actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
html[${ROOT_ATTRIBUTE}] .dsh2001Button {
	cursor: pointer;
	border: 1px solid var(--dsh-2001-line-dim);
	border-radius: 4px;
	background-color: rgba(77,107,254,0.18);
	color: var(--dsw-alias-label-primary);
	font: inherit;
	font-size: 13px;
	line-height: 20px;
	padding: 6px 14px;
}
html[${ROOT_ATTRIBUTE}] .dsh2001Button:hover:not(:disabled) {
	background-color: rgba(77,107,254,0.32);
	box-shadow: 0 0 14px rgba(77,107,254,0.35);
}
html[${ROOT_ATTRIBUTE}] .dsh2001Button:disabled {
	cursor: default;
	opacity: 0.45;
}
html[${ROOT_ATTRIBUTE}] .dsh2001File {
	display: none;
}
html[${ROOT_ATTRIBUTE}] .dsh2001Slider {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 13px;
	line-height: 20px;
}
html[${ROOT_ATTRIBUTE}] .dsh2001Slider input[type="range"] {
	flex: 1;
	max-width: 260px;
	accent-color: var(--dsh-2001-blue);
}
html[${ROOT_ATTRIBUTE}] .dsh2001SliderValue {
	min-width: 42px;
	font-variant-numeric: tabular-nums;
	color: var(--dsh-2001-cyan);
}
html[${ROOT_ATTRIBUTE}] .dsh2001Foot {
	margin: 0;
	font-size: 12px;
	line-height: 18px;
	color: var(--dsw-alias-label-secondary);
}

/* Dark mode only: colder scrollbar tint over the plate. */
html[${ROOT_ATTRIBUTE}] body[data-ds-dark-theme] {
	--dsh-scrollbar-thumb: rgba(126,163,255,0.34);
	--dsh-scrollbar-thumb-hover: rgba(126,163,255,0.58);
}
html[${ROOT_ATTRIBUTE}] ::selection {
	background-color: rgba(77,107,254,0.38);
}

@media (prefers-reduced-motion: reduce) {
	/* No sweep: park both rails at the centre line in the settled hot colour. */
	html[${ROOT_ATTRIBUTE}][data-windows-titlebar] body::before,
	html[${ROOT_ATTRIBUTE}][data-windows-titlebar] body::after {
		animation: none;
		transform: translateX(0);
		background-color: rgba(${RAIL_COLOURS[0]},${RAIL_ALPHA_HOT});
		box-shadow: 0 0 16px 3px rgba(${RAIL_COLOURS[0]},${RAIL_GLOW_HOT});
		opacity: 0.9;
	}

	/* The frame keeps its spectrum but stops turning. */
	html[${ROOT_ATTRIBUTE}] .dsh2001FrameEdge {
		animation: none;
	}
}
`;

		/* ── plate storage ────────────────────────────────────────────────────
		 * IndexedDB holds the picked image as a Blob, so the background survives
		 * deleting the source file and never needs re-encoding. ─────────── */
		const PLATE_DATABASE = "dsh-2001-space-odyssey";
		const PLATE_STORE = "display";
		const PLATE_KEY = "plate";

		const plateStore = (() => {
			let opening = null;
			function open() {
				if (opening === null) {
					opening = new Promise((resolve, reject) => {
						if (typeof indexedDB === "undefined" || indexedDB === null) {
							reject(new Error("indexedDB unavailable"));
							return;
						}
						const request = indexedDB.open(PLATE_DATABASE, 1);
						request.onupgradeneeded = () => {
							const db = request.result;
							if (!db.objectStoreNames.contains(PLATE_STORE)) db.createObjectStore(PLATE_STORE);
						};
						request.onsuccess = () => resolve(request.result);
						request.onerror = () => reject(request.error);
						request.onblocked = () => reject(new Error("indexedDB blocked"));
					}).catch((error) => {
						opening = null;
						throw error;
					});
				}
				return opening;
			}
			function run(mode, body) {
				return open().then((db) => new Promise((resolve, reject) => {
					const transaction = db.transaction(PLATE_STORE, mode);
					const store = transaction.objectStore(PLATE_STORE);
					let carried;
					body(store, (value) => { carried = value; });
					transaction.oncomplete = () => resolve(carried);
					transaction.onerror = () => reject(transaction.error);
					transaction.onabort = () => reject(transaction.error);
				}));
			}
			return {
				read() {
					return run("readonly", (store, done) => {
						const request = store.get(PLATE_KEY);
						request.onsuccess = () => done(request.result);
					}).then((record) => (record === undefined ? null : record), () => null);
				},
				write(record) {
					return run("readwrite", (store) => { store.put(record, PLATE_KEY); }).then(() => true, () => false);
				},
				clear() {
					return run("readwrite", (store) => { store.delete(PLATE_KEY); }).then(() => true, () => false);
				},
			};
		})();

		/** Locale without depending on the locale service: the shell sets <html lang>. */
		function text(zh, en) {
			const lang = document.documentElement.lang ?? "";
			return lang.toLowerCase().startsWith("zh") ? zh : en;
		}

		const plate = (() => {
			const listeners = new Set();
			let state = { kind: "default", opacity: BUILT_IN_PLATE_OPACITY, objectUrl: "" };

			/**
			 * Push the plate into CSS variables. The opacity is published for
			 * BOTH plate kinds — it is a display preference, not a property of a
			 * picked file — while the image variable is owned by a custom plate
			 * alone, so clearing it falls back to the bundled rendition.
			 */
			function publish() {
				const root = document.documentElement;
				root.style.setProperty("--dsh-2001-plate-opacity", String(state.opacity));
				if (state.kind === "custom" && state.objectUrl !== "") {
					root.style.setProperty("--dsh-2001-plate", 'url("' + state.objectUrl + '")');
					root.setAttribute(PLATE_ATTRIBUTE, "custom");
				} else {
					root.style.removeProperty("--dsh-2001-plate");
					root.removeAttribute(PLATE_ATTRIBUTE);
				}
			}
			function commit(next) {
				state = next;
				publish();
				for (const listener of Array.from(listeners)) listener();
			}
			function release(url) {
				if (url === "") return;
				try { URL.revokeObjectURL(url); } catch (error) { /* already gone */ }
			}
			function save(record) {
				return plateStore.write(record).catch(() => false);
			}
			return {
				get() { return state; },
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				/** Restore the stored plate and its opacity; no record keeps the bundled plate. */
				hydrate() {
					return plateStore.read().then((record) => {
						const stored = record !== null && record !== undefined ? record : {};
						const blob = stored.blob instanceof Blob ? stored.blob : null;
						const opacity = typeof stored.opacity === "number" ? stored.opacity : BUILT_IN_PLATE_OPACITY;
						release(state.objectUrl);
						if (blob !== null) {
							commit({ kind: "custom", opacity, objectUrl: URL.createObjectURL(blob) });
						} else {
							commit({ kind: "default", opacity, objectUrl: "" });
						}
					});
				},
				useFile(file) {
					release(state.objectUrl);
					// A photo at full strength is far louder than the drawn plate, so
					// the first pick pulls the opacity down; a later pick keeps the
					// value the user already chose.
					const opacity = state.kind === "custom" ? state.opacity : CUSTOM_PLATE_OPACITY;
					const objectUrl = URL.createObjectURL(file);
					commit({ kind: "custom", opacity, objectUrl });
					return save({ blob: file, opacity, name: file.name, type: file.type });
				},
				setOpacity(value) {
					const opacity = Math.min(1, Math.max(0.05, value));
					commit({ ...state, opacity });
					return plateStore.read().then((record) => save(
						record === null || record === undefined ? { opacity } : { ...record, opacity },
					));
				},
				reset() {
					release(state.objectUrl);
					commit({ kind: "default", opacity: state.opacity, objectUrl: "" });
					return plateStore.clear().then(() => save({ opacity: state.opacity }));
				},
				dispose() {
					release(state.objectUrl);
					// Leave nothing on <html>: both variables this controller writes
					// are removed, not reset, so an unload restores the stock display.
					const root = document.documentElement;
					root.style.removeProperty("--dsh-2001-plate");
					root.style.removeProperty("--dsh-2001-plate-opacity");
					root.removeAttribute(PLATE_ATTRIBUTE);
					state = { kind: "default", opacity: BUILT_IN_PLATE_OPACITY, objectUrl: "" };
					listeners.clear();
				},
			};
		})();

		/** The settings page body: pick, dim or drop the display plate. */
		function PlateSection() {
			const [snapshot, setSnapshot] = React.useState(plate.get());
			const input = React.useRef(null);
			React.useEffect(() => plate.subscribe(() => { setSnapshot(plate.get()); }), []);
			const custom = snapshot.kind === "custom";
			const percent = Math.round(snapshot.opacity * 100);
			const pick = () => { if (input.current !== null) input.current.click(); };
			const onFile = (event) => {
				const files = event.target.files;
				const file = files !== null && files.length > 0 ? files[0] : null;
				event.target.value = "";
				if (file !== null) void plate.useFile(file);
			};
			const onOpacity = (event) => { void plate.setOpacity(Number(event.target.value) / 100); };

			return h("div", { className: "dsh2001Panel" },
				h("div", { className: "dsh2001PlateRow" },
					h("div", { className: "dsh2001PlateThumb" },
						custom && snapshot.objectUrl !== ""
							? h("img", { src: snapshot.objectUrl, alt: "" })
							: h("div", { className: "dsh2001PlateThumbPlate" })),
					h("div", { className: "dsh2001PlateMeta" },
						h("p", { className: "dsh2001PlateTitle" },
							custom ? text("自定义底板", "Custom plate") : text("内置甬道底板", "Bundled corridor plate")),
						h("p", { className: "dsh2001PlateHint" },
							custom
								? text("图片已复制进插件存储，原文件删掉也不影响显示。", "The image is copied into plugin storage, so deleting the original file changes nothing.")
								: text("选一张你自己的图作为底板；不选就用内置的甬道图。", "Pick your own image, or keep the bundled corridor rendition.")))),
				h("div", { className: "dsh2001Actions" },
					h("button", { type: "button", className: "dsh2001Button", onClick: pick },
						text("选择图片…", "Choose image…")),
					h("button", {
						type: "button",
						className: "dsh2001Button",
						onClick: () => { void plate.reset(); },
						disabled: !custom,
					}, text("恢复内置底板", "Restore bundled plate")),
					h("input", {
						ref: input,
						type: "file",
						accept: "image/*",
						className: "dsh2001File",
						onChange: onFile,
					})),
				h("label", { className: "dsh2001Slider" },
					h("span", null, text("背景透明度", "Background opacity")),
					h("input", {
						type: "range",
						min: "5",
						max: "100",
						step: "1",
						value: String(percent),
						onChange: onOpacity,
					}),
					h("span", { className: "dsh2001SliderValue" }, percent + "%")),
				h("p", { className: "dsh2001Foot" },
					text(
						"背景透明度对内置底板和自选图片都有效、并会记住：调低就是让底板退到面板后面，调高就是让它更抢眼。"
						+ "界面面板本身也是半透明的，所以底板越亮、文字底面越花 —— 照片通常 55%~70% 最平衡。",
						"Background opacity applies to the bundled plate and to a picked image alike, and is remembered."
						+ " Lower it to push the plate behind the panels, raise it to make it louder. Panel surfaces are"
						+ " translucent too, so a photo usually sits best between 55% and 70%.")));
		}

		/**
		 * The viewport frame: one strip per screen edge, nothing else. Each
		 * carries its own `data-edge` for the geometry rules, and all four are
		 * pointer-transparent.
		 */
		function RainbowFrame() {
			const edges = ["top", "bottom", "left", "right"];
			return h(React.Fragment, null,
				edges.map((edge) => h("div", { key: edge, className: "dsh2001FrameEdge", "data-edge": edge })));
		}

		/**
		 * Insert the display stylesheet, updating an existing tag instead of
		 * stacking a second copy.
		 * @returns disposer removing exactly this plugin's style element.
		 */
		function installStyles() {
			const existing = document.querySelector(`style[${STYLE_ATTRIBUTE}]`);
			const style = existing ?? document.createElement("style");
			style.setAttribute(STYLE_ATTRIBUTE, PLUGIN_ID);
			style.textContent = CSS;
			if (existing === null) document.head.appendChild(style);
			return () => {
				style.remove();
			};
		}

		/**
		 * Publish the scoping attribute so the stylesheet and any future layer
		 * can address "the 2001 display is on" without inspecting this plugin.
		 * @returns disposer restoring the previous attribute value.
		 */
		function publishRootAttribute() {
			const root = document.documentElement;
			root.setAttribute(ROOT_ATTRIBUTE, "on");
			return () => {
				// Remove rather than restore: the attribute belongs to this plugin,
				// and only the live application's disposer can reach here, so leaving
				// a stale value behind would keep every scoped rule alive after unload.
				// (This is why the docstring above no longer claims the previous value.)
				root.removeAttribute(ROOT_ATTRIBUTE);
			};
		}

		/** Required services: the theme registry (token layer) and the slot registry. */
		const inject = ["theme", "slots"];

		/**
		 * The newest apply() in this document owns the document-level effects.
		 *
		 * A client bundle can be applied more than once per document — a rebuild
		 * re-imports it — and the OLD application's disposer used to run after the
		 * new one had already set things up: it removed the scope attribute and the
		 * stylesheet the live application depends on. The plugin then reported
		 * itself active while every rule of its stylesheet was inert, because every
		 * rule is scoped to that attribute. Toggling the plugin off and on only
		 * "fixed" it by producing a single live application.
		 */
		let applicationToken = 0;

		/**
		 * Stack this plugin's display layer over whatever theme is active, add
		 * its settings page, and hang the viewport frame on the shell overlay.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			const token = ++applicationToken;
			/** Run a document-level disposer only while this application is the live one. */
			const owned = (dispose) => () => {
				if (token === applicationToken) dispose();
			};
			// The token layer is deliberately NOT owned: it is a stack the theme
			// service keeps per layer, so a stale application's layer must still come
			// off on unload or disabling the plugin would leave its colours behind.
			ctx.effect(() => ctx.theme.overrideTokens(PLUGIN_ID, TOKENS), "2001-space-odyssey: display tokens");
			ctx.effect(() => owned(publishRootAttribute()), "2001-space-odyssey: scope attribute");
			ctx.effect(() => owned(installStyles()), "2001-space-odyssey: display stylesheet");
			ctx.effect(() => {
				void plate.hydrate();
				return owned(() => { plate.dispose(); });
			}, "2001-space-odyssey: plate store");
			// Self-heal: re-assert the scope once, shortly after apply. The token
			// above closes the known path by which it could go missing; this closes
			// any path not thought of, because "active but unstyled" is
			// indistinguishable from "broken" to whoever is looking at the screen.
			ctx.effect(() => {
				const timer = window.setTimeout(() => {
					if (token !== applicationToken) return;
					const root = document.documentElement;
					if (!root.hasAttribute(ROOT_ATTRIBUTE)) {
						root.setAttribute(ROOT_ATTRIBUTE, "on");
						root.style.setProperty("--dsh-2001-plate-opacity", "1");
					}
				}, 900);
				return () => { window.clearTimeout(timer); };
			}, "2001-space-odyssey: scope self-heal");
			ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-2001-space-odyssey",
				order: 30,
				label: () => text("2001 太空漫游", "2001: A Space Odyssey"),
			}, PlateSection)), "2001-space-odyssey: settings page");
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-2001-rainbow-frame",
				order: 0,
			}, RainbowFrame)), "2001-space-odyssey: viewport frame");
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = PLUGIN_ID;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
