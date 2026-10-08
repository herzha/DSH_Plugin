/**
 * DSH-Theme-OpenDisplay-Stalker — web client half.
 *
 * Display contract (why this plugin stays stackable and conflict-free):
 *
 *  1. It owns no shipped id. It ADDS one `settings.section` page and one
 *     `shell.overlay` entry, both under ids of its own, and otherwise injects a
 *     single stylesheet scoped to `html[data-dsh-stalker]`. Unloading removes
 *     both seats, the stylesheet, the root attribute and the portal node.
 *  2. It shares no class name, no attribute, no z-index band and no storage
 *     database with the other display plugins: everything here is prefixed
 *     `dshStalker` / `data-dsh-stalker`, and the cover takes z-index 9999.
 *  3. The cover is portalled onto document.body rather than drawn inside its
 *     seat, because `shell.overlay` is a z-index 20 layer: the shell's own
 *     caption menubar (z-index 1100) would otherwise paint over the splash.
 *  4. The opening frame is data, not a path: a picked image is copied into
 *     IndexedDB as a Blob and served back through an object URL, so deleting
 *     the original file cannot break the animation, and a missing or
 *     unreadable record falls back to the bundled frame.
 *  5. The sequence runs once per DOCUMENT. Opening a new window loads this
 *     bundle into a fresh document, which is exactly "a new window plays the
 *     animation"; an in-page re-render never replays it.
 */
window.__ModuleLoader__.load({
	id: "dsh-theme-open-display-stalker",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/** React and react-dom are baseline modules of the web module table. */
		const React = require("react");
		const createPortal = require("react-dom").createPortal;
		const h = React.createElement;

		/** Package id; also the identity of the seat entries this plugin adds. */
		const PLUGIN_ID = "dsh-theme-open-display-stalker";
		/** Attribute that scopes every rule this plugin injects. */
		const ROOT_ATTRIBUTE = "data-dsh-stalker";
		/** Marker on the injected stylesheet, so it can be found and removed. */
		const STYLE_ATTRIBUTE = "data-dsh-stalker-style";
		/** Marker on the portalled cover, for tests and for manual inspection. */
		const SCENE_ATTRIBUTE = "data-dsh-stalker-scene";
		/** The cover sits above every shell layer, including the caption menubar. */
		const SCENE_Z = 9999;

		/* ── the bundled opening frame ────────────────────────────────────────
		 * Regenerate with `node tools/gen-art.mjs`, which rewrites this line.
		 * It is inlined because the host serves no plugin assets: the client
		 * bundle is the only thing the shell fetches. */
		const POSTER_RENDITION = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDEwODAiIHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJza3kiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMDQwNjBiIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC41NSIgc3RvcC1jb2xvcj0iIzBhMTQyMCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxMjMwM2EiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Imdyb3VuZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxMDI0MmMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjQ1IiBzdG9wLWNvbG9yPSIjMDgxMzFhIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA0MDgwZCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iYW5vbWFseSIgY3g9IjAuNSIgY3k9IjAuNSIgcj0iMC41Ij4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjOGZmM2ZmIiBzdG9wLW9wYWNpdHk9IjAuNTUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjQ1IiBzdG9wLWNvbG9yPSIjMzFiNmQ4IiBzdG9wLW9wYWNpdHk9IjAuMjIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMGExYTIyIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9InZpZ25ldHRlIiBjeD0iMC41IiBjeT0iMC40NiIgcj0iMC43MiI+CiAgICAgIDxzdG9wIG9mZnNldD0iMC41NSIgc3RvcC1jb2xvcj0iIzAwMDAwMCIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwMDAwMCIgc3RvcC1vcGFjaXR5PSIwLjcyIi8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgogICAgPHBhdHRlcm4gaWQ9ImR1c3QiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBmaWxsPSIjZGZmMmZmIj4KICAgICAgPGNpcmNsZSBjeD0iMzIuMyIgY3k9IjE4NS45IiByPSIwLjYiLz48Y2lyY2xlIGN4PSIxNjkuOSIgY3k9Ijg3LjciIHI9IjEuMSIvPjxjaXJjbGUgY3g9IjEwLjUiIGN5PSI2NS4xIiByPSIwLjYiLz48Y2lyY2xlIGN4PSI3My44IiBjeT0iNDUuNiIgcj0iMC43Ii8+PGNpcmNsZSBjeD0iNTkuMSIgY3k9Ijg3LjEiIHI9IjAuNyIvPjxjaXJjbGUgY3g9IjIzNy43IiBjeT0iMTM2LjkiIHI9IjAuNyIvPjxjaXJjbGUgY3g9Ijk0LjEiIGN5PSI5Ni42IiByPSIwLjkiLz48Y2lyY2xlIGN4PSIxMzYiIGN5PSIxOTYuOCIgcj0iMC44Ii8+PGNpcmNsZSBjeD0iMjMwLjEiIGN5PSIyMTAuNCIgcj0iMC43Ii8+CiAgICA8L3BhdHRlcm4+CiAgICA8cGF0dGVybiBpZD0iZHVzdDIiIHdpZHRoPSI0MjAiIGhlaWdodD0iNDIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBmaWxsPSIjZmZmZmZmIj4KICAgICAgPGNpcmNsZSBjeD0iMzI5LjMiIGN5PSIzMTkuNiIgcj0iMS4zIi8+PGNpcmNsZSBjeD0iMTI1LjYiIGN5PSIzMjYuNiIgcj0iMS4zIi8+PGNpcmNsZSBjeD0iMjQ2LjYiIGN5PSIzNDAuNSIgcj0iMS42Ii8+PGNpcmNsZSBjeD0iMjU2LjQiIGN5PSIyMjguMSIgcj0iMS43Ii8+CiAgICA8L3BhdHRlcm4+CiAgICA8cGF0dGVybiBpZD0ic2NhbiIgd2lkdGg9IjQiIGhlaWdodD0iNCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9IiM3ZmU2ZmYiIG9wYWNpdHk9IjAuMDUiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CgogIDxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9InVybCgjc2t5KSIvPgogIDxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjY0MCIgZmlsbD0idXJsKCNkdXN0KSIgb3BhY2l0eT0iMC41Ii8+CiAgPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iNjQwIiBmaWxsPSJ1cmwoI2R1c3QyKSIgb3BhY2l0eT0iMC43NSIvPgoKICA8IS0tIHRoZSBhbm9tYWx5OiB0aGUgb25seSB3YXJtLWNvb2wgbGlnaHQgc291cmNlIGluIHRoZSBmcmFtZSAtLT4KICA8ZWxsaXBzZSBjeD0iOTYwIiBjeT0iNjAwIiByeD0iNjIwIiByeT0iMzAwIiBmaWxsPSJ1cmwoI2Fub21hbHkpIi8+CiAgPGVsbGlwc2UgY3g9Ijk2MCIgY3k9IjYyMCIgcng9IjE1MCIgcnk9IjYwIiBmaWxsPSIjYzlmN2ZmIiBvcGFjaXR5PSIwLjEwIi8+CgogIDwhLS0gcmlkZ2UgbGluZSwgdGhlbiB0aGUgZ3JvdW5kIHBsYW5lIC0tPgogIDxwYXRoIGQ9Ik0wIDY0MCBMMTgwIDYxNCBMNDIwIDYzMiBMNzAwIDYxMAogICAgICAgICAgIEw5NjAgNjI4IEwxMTgwIDYwNiBMMTQyMCA2MjYKICAgICAgICAgICBMMTcwMCA2MTIgTDE5MjAgNjM0IEwxOTIwIDY4MCBMMCA2ODAgWiIKICAgICAgICBmaWxsPSIjMDYwZDEzIiBvcGFjaXR5PSIwLjk1Ii8+CiAgPHJlY3QgeT0iNjQwIiB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI0NDAiIGZpbGw9InVybCgjZ3JvdW5kKSIvPgogIDxnIHN0cm9rZT0iIzJmN2Y5NiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjMwIj48bGluZSB4MT0iOTYwIiB5MT0iNjQwIiB4Mj0iLTM3NTkiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9Ii0zMzMwIiB5Mj0iMTA4MCIvPjxsaW5lIHgxPSI5NjAiIHkxPSI2NDAiIHgyPSItMjkwMSIgeTI9IjEwODAiLz48bGluZSB4MT0iOTYwIiB5MT0iNjQwIiB4Mj0iLTI0NzIiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9Ii0yMDQzIiB5Mj0iMTA4MCIvPjxsaW5lIHgxPSI5NjAiIHkxPSI2NDAiIHgyPSItMTYxNCIgeTI9IjEwODAiLz48bGluZSB4MT0iOTYwIiB5MT0iNjQwIiB4Mj0iLTExODUiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9Ii03NTYiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9Ii0zMjciIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjEwMiIgeTI9IjEwODAiLz48bGluZSB4MT0iOTYwIiB5MT0iNjQwIiB4Mj0iNTMxIiB5Mj0iMTA4MCIvPjxsaW5lIHgxPSI5NjAiIHkxPSI2NDAiIHgyPSI5NjAiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjEzODkiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjE4MTgiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjIyNDciIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjI2NzYiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjMxMDUiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjM1MzQiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjM5NjMiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjQzOTIiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjQ4MjEiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjUyNTAiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY0MCIgeDI9IjU2NzkiIHkyPSIxMDgwIi8+PC9nPgogIDxnIHN0cm9rZT0iIzJmN2Y5NiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjIyIj48bGluZSB4MT0iMCIgeTE9IjY0NiIgeDI9IjE5MjAiIHkyPSI2NDYiLz48bGluZSB4MT0iMCIgeTE9IjY1MSIgeDI9IjE5MjAiIHkyPSI2NTEiLz48bGluZSB4MT0iMCIgeTE9IjY1Ny43IiB4Mj0iMTkyMCIgeTI9IjY1Ny43Ii8+PGxpbmUgeDE9IjAiIHkxPSI2NjYuNyIgeDI9IjE5MjAiIHkyPSI2NjYuNyIvPjxsaW5lIHgxPSIwIiB5MT0iNjc4LjciIHgyPSIxOTIwIiB5Mj0iNjc4LjciLz48bGluZSB4MT0iMCIgeTE9IjY5NC44IiB4Mj0iMTkyMCIgeTI9IjY5NC44Ii8+PGxpbmUgeDE9IjAiIHkxPSI3MTYuNCIgeDI9IjE5MjAiIHkyPSI3MTYuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzQ1LjQiIHgyPSIxOTIwIiB5Mj0iNzQ1LjQiLz48bGluZSB4MT0iMCIgeTE9Ijc4NC4yIiB4Mj0iMTkyMCIgeTI9Ijc4NC4yIi8+PGxpbmUgeDE9IjAiIHkxPSI4MzYuMSIgeDI9IjE5MjAiIHkyPSI4MzYuMSIvPjxsaW5lIHgxPSIwIiB5MT0iOTA1LjgiIHgyPSIxOTIwIiB5Mj0iOTA1LjgiLz48bGluZSB4MT0iMCIgeTE9Ijk5OS4xIiB4Mj0iMTkyMCIgeTI9Ijk5OS4xIi8+PC9nPgoKICA8ZyBzdHJva2U9IiMwYTE1MjAiIHN0cm9rZS13aWR0aD0iMS42IiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjkyIj4KICAgIDxwYXRoIGQ9Ik00NTcgNjQwTDQ3MCAzOTBMNDgzIDY0MCIvPgogICAgPHBhdGggZD0iTTQ1Ni45IDYwNC4zTDQ4My4xIDYwNC4zIi8+PHBhdGggZD0iTTQ1Ni45IDYwNC4zTDQ4MS4zIDU2OC42Ii8+PHBhdGggZD0iTTQ1OC43IDU2OC42TDQ4MS4zIDU2OC42Ii8+PHBhdGggZD0iTTQ1OC43IDU2OC42TDQ3OS40IDUzMi45Ii8+PHBhdGggZD0iTTQ2MC42IDUzMi45TDQ3OS40IDUzMi45Ii8+PHBhdGggZD0iTTQ2MC42IDUzMi45TDQ3Ny42IDQ5Ny4xIi8+PHBhdGggZD0iTTQ2Mi40IDQ5Ny4xTDQ3Ny42IDQ5Ny4xIi8+PHBhdGggZD0iTTQ2Mi40IDQ5Ny4xTDQ3NS43IDQ2MS40Ii8+PHBhdGggZD0iTTQ2NC4zIDQ2MS40TDQ3NS43IDQ2MS40Ii8+PHBhdGggZD0iTTQ2NC4zIDQ2MS40TDQ3My45IDQyNS43Ii8+PHBhdGggZD0iTTQ2Ni4xIDQyNS43TDQ3My45IDQyNS43Ii8+CiAgICA8bGluZSB4MT0iNDcwIiB5MT0iMzkwIiB4Mj0iNDcwIiB5Mj0iMzQ0IiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDwvZz4KICA8Y2lyY2xlIGN4PSI0NzAiIGN5PSIzNDAiIHI9IjMuMiIgZmlsbD0iIzhlZjBmZiIgb3BhY2l0eT0iMC45Ii8+CiAgPGcgc3Ryb2tlPSIjMGExNTIwIiBzdHJva2Utd2lkdGg9IjEuNiIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC45MiI+CiAgICA8cGF0aCBkPSJNMTI3NCA2NDBMMTI5MCAzMDBMMTMwNiA2NDAiLz4KICAgIDxwYXRoIGQ9Ik0xMjc0LjMgNTkxLjRMMTMwNS43IDU5MS40Ii8+PHBhdGggZD0iTTEyNzQuMyA1OTEuNEwxMzAzLjQgNTQyLjkiLz48cGF0aCBkPSJNMTI3Ni42IDU0Mi45TDEzMDMuNCA1NDIuOSIvPjxwYXRoIGQ9Ik0xMjc2LjYgNTQyLjlMMTMwMS4xIDQ5NC4zIi8+PHBhdGggZD0iTTEyNzguOSA0OTQuM0wxMzAxLjEgNDk0LjMiLz48cGF0aCBkPSJNMTI3OC45IDQ5NC4zTDEyOTguOSA0NDUuNyIvPjxwYXRoIGQ9Ik0xMjgxLjEgNDQ1LjdMMTI5OC45IDQ0NS43Ii8+PHBhdGggZD0iTTEyODEuMSA0NDUuN0wxMjk2LjYgMzk3LjEiLz48cGF0aCBkPSJNMTI4My40IDM5Ny4xTDEyOTYuNiAzOTcuMSIvPjxwYXRoIGQ9Ik0xMjgzLjQgMzk3LjFMMTI5NC4zIDM0OC42Ii8+PHBhdGggZD0iTTEyODUuNyAzNDguNkwxMjk0LjMgMzQ4LjYiLz4KICAgIDxsaW5lIHgxPSIxMjkwIiB5MT0iMzAwIiB4Mj0iMTI5MCIgeTI9IjI1NCIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4KICA8L2c+CiAgPGNpcmNsZSBjeD0iMTI5MCIgY3k9IjI1MCIgcj0iMy4yIiBmaWxsPSIjYjZmZmUwIiBvcGFjaXR5PSIwLjkiLz4KICA8ZyBzdHJva2U9IiMwYTE1MjAiIHN0cm9rZS13aWR0aD0iMS42IiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjkyIj4KICAgIDxwYXRoIGQ9Ik0xNjExIDY0MEwxNjIwIDQ2MEwxNjI5IDY0MCIvPgogICAgPHBhdGggZD0iTTE2MTAuMyA2MTQuM0wxNjI5LjcgNjE0LjMiLz48cGF0aCBkPSJNMTYxMC4zIDYxNC4zTDE2MjguNCA1ODguNiIvPjxwYXRoIGQ9Ik0xNjExLjYgNTg4LjZMMTYyOC40IDU4OC42Ii8+PHBhdGggZD0iTTE2MTEuNiA1ODguNkwxNjI3LjEgNTYyLjkiLz48cGF0aCBkPSJNMTYxMi45IDU2Mi45TDE2MjcuMSA1NjIuOSIvPjxwYXRoIGQ9Ik0xNjEyLjkgNTYyLjlMMTYyNS45IDUzNy4xIi8+PHBhdGggZD0iTTE2MTQuMSA1MzcuMUwxNjI1LjkgNTM3LjEiLz48cGF0aCBkPSJNMTYxNC4xIDUzNy4xTDE2MjQuNiA1MTEuNCIvPjxwYXRoIGQ9Ik0xNjE1LjQgNTExLjRMMTYyNC42IDUxMS40Ii8+PHBhdGggZD0iTTE2MTUuNCA1MTEuNEwxNjIzLjMgNDg1LjciLz48cGF0aCBkPSJNMTYxNi43IDQ4NS43TDE2MjMuMyA0ODUuNyIvPgogICAgPGxpbmUgeDE9IjE2MjAiIHkxPSI0NjAiIHgyPSIxNjIwIiB5Mj0iNDE0IiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDwvZz4KICA8Y2lyY2xlIGN4PSIxNjIwIiBjeT0iNDEwIiByPSIzLjIiIGZpbGw9IiM4ZWYwZmYiIG9wYWNpdHk9IjAuOSIvPgoKICA8IS0tIHNjYW5saW5lcyBhbmQgdmlnbmV0dGUga2VlcCB0aGUgZnJhbWUgcmVhZGluZyBhcyBhIHNjcmVlbiwgbm90IGEgcGhvdG8gLS0+CiAgPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0idXJsKCNzY2FuKSIvPgogIDxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9InVybCgjdmlnbmV0dGUpIi8+Cjwvc3ZnPgo=";

		/** The one line the sequence reveals. */
		const TITLE = "欢迎来到未来";

		/* ── timing ───────────────────────────────────────────────────────────
		 * Everything is expressed as a fraction of the timeline, so the single
		 * duration knob below stretches the whole sequence coherently. */
		const DEFAULT_DURATION_MS = 3000;
		const MIN_DURATION_MS = 800;
		const MAX_DURATION_MS = 15000;
		/** The cover's fade at the end, natural and click-skipped alike. */
		const EXIT_MS = 200;
		/** A reduced-motion viewer should not sit through a three second hold. */
		const REDUCED_DURATION_MS = 700;
		/** Where the first character starts, and how far apart characters are. */
		const CHAR_FIRST_AT = 0.16;
		const CHAR_STEP = 0.03;
		/** How often the safety net looks for an overstaying cover. */
		const WATCHDOG_INTERVAL_MS = 1000;
		/** How far past the longest possible timeline a cover may survive. */
		const WATCHDOG_GRACE_MS = 4000;

		/* ── storage ──────────────────────────────────────────────────────── */
		const SPLASH_DATABASE = "dsh-open-display-stalker";
		const SPLASH_STORE = "splash";
		const IMAGE_KEY = "image";
		const DURATION_KEY = "duration";

		/* ── per-document state ───────────────────────────────────────────────
		 * Module scope, not storage: a new window evaluates this bundle in a new
		 * document and therefore starts false, while a soft re-render keeps it
		 * true. That is the whole "new window, new animation" mechanism. */
		let playedThisDocument = false;

		/* ── stylesheet ───────────────────────────────────────────────────────
		 * One namespaced block. The only selectors that leave this plugin's own
		 * class names are the scope attribute and the keyframes. */
		const CSS = `
/* ── the boot cover ───────────────────────────────────────────────────────
   Fixed, opaque and clickable: it swallows input for as long as it is up, and
   a single click finishes the sequence. It is portalled onto <body> so it takes
   the root stacking context; the seat that renders it cannot, because
   shell.overlay is a z-index 20 layer under the caption menubar. */
html[${ROOT_ATTRIBUTE}] .dshStalkerScene {
	position: fixed;
	inset: 0;
	z-index: ${SCENE_Z};
	display: grid;
	place-items: center;
	overflow: hidden;
	contain: layout paint;
	background-color: #04060b;
	cursor: pointer;
	pointer-events: auto;
	animation-name: dshStalkerExit;
	animation-duration: var(--dsh-stalker-exit);
	animation-timing-function: linear;
	animation-delay: calc(var(--dsh-stalker-ms) - var(--dsh-stalker-exit));
	animation-fill-mode: forwards;
}
/* The picked image (or the bundled frame), cover-cropped and woken up. */
html[${ROOT_ATTRIBUTE}] .dshStalkerArt {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	animation-name: dshStalkerArtIn;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.36);
	animation-timing-function: cubic-bezier(0.18, 0.86, 0.24, 1);
	animation-fill-mode: both;
}
/* A scrim so the reveal keeps its contrast over any photo. */
html[${ROOT_ATTRIBUTE}] .dshStalkerVeil {
	position: absolute;
	inset: 0;
	background-image:
		radial-gradient(120% 92% at 50% 46%, rgba(3,7,14,0) 28%, rgba(3,7,14,0.7) 76%, rgba(3,7,14,0.92) 100%),
		linear-gradient(180deg, rgba(3,7,14,0.58) 0%, rgba(3,7,14,0.1) 32%, rgba(3,7,14,0.88) 100%);
}
/* The one moving light: a band that sweeps the frame once. */
html[${ROOT_ATTRIBUTE}] .dshStalkerScan {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 34vh;
	opacity: 0;
	background-image: linear-gradient(180deg, rgba(127,230,255,0) 0%, rgba(127,230,255,0.09) 44%, rgba(233,252,255,0.4) 50%, rgba(127,230,255,0.09) 56%, rgba(127,230,255,0) 100%);
	animation-name: dshStalkerScan;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.5);
	animation-delay: calc(var(--dsh-stalker-ms) * 0.06);
	animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1);
	animation-fill-mode: both;
}
/* Scanlines and corner brackets: the frame reads as a screen, not a photo. */
html[${ROOT_ATTRIBUTE}] .dshStalkerLines {
	position: absolute;
	inset: 0;
	opacity: 0;
	background-image: repeating-linear-gradient(180deg, rgba(180,240,255,0.05) 0 1px, rgba(0,0,0,0) 1px 3px);
	animation-name: dshStalkerFadeIn;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.24);
	animation-fill-mode: both;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerHud {
	position: absolute;
	width: 56px;
	height: 56px;
	opacity: 0;
	border: 0 solid rgba(127,230,255,0.5);
	animation-name: dshStalkerFadeIn;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.2);
	animation-delay: calc(var(--dsh-stalker-ms) * 0.12);
	animation-fill-mode: both;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerHud[data-corner="tl"] { top: 26px; left: 26px; border-top-width: 1px; border-left-width: 1px; }
html[${ROOT_ATTRIBUTE}] .dshStalkerHud[data-corner="tr"] { top: 26px; right: 26px; border-top-width: 1px; border-right-width: 1px; }
html[${ROOT_ATTRIBUTE}] .dshStalkerHud[data-corner="bl"] { bottom: 26px; left: 26px; border-bottom-width: 1px; border-left-width: 1px; }
html[${ROOT_ATTRIBUTE}] .dshStalkerHud[data-corner="br"] { bottom: 26px; right: 26px; border-bottom-width: 1px; border-right-width: 1px; }

html[${ROOT_ATTRIBUTE}] .dshStalkerDeck {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: clamp(16px, 2.4vh, 30px);
	padding: 0 6vw;
	text-align: center;
}
/* The font is a stack, not a bundled face: a monospace gives the Latin and the
   digits the technical voice, and the CJK glyphs fall through to a clean sans.
   The tech read comes from tracking, weight, gradient and glow. */
html[${ROOT_ATTRIBUTE}] .dshStalkerTitle {
	margin: 0;
	display: flex;
	align-items: baseline;
	font-family: "Cascadia Mono", "JetBrains Mono", Consolas, ui-monospace, "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
	font-size: clamp(30px, 6.2vw, 92px);
	font-weight: 700;
	line-height: 1.08;
	letter-spacing: 0.06em;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerChar {
	display: inline-block;
	opacity: 0;
	color: #86d2ff;
	text-shadow:
		0 0 0.14em rgba(190,240,255,0.55),
		0 0 0.5em rgba(60,170,255,0.45),
		0 0 1.4em rgba(30,110,255,0.35);
	animation-name: dshStalkerCharIn;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.22);
	animation-delay: calc(var(--dsh-stalker-ms) * var(--dsh-stalker-char-at));
	animation-timing-function: cubic-bezier(0.16, 0.9, 0.3, 1);
	animation-fill-mode: both;
}
/* The blue is a metal, not a flat fill - but only where the browser can really
   paint a gradient inside glyphs. Without the guard a failed clip would leave
   transparent text, so the plain blue above stays the honest fallback. */
@supports ((background-clip: text) or (-webkit-background-clip: text)) {
	html[${ROOT_ATTRIBUTE}] .dshStalkerChar {
		background-image: linear-gradient(180deg, #f4fcff 0%, #a9e7ff 30%, #45a7ff 63%, #1a54d6 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}
}
html[${ROOT_ATTRIBUTE}] .dshStalkerRule {
	position: relative;
	width: min(52vw, 620px);
	height: 2px;
	overflow: hidden;
	opacity: 0;
	background-color: rgba(127,230,255,0.16);
	animation-name: dshStalkerFadeIn;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.12);
	animation-delay: calc(var(--dsh-stalker-ms) * 0.14);
	animation-fill-mode: both;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerRuleFill {
	position: absolute;
	inset: 0;
	transform: scaleX(0);
	transform-origin: left center;
	background-image: linear-gradient(90deg, rgba(70,168,255,0.2) 0%, #7fe6ff 62%, #f4fcff 100%);
	box-shadow: 0 0 12px rgba(127,230,255,0.55);
	animation-name: dshStalkerRuleFill;
	animation-duration: calc(var(--dsh-stalker-ms) * 0.78);
	animation-delay: calc(var(--dsh-stalker-ms) * 0.16);
	animation-timing-function: linear;
	animation-fill-mode: both;
}

/* Click-to-skip: snap every layer to the LAST frame, then run the same fade the
   natural ending uses. The exit keyframe is a second name on purpose - a
   distinct animation-name restarts the fade from zero, whereas merely moving
   the delay of an already-running animation is not reliable. */
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing {
	animation-name: dshStalkerExitNow;
	animation-delay: 0ms;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerArt,
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerChar {
	animation: none;
	opacity: 1;
	filter: none;
	transform: none;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerScan {
	animation: none;
	opacity: 0;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerLines,
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerHud,
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerRule {
	animation: none;
	opacity: 1;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerScene.is-finishing .dshStalkerRuleFill {
	animation: none;
	transform: scaleX(1);
}

@keyframes dshStalkerArtIn {
	from { opacity: 0; filter: blur(16px) saturate(0.8); transform: scale(1.06); }
	to { opacity: 1; filter: blur(0px) saturate(1); transform: scale(1); }
}
@keyframes dshStalkerCharIn {
	from { opacity: 0; filter: blur(12px); transform: translateY(0.22em) scale(1.08); }
	60% { opacity: 1; }
	to { opacity: 1; filter: blur(0px); transform: translateY(0) scale(1); }
}
@keyframes dshStalkerScan {
	from { transform: translateY(-120%); opacity: 0; }
	12% { opacity: 1; }
	88% { opacity: 1; }
	to { transform: translateY(360%); opacity: 0; }
}
@keyframes dshStalkerFadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}
@keyframes dshStalkerRuleFill {
	from { transform: scaleX(0); }
	to { transform: scaleX(1); }
}
@keyframes dshStalkerExit {
	from { opacity: 1; }
	to { opacity: 0; }
}
@keyframes dshStalkerExitNow {
	from { opacity: 1; }
	to { opacity: 0; }
}

/* A viewer who asked for less motion gets the finished frame, not a sequence. */
@media (prefers-reduced-motion: reduce) {
	html[${ROOT_ATTRIBUTE}] .dshStalkerScene {
		animation: none;
		opacity: 1;
	}
	html[${ROOT_ATTRIBUTE}] .dshStalkerArt,
	html[${ROOT_ATTRIBUTE}] .dshStalkerChar,
	html[${ROOT_ATTRIBUTE}] .dshStalkerLines,
	html[${ROOT_ATTRIBUTE}] .dshStalkerHud,
	html[${ROOT_ATTRIBUTE}] .dshStalkerRule {
		animation: none;
		opacity: 1;
		filter: none;
		transform: none;
	}
	html[${ROOT_ATTRIBUTE}] .dshStalkerRuleFill {
		animation: none;
		transform: scaleX(1);
	}
	html[${ROOT_ATTRIBUTE}] .dshStalkerScan {
		animation: none;
		opacity: 0;
	}
}

/* ── settings page: opening-frame picker ───────────────────────────────── */
html[${ROOT_ATTRIBUTE}] .dshStalkerPanel {
	display: flex;
	flex-direction: column;
	gap: 14px;
	max-width: 620px;
	color: var(--dsw-alias-label-primary);
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelRow {
	display: flex;
	gap: 14px;
	align-items: center;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelThumb {
	position: relative;
	flex: none;
	width: 168px;
	aspect-ratio: 16 / 9;
	border: 1px solid rgba(127,230,255,0.28);
	border-radius: 4px;
	overflow: hidden;
	background-color: rgba(3,6,12,0.75);
	box-shadow: inset 0 0 18px rgba(0,0,0,0.55);
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelThumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelMeta {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelTitle {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	line-height: 20px;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelHint {
	margin: 0;
	font-size: 12px;
	line-height: 18px;
	color: var(--dsw-alias-label-secondary);
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelActions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelButton {
	cursor: pointer;
	border: 1px solid rgba(127,230,255,0.3);
	border-radius: 4px;
	background-color: rgba(70,168,255,0.16);
	color: var(--dsw-alias-label-primary);
	padding: 6px 12px;
	font-size: 13px;
	line-height: 18px;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelButton:hover:not(:disabled) {
	background-color: rgba(70,168,255,0.28);
	border-color: rgba(127,230,255,0.55);
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelButton:disabled {
	cursor: default;
	opacity: 0.45;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelFile {
	display: none;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelField {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 13px;
	line-height: 18px;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelValue {
	min-width: 46px;
	font-variant-numeric: tabular-nums;
	color: #9fe8ff;
}
html[${ROOT_ATTRIBUTE}] .dshStalkerPanelFoot {
	margin: 0;
	font-size: 12px;
	line-height: 18px;
	color: var(--dsw-alias-label-secondary);
}
`;

		/* ── storage: the picked image and the duration ───────────────────────
		 * IndexedDB holds the image as a Blob, so the opening frame survives
		 * deleting the source file and never needs re-encoding. */
		const splashStore = (() => {
			let opening = null;
			function open() {
				if (opening === null) {
					opening = new Promise((resolve, reject) => {
						if (typeof indexedDB === "undefined" || indexedDB === null) {
							reject(new Error("indexedDB unavailable"));
							return;
						}
						const request = indexedDB.open(SPLASH_DATABASE, 1);
						request.onupgradeneeded = () => {
							const db = request.result;
							if (!db.objectStoreNames.contains(SPLASH_STORE)) db.createObjectStore(SPLASH_STORE);
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
					const transaction = db.transaction(SPLASH_STORE, mode);
					const store = transaction.objectStore(SPLASH_STORE);
					let carried;
					body(store, (value) => { carried = value; });
					transaction.oncomplete = () => resolve(carried);
					transaction.onerror = () => reject(transaction.error);
					transaction.onabort = () => reject(transaction.error);
				}));
			}
			return {
				read(key) {
					return run("readonly", (store, done) => {
						const request = store.get(key);
						request.onsuccess = () => done(request.result);
					}).then((record) => (record === undefined ? null : record), () => null);
				},
				write(key, value) {
					return run("readwrite", (store) => { store.put(value, key); }).then(() => true, () => false);
				},
				clear(key) {
					return run("readwrite", (store) => { store.delete(key); }).then(() => true, () => false);
				},
			};
		})();

		/** Locale without depending on the locale service: the shell sets <html lang>. */
		function text(zh, en) {
			const lang = document.documentElement.lang ?? "";
			return lang.toLowerCase().startsWith("zh") ? zh : en;
		}

		/* ── the opening frame ────────────────────────────────────────────── */
		const art = (() => {
			const listeners = new Set();
			let state = { objectUrl: "", custom: false };
			function publish() {
				for (const listener of Array.from(listeners)) listener();
			}
			function commit(next) {
				release(state.objectUrl);
				state = next;
				publish();
			}
			function release(url) {
				if (url === "") return;
				try { URL.revokeObjectURL(url); } catch (error) { /* already gone */ }
			}
			return {
				get() { return state; },
				/** What the cover should paint right now. */
				src() { return state.objectUrl !== "" ? state.objectUrl : POSTER_RENDITION; },
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				/** Restore the stored image; no record keeps the bundled frame. */
				hydrate() {
					return splashStore.read(IMAGE_KEY).then((blob) => {
						if (blob instanceof Blob) commit({ objectUrl: URL.createObjectURL(blob), custom: true });
					});
				},
				useFile(file) {
					// Show it either way: the animation has to work even when the
					// record could not be persisted, it just will not survive a
					// reload. The caller only needs to know which of the two
					// happened, so the reason is not swallowed.
					const show = () => commit({ objectUrl: URL.createObjectURL(file), custom: true });
					return splashStore.write(IMAGE_KEY, file).then(
						(saved) => { show(); return saved; },
						() => { show(); return false; });
				},
				reset() {
					commit({ objectUrl: "", custom: false });
					return splashStore.clear(IMAGE_KEY);
				},
				dispose() {
					release(state.objectUrl);
					state = { objectUrl: "", custom: false };
					listeners.clear();
				},
			};
		})();

		/* ── the timeline length ──────────────────────────────────────────── */
		const timing = (() => {
			const clamp = (value) => Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, Math.round(value)));
			let duration = DEFAULT_DURATION_MS;
			return {
				get() { return duration; },
				min: MIN_DURATION_MS,
				max: MAX_DURATION_MS,
				/** The length actually used: reduced motion shortens the hold. */
				effective() {
					const reduced = typeof matchMedia === "function"
						&& matchMedia("(prefers-reduced-motion: reduce)").matches;
					return reduced ? REDUCED_DURATION_MS : duration;
				},
				hydrate() {
					return splashStore.read(DURATION_KEY).then((value) => {
						if (typeof value === "number" && Number.isFinite(value)) duration = clamp(value);
					});
				},
				set(value) {
					duration = clamp(value);
					return splashStore.write(DURATION_KEY, duration);
				},
			};
		})();

		/**
		 * Replay requests, so the settings page can play the sequence on demand.
		 * The seat subscribes; firing resets the per-document flag first.
		 */
		const replay = (() => {
			const listeners = new Set();
			return {
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				fire() {
					playedThisDocument = false;
					for (const listener of Array.from(listeners)) listener();
				},
			};
		})();

		/**
		 * The sequence itself.
		 *
		 * Two ways out, and both end by unmounting: the configured timeline runs
		 * out, or a single pointer press finishes it. Finishing snaps every layer
		 * to the last frame and then plays the same fade the natural ending uses,
		 * which is what "jump to the final frame, then open DSH" means here - the
		 * full line of text is on screen at the moment the cover leaves.
		 */
		function SplashScene({ onClose }) {
			const [finishing, setFinishing] = React.useState(false);
			const [source, setSource] = React.useState(() => art.src());
			const closing = React.useRef(false);
			const natural = React.useRef(0);
			const exit = React.useRef(0);

			const finish = React.useCallback(() => {
				if (closing.current) return;
				closing.current = true;
				setFinishing(true);
				exit.current = window.setTimeout(onClose, EXIT_MS);
			}, [onClose]);

			React.useEffect(() => art.subscribe(() => { setSource(art.src()); }), []);

			React.useEffect(() => {
				playedThisDocument = true;
				natural.current = window.setTimeout(onClose, timing.effective());
				const onKey = (event) => { if (event.key === "Escape") finish(); };
				window.addEventListener("keydown", onKey);
				return () => {
					window.clearTimeout(natural.current);
					window.clearTimeout(exit.current);
					window.removeEventListener("keydown", onKey);
				};
			}, [onClose, finish]);

			const characters = Array.from(TITLE).map((character, index) => h("span", {
				key: String(index),
				className: "dshStalkerChar",
				style: { "--dsh-stalker-char-at": String(CHAR_FIRST_AT + index * CHAR_STEP) },
			}, character));

			return h("div", {
				className: "dshStalkerScene" + (finishing ? " is-finishing" : ""),
				[SCENE_ATTRIBUTE]: "",
				"data-born": String(Date.now()),
				"data-phase": finishing ? "finish" : "play",
				style: {
					"--dsh-stalker-ms": timing.effective() + "ms",
					"--dsh-stalker-exit": EXIT_MS + "ms",
				},
				onPointerDown: finish,
			},
				h("img", { className: "dshStalkerArt", src: source, alt: "", draggable: false }),
				h("div", { className: "dshStalkerVeil" }),
				h("div", { className: "dshStalkerScan" }),
				h("div", { className: "dshStalkerLines" }),
				["tl", "tr", "bl", "br"].map((corner) => h("span", {
					key: corner,
					className: "dshStalkerHud",
					"data-corner": corner,
				})),
				h("div", { className: "dshStalkerDeck" },
					h("h1", { className: "dshStalkerTitle" }, characters),
					h("div", { className: "dshStalkerRule" }, h("div", { className: "dshStalkerRuleFill" }))));
		}

		/**
		 * The seat entry. It plays once per document and renders through a portal
		 * so the cover escapes the z-index 20 overlay layer it is registered in.
		 *
		 * The replay token is the scene's key: replaying while the cover happens
		 * to be up (a settings click during those three seconds) has to restart
		 * the sequence, and a changed key remounts it instead of being a no-op.
		 */
		function OpenDisplaySeat() {
			const [playing, setPlaying] = React.useState(() => !playedThisDocument);
			const [token, setToken] = React.useState(0);
			React.useEffect(() => replay.subscribe(() => {
				setToken((value) => value + 1);
				setPlaying(true);
			}), []);
			if (!playing) return null;
			return createPortal(
				h(SplashScene, { key: String(token), onClose: () => { setPlaying(false); } }),
				document.body);
		}

		/** The settings page body: pick, drop or replay the opening frame. */
		function SplashSection() {
			const [snapshot, setSnapshot] = React.useState(art.get());
			const [duration, setDuration] = React.useState(timing.get());
			const input = React.useRef(null);
			React.useEffect(() => art.subscribe(() => { setSnapshot(art.get()); }), []);
			const custom = snapshot.custom;
			const pick = () => { if (input.current !== null) input.current.click(); };
			const onFile = (event) => {
				const files = event.target.files;
				const file = files !== null && files.length > 0 ? files[0] : null;
				event.target.value = "";
				if (file !== null) void art.useFile(file);
			};
			const onDuration = (event) => {
				const next = Number(event.target.value);
				setDuration(next);
				void timing.set(next);
			};

			return h("div", { className: "dshStalkerPanel" },
				h("div", { className: "dshStalkerPanelRow" },
					h("div", { className: "dshStalkerPanelThumb" },
						h("img", {
							src: custom && snapshot.objectUrl !== "" ? snapshot.objectUrl : POSTER_RENDITION,
							alt: "",
						})),
					h("div", { className: "dshStalkerPanelMeta" },
						h("p", { className: "dshStalkerPanelTitle" },
							custom ? text("自定义开机画面", "Custom opening frame") : text("内置开机画面", "Bundled opening frame")),
						h("p", { className: "dshStalkerPanelHint" },
							custom
								? text("图片已复制进插件存储，原文件删掉也不影响开机动画。", "The image is copied into plugin storage, so deleting the original file changes nothing.")
								: text("选一张你自己的图作为开机画面；不选就用内置的废土画面。", "Pick your own image, or keep the bundled wasteland frame.")))),
				h("div", { className: "dshStalkerPanelActions" },
					h("button", { type: "button", className: "dshStalkerPanelButton", onClick: pick },
						text("选择图片…", "Choose image…")),
					h("button", {
						type: "button",
						className: "dshStalkerPanelButton",
						onClick: () => { void art.reset(); },
						disabled: !custom,
					}, text("恢复内置画面", "Restore bundled frame")),
					h("button", {
						type: "button",
						className: "dshStalkerPanelButton",
						onClick: () => { replay.fire(); },
					}, text("重播开机动画", "Replay opening")),
					h("input", {
						ref: input,
						type: "file",
						accept: "image/*",
						className: "dshStalkerPanelFile",
						onChange: onFile,
					})),
				h("label", { className: "dshStalkerPanelField" },
					h("span", null, text("动画时长", "Sequence length")),
					h("input", {
						type: "range",
						min: String(timing.min),
						max: "10000",
						step: "100",
						value: String(duration),
						onChange: onDuration,
					}),
					h("span", { className: "dshStalkerPanelValue" }, (duration / 1000).toFixed(1) + " s")),
				h("p", { className: "dshStalkerPanelFoot" },
					text(
						"每次打开新窗口都会播一次（打开新窗口 = 新文档，所以是按窗口算，不是按整个应用算）。"
						+ "动画期间点一下鼠标即可跳到最后一帧、立刻进入界面，按 Esc 同样可以。"
						+ "系统开启「减少动态效果」时会直接显示最终画面。",
						"Every new window plays it once: a new window is a new document, so the sequence is per"
						+ " window rather than per app launch. A single click jumps to the last frame and opens"
						+ " the UI immediately; Escape does the same. With reduced motion enabled the finished"
						+ " frame is shown instead of the sequence.")));
		}

		/**
		 * Safety net.
		 *
		 * The cover is full screen and swallows input, so a sequence that somehow
		 * never finishes - a render error, a throttled timer, a bug in this file -
		 * must not be able to trap anyone in a window they cannot use. This
		 * watchdog removes any cover that outlives its timeline by a wide margin,
		 * and it depends on neither React nor this plugin's state machine: it only
		 * looks at the DOM and the timestamp the cover stamps on itself.
		 *
		 * It is reference-counted rather than one-per-application, because a
		 * document can apply this bundle twice (a rebuild re-imports it) and two
		 * watchdogs would simply be one to leak.
		 *
		 * @returns disposer releasing this application's hold on the watchdog.
		 */
		let watchdogHolders = 0;
		let watchdogTimer = 0;
		function installWatchdog() {
			watchdogHolders += 1;
			if (watchdogTimer === 0) {
				watchdogTimer = window.setInterval(() => {
				const covers = document.querySelectorAll("[" + SCENE_ATTRIBUTE + "]");
				if (covers.length === 0) return;
				const stamps = Array.from(covers).map((cover) => {
					const raw = Number(cover.getAttribute("data-born"));
					if (!Number.isFinite(raw) || raw <= 0) {
						// A cover without a stamp gets one now, so it is still bounded.
						const now = Date.now();
						cover.setAttribute("data-born", String(now));
						return now;
					}
					return raw;
				});
				if (Date.now() - Math.min.apply(null, stamps) <= MAX_DURATION_MS + WATCHDOG_GRACE_MS) return;
				// One stale cover already means the window is unusable, so the
				// whole batch goes rather than leaving a second one in the way.
				for (const cover of covers) cover.remove();
				}, WATCHDOG_INTERVAL_MS);
			}
			return () => {
				watchdogHolders -= 1;
				if (watchdogHolders <= 0 && watchdogTimer !== 0) {
					window.clearInterval(watchdogTimer);
					watchdogTimer = 0;
				}
			};
		}

		/**
		 * Insert the stylesheet, updating an existing tag instead of stacking a
		 * second copy.
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
		 * Publish the scoping attribute so the stylesheet and the portalled cover
		 * can be addressed without inspecting this plugin.
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

		/** Required services: the slot registry that hosts both seats. */
		const inject = ["slots"];

		/**
		 * The newest apply() in this document owns the document-level effects.
		 *
		 * A client bundle can be applied more than once per document — a rebuild
		 * re-imports it — and the OLD application's disposer used to run after the
		 * new one had already set things up: it removed the scope attribute and the
		 * stylesheet the live application depends on, leaving a plugin that reports
		 * itself active while every scoped rule is inert.
		 */
		let applicationToken = 0;

		/**
		 * Add the opening sequence and its settings page.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			const token = ++applicationToken;
			/** Run a document-level disposer only while this application is the live one. */
			const owned = (dispose) => () => {
				if (token === applicationToken) dispose();
			};
			ctx.effect(() => owned(publishRootAttribute()), "open-display-stalker: scope attribute");
			ctx.effect(() => owned(installStyles()), "open-display-stalker: stylesheet");
			ctx.effect(() => installWatchdog(), "open-display-stalker: cover watchdog");
			ctx.effect(() => {
				void art.hydrate();
				void timing.hydrate();
				return owned(() => { art.dispose(); });
			}, "open-display-stalker: splash storage");
			// Self-heal: re-assert the scope once, shortly after apply.
			ctx.effect(() => {
				const timer = window.setTimeout(() => {
					if (token !== applicationToken) return;
					const root = document.documentElement;
					if (!root.hasAttribute(ROOT_ATTRIBUTE)) root.setAttribute(ROOT_ATTRIBUTE, "on");
				}, 900);
				return () => { window.clearTimeout(timer); };
			}, "open-display-stalker: scope self-heal");
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-open-display-stalker",
				order: 100,
			}, OpenDisplaySeat)), "open-display-stalker: boot cover seat");
			ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-open-display-stalker",
				order: 40,
				label: () => text("开机动画", "Opening animation"),
			}, SplashSection)), "open-display-stalker: settings page");
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = PLUGIN_ID;
		return module.exports;
	},
});

//# sourceMappingURL=client.js.map
