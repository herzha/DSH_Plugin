/**
 * dsh-pet-robot — web client half.
 *
 * A wasteland robot that sits on the frame. It owns:
 *
 *   1. an optional task-completion sound (synthesised, no audio asset),
 *   2. a double-click balance readout, through the shell's own account Remote,
 *   3. a real window close, through the shell's shortcuts service,
 *   4. a welcome-screen lock it can raise and a single click can drop.
 *
 * Display contract (why this stays stackable and conflict-free):
 *
 *   - It replaces no shipped Slot. It ADDS one `shell.overlay` entry and one
 *     `settings.section` page, both under ids of its own, and injects a single
 *     stylesheet scoped to `html[data-dsh-pet]`. Unloading removes both seats,
 *     the stylesheet, the scope attribute and both portal nodes.
 *   - It shares no class name, attribute, id, storage database or z-index band
 *     with the other display plugins: everything is prefixed `dshPet` /
 *     `data-dsh-pet`, and its two floating surfaces take 9400 and 9990.
 *   - The pet and the lock cover are portalled onto document.body: the seat that
 *     hosts them lives in `shell.overlay`, a z-index 20 layer under the caption
 *     menubar, so anything drawn inside it is covered by the shell's own chrome.
 *   - It borrows capabilities instead of reimplementing them: `shortcuts` for
 *     the close, `remote.account` for the balance, and the seat's own
 *     `useSessionStatus` hook for completion. Each is called defensively, so a
 *     missing one degrades to a disabled button rather than a broken plugin.
 */
window.__ModuleLoader__.load({
	id: "dsh-pet-robot",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/** React and react-dom are baseline modules of the web module table. */
		const React = require("react");
		const createPortal = require("react-dom").createPortal;
		const h = React.createElement;

		/** Package id; also the identity of the seat entries this plugin adds. */
		const PLUGIN_ID = "dsh-pet-robot";
		/** Attribute that scopes every rule this plugin injects. */
		const ROOT_ATTRIBUTE = "data-dsh-pet";
		/** Marker on the injected stylesheet, so it can be found and removed. */
		const STYLE_ATTRIBUTE = "data-dsh-pet-style";
		/** Markers on the two floating surfaces, for tests and inspection. */
		const PET_ATTRIBUTE = "data-dsh-pet-robot";
		const LOCK_ATTRIBUTE = "data-dsh-pet-lock";
		/** The pet floats over the app; the lock covers everything but a boot splash. */
		const PET_Z = 9400;
		const LOCK_Z = 9990;

		/**
		 * Any session id, which is all the command Remote needs to authorize a call.
		 *
		 * The command itself is global and does not care which session it arrived
		 * through, so this only has to find one that exists: the status snapshot
		 * first, then whichever container the sessions snapshot happens to expose.
		 *
		 * @returns a session id, or undefined when the build exposes none.
		 */
		function sessionForCommand(report, sessions) {
			if (Array.isArray(report?.ids) && report.ids.length > 0) return report.ids[0];
			if (sessions === null || sessions === undefined || typeof sessions !== "object") return undefined;
			for (const key of ["order", "ids", "list", "items"]) {
				const value = sessions[key];
				if (Array.isArray(value) && value.length > 0) {
					const first = value[0];
					return typeof first === "string" ? first : first?.id;
				}
			}
			for (const key of ["byId", "sessions", "entities"]) {
				const value = sessions[key];
				if (value !== null && typeof value === "object") {
					const first = Object.keys(value)[0];
					if (first !== undefined) return first;
				}
			}
			return undefined;
		}

		/* ── the lock backdrop ────────────────────────────────────────────────
		 * Regenerate with `node tools/gen-art.mjs`, which rewrites this line.
		 * Inlined because the host serves no plugin assets. */
		const LOCK_RENDITION = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDEwODAiIHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJza3kiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMDUwNzBjIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC41IiBzdG9wLWNvbG9yPSIjMTIxNjFjIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzNhMmExYyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JvdW5kIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzJhMjExOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjAuNCIgc3RvcC1jb2xvcj0iIzE0MGYwYiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwODA2MDUiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImhhemUiIGN4PSIwLjUiIGN5PSIwLjUiIHI9IjAuNSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmYjc2NSIgc3RvcC1vcGFjaXR5PSIwLjQyIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC40IiBzdG9wLWNvbG9yPSIjYzk3NjJjIiBzdG9wLW9wYWNpdHk9IjAuMTYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMWExMjBjIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9InZpZ25ldHRlIiBjeD0iMC41IiBjeT0iMC40NiIgcj0iMC43NCI+CiAgICAgIDxzdG9wIG9mZnNldD0iMC41IiBzdG9wLWNvbG9yPSIjMDAwMDAwIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDAwMDAwIiBzdG9wLW9wYWNpdHk9IjAuOCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxwYXR0ZXJuIGlkPSJkdXN0IiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZmlsbD0iI2ZmZTZjNCI+CiAgICAgIDxjaXJjbGUgY3g9IjE0My40IiBjeT0iMTguMiIgcj0iMC42Ii8+PGNpcmNsZSBjeD0iMTY0LjciIGN5PSIxMzIuMSIgcj0iMC42Ii8+PGNpcmNsZSBjeD0iNTkuMiIgY3k9IjE2My4zIiByPSIwLjQiLz48Y2lyY2xlIGN4PSIxOTEuNCIgY3k9IjE1NS4xIiByPSIwLjUiLz48Y2lyY2xlIGN4PSI1MC4zIiBjeT0iMTkzIiByPSIwLjkiLz48Y2lyY2xlIGN4PSIxMjcuNiIgY3k9IjQ4LjQiIHI9IjAuNyIvPjxjaXJjbGUgY3g9IjczLjIiIGN5PSIxNjguNSIgcj0iMC44Ii8+PGNpcmNsZSBjeD0iOTYuNiIgY3k9IjIxIiByPSIwLjgiLz48Y2lyY2xlIGN4PSI3OS4xIiBjeT0iNy45IiByPSIwLjYiLz48Y2lyY2xlIGN4PSI5Mi42IiBjeT0iMTc2LjkiIHI9IjAuNiIvPgogICAgPC9wYXR0ZXJuPgogICAgPHBhdHRlcm4gaWQ9InNjYW4iIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZkOGEwIiBvcGFjaXR5PSIwLjA0NSIvPgogICAgPC9wYXR0ZXJuPgogIDwvZGVmcz4KCiAgPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0idXJsKCNza3kpIi8+CiAgPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iNjYwIiBmaWxsPSJ1cmwoI2R1c3QpIiBvcGFjaXR5PSIwLjQiLz4KICA8ZWxsaXBzZSBjeD0iOTYwIiBjeT0iNjMwIiByeD0iNzAwIiByeT0iMzMwIiBmaWxsPSJ1cmwoI2hhemUpIi8+CgogIDxwYXRoIGQ9Ik0wIDY2MCBMMjQwIDYyNiBMNTIwIDY0OCBMODIwIDYyMAogICAgICAgICAgIEwxMTIwIDY0NCBMMTQwMCA2MTYgTDE3MDAgNjQyIEwxOTIwIDYzMAogICAgICAgICAgIEwxOTIwIDcwNiBMMCA3MDYgWiIKICAgICAgICBmaWxsPSIjMGEwODA2IiBvcGFjaXR5PSIwLjk1Ii8+CiAgPHJlY3QgeT0iNjYwIiB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI0MjAiIGZpbGw9InVybCgjZ3JvdW5kKSIvPgogIDxnIHN0cm9rZT0iIzhhNWEyYSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjI2Ij48bGluZSB4MT0iOTYwIiB5MT0iNjYwIiB4Mj0iLTM5ODAiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9Ii0zNDg2IiB5Mj0iMTA4MCIvPjxsaW5lIHgxPSI5NjAiIHkxPSI2NjAiIHgyPSItMjk5MiIgeTI9IjEwODAiLz48bGluZSB4MT0iOTYwIiB5MT0iNjYwIiB4Mj0iLTI0OTgiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9Ii0yMDA0IiB5Mj0iMTA4MCIvPjxsaW5lIHgxPSI5NjAiIHkxPSI2NjAiIHgyPSItMTUxMCIgeTI9IjEwODAiLz48bGluZSB4MT0iOTYwIiB5MT0iNjYwIiB4Mj0iLTEwMTYiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9Ii01MjIiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9Ii0yOCIgeTI9IjEwODAiLz48bGluZSB4MT0iOTYwIiB5MT0iNjYwIiB4Mj0iNDY2IiB5Mj0iMTA4MCIvPjxsaW5lIHgxPSI5NjAiIHkxPSI2NjAiIHgyPSI5NjAiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjE0NTQiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjE5NDgiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjI0NDIiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjI5MzYiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjM0MzAiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjM5MjQiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjQ0MTgiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjQ5MTIiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjU0MDYiIHkyPSIxMDgwIi8+PGxpbmUgeDE9Ijk2MCIgeTE9IjY2MCIgeDI9IjU5MDAiIHkyPSIxMDgwIi8+PC9nPgogIDxnIHN0cm9rZT0iIzhhNWEyYSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjE4Ij48bGluZSB4MT0iMCIgeTE9IjY2OCIgeDI9IjE5MjAiIHkyPSI2NjgiLz48bGluZSB4MT0iMCIgeTE9IjY3NCIgeDI9IjE5MjAiIHkyPSI2NzQiLz48bGluZSB4MT0iMCIgeTE9IjY4MS45IiB4Mj0iMTkyMCIgeTI9IjY4MS45Ii8+PGxpbmUgeDE9IjAiIHkxPSI2OTIuNCIgeDI9IjE5MjAiIHkyPSI2OTIuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzA2LjIiIHgyPSIxOTIwIiB5Mj0iNzA2LjIiLz48bGluZSB4MT0iMCIgeTE9IjcyNC40IiB4Mj0iMTkyMCIgeTI9IjcyNC40Ii8+PGxpbmUgeDE9IjAiIHkxPSI3NDguNCIgeDI9IjE5MjAiIHkyPSI3NDguNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzgwLjIiIHgyPSIxOTIwIiB5Mj0iNzgwLjIiLz48bGluZSB4MT0iMCIgeTE9IjgyMi4xIiB4Mj0iMTkyMCIgeTI9IjgyMi4xIi8+PGxpbmUgeDE9IjAiIHkxPSI4NzcuNCIgeDI9IjE5MjAiIHkyPSI4NzcuNCIvPjxsaW5lIHgxPSIwIiB5MT0iOTUwLjQiIHgyPSIxOTIwIiB5Mj0iOTUwLjQiLz48bGluZSB4MT0iMCIgeTE9IjEwNDYuNyIgeDI9IjE5MjAiIHkyPSIxMDQ2LjciLz48L2c+CgogIDxnIHN0cm9rZT0iIzBiMTQxYSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjkiPgogICAgPHBhdGggZD0iTTI5MCA2NjBMMzMwIDM2MEwzNzAgNjYwIi8+CiAgICA8cGF0aCBkPSJNMzA0IDU1NUwzNTYgNTU1Ii8+CiAgICA8cGF0aCBkPSJNMzE0IDQ2NUwzNDYgNDY1Ii8+CiAgICA8cGF0aCBkPSJNMzMwIDM2MEwyNDIgNDA0Ii8+CiAgICA8cGF0aCBkPSJNMzMwIDM3MEw0MjYgNDE4Ii8+CiAgPC9nPgogIDxnIHN0cm9rZT0iIzBiMTQxYSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjkiPgogICAgPHBhdGggZD0iTTE0ODAgNjYwTDE1MjAgNDMwTDE1NjAgNjYwIi8+CiAgICA8cGF0aCBkPSJNMTQ5NCA1NzkuNUwxNTQ2IDU3OS41Ii8+CiAgICA8cGF0aCBkPSJNMTUwNCA1MTAuNUwxNTM2IDUxMC41Ii8+CiAgICA8cGF0aCBkPSJNMTUyMCA0MzBMMTQzMiA0NzQiLz4KICAgIDxwYXRoIGQ9Ik0xNTIwIDQ0MEwxNjE2IDQ4OCIvPgogIDwvZz4KCiAgPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0idXJsKCNzY2FuKSIvPgogIDxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9InVybCgjdmlnbmV0dGUpIi8+Cjwvc3ZnPgo=";

		/** The line the welcome screen keeps, matching the opening animation. */
		const WELCOME = "欢迎来到未来";

		/* ── the account Remote ───────────────────────────────────────────────
		 * The metadata shape is the shell's own AccountClientMetadata. The
		 * desktop bridge knows the real client build; the literal is what this
		 * plugin was written against and is only a fallback. */
		const FALLBACK_CLIENT_VERSION = "0.2.0-rc.2";

		/* ── session states ───────────────────────────────────────────────────
		 * The shell publishes one entry per session, and an entry is an OBJECT:
		 * `{ running, pendingInteraction, completionUnread }`. Reading it as the
		 * string "running" is what made the completion sound never fire, so both
		 * the object shape and a plain string are accepted here.
		 *
		 * "The app needs my input" is exactly two edges: a turn that was running
		 * and stopped, or a question that started waiting for an answer. */
		const RUNNING = "running";
		/** How long the robot stays pleased after a task lands. */
		const CELEBRATE_MS = 4000;

		/** @returns the flags this plugin cares about, from any entry shape. */
		function readStatus(entry) {
			if (entry === null || entry === undefined) return { running: false, pending: false, unread: false };
			if (typeof entry === "string") return { running: entry === RUNNING, pending: false, unread: false };
			if (typeof entry !== "object") return { running: false, pending: false, unread: false };
			return {
				running: entry.running === true || entry.status === RUNNING || entry.phase === RUNNING,
				pending: entry.pendingInteraction === true,
				unread: entry.completionUnread === true,
			};
		}

		/**
		 * The shell publishes its status snapshot as a **Map**, not a plain object
		 * (`sameSessionStatus` walks it with `size`/`get`), so `Object.entries` on it
		 * yields nothing at all — which is why neither the sound nor the bubble ever
		 * fired. Both containers are accepted here.
		 *
		 * @returns an array of [sessionId, entry] pairs.
		 */
		function statusEntries(snapshot) {
			if (snapshot === null || snapshot === undefined) return [];
			if (typeof snapshot.entries === "function") return Array.from(snapshot.entries());
			if (typeof snapshot === "object") return Object.entries(snapshot);
			return [];
		}

		/** @returns the container kind, for the settings page's read-out. */
		function statusShape(snapshot) {
			if (snapshot === null || snapshot === undefined) return "none";
			if (typeof snapshot.entries === "function") return "map";
			return typeof snapshot;
		}

		/**
		 * The last status snapshot this plugin saw, published for the settings page.
		 *
		 * It exists because "the sound did not play" has two very different causes —
		 * the trigger never fired, or the audio never started — and guessing between
		 * them costs a round trip. This makes the trigger observable.
		 */
		const statusReport = (() => {
			const listeners = new Set();
			let state = { shape: "none", entries: 0, running: 0, pending: 0, fired: 0, last: "", ids: [] };
			return {
				get() { return state; },
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				publish(next) {
					state = next;
					for (const listener of Array.from(listeners)) listener();
				},
			};
		})();

		/* ── sounds ───────────────────────────────────────────────────────── */
		const SOUNDS = [
			{ id: "off", zh: "关闭", en: "Off" },
			{ id: "beep", zh: "电子哔声", en: "Digital beep" },
			{ id: "clunk", zh: "机械咔哒", en: "Mech clunk" },
			{ id: "chime", zh: "清脆铃声", en: "Bright chime" },
		];
		const DEFAULT_SOUND = "beep";
		/** Master gain for every synthesised sound. */
		const SOUND_GAIN = 0.22;

		/* ── pet geometry ─────────────────────────────────────────────────── */
		const DEFAULT_SCALE = 1;
		const MIN_SCALE = 0.7;
		const MAX_SCALE = 1.6;
		/** Where the robot parks before it is ever dragged. */
		const DEFAULT_POSITION = { right: 30, bottom: 104 };
		/** Half the robot's footprint, so a dragged position stays on screen. */
		const PET_INSET = 8;
		/** How far a press must travel before it counts as a drag. */
		const DRAG_THRESHOLD = 4;

		/* ── the two ways out of the app ──────────────────────────────────────
		 * "Stop the task" is the composer's own stop action, so it is pressed
		 * where it lives: this build exposes no client service for it.
		 * "End DSH" has to reach the main process, and the only channel a page has
		 * is its own URL — the host half watches for this marker. If the shell
		 * never answers, the panel says so and closes the window instead. */
		const STOP_LABELS = ["停止生成", "Stop generating"];
		/**
		 * Anything that puts a decision in front of the viewer.
		 *
		 * These are the app's own markers for the surfaces that take over the
		 * composer or the conversation until an answer arrives: a Host permission
		 * request, a question set, and a plan review. Watching for them by marker
		 * means an approval rings the bell exactly like a finished turn does, and
		 * that no status field has to be right for it to work.
		 */
		const PENDING_SELECTORS = [
			"[data-approval-key]",
			"[data-question-key]",
			"[data-plan-review-key]",
		];
		/** The host half registers this command; this half only asks for it. */
		const QUIT_COMMAND = "quitdsh";
		const QUIT_FALLBACK_MS = 2600;
		/** Two triggers must not ring twice for one turn. */
		const RING_COOLDOWN_MS = 1500;
		/**
		 * A press that starts on one of these belongs to that control, not to the
		 * drag. Without this check the wrapper captures the pointer, which
		 * retargets the pointerup to the wrapper itself — and the control's click
		 * then never fires, so every button in the tool bar looks dead.
		 */
		const INTERACTIVE = "button, input, textarea, select, a, [role='button']";

		/* ── storage ──────────────────────────────────────────────────────── */
		const PET_DATABASE = "dsh-pet-robot";
		const PET_STORE = "pet";
		const SETTINGS_KEY = "settings";
		const POSITION_KEY = "position";
		const LOCK_IMAGE_KEY = "lock-image";

		/* ── stylesheet ───────────────────────────────────────────────────────
		 * One namespaced block. Nothing here may collide with the sibling
		 * display plugins, so every local name starts with dshPet. */
		const CSS = `
/* ── the robot ────────────────────────────────────────────────────────────
   Portalled onto <body>: the shell.overlay layer is z-index 20, so a pet drawn
   inside it would be covered by the caption menubar once dragged upwards.

   Every surface below re-states colour, font and text-shadow instead of
   inheriting them. The pet lives on <body>, where a display plugin's own
   stylesheet and token layer also land, so an inherited text-shadow or a
   restyled label token would otherwise bleed into the robot. Stating them here
   is what keeps this plugin isolated rather than merely namespaced. */
html[${ROOT_ATTRIBUTE}] .dshPetRobot {
	position: fixed;
	z-index: ${PET_Z};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
	color: #ffe6c4;
	font-family: "Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
	font-size: 13px;
	font-weight: 400;
	font-style: normal;
	line-height: 19px;
	letter-spacing: normal;
	text-align: center;
	text-shadow: none;
	text-transform: none;
	background: none;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-dragging="true"] {
	cursor: grabbing;
}
html[${ROOT_ATTRIBUTE}] .dshPetFigure {
	position: relative;
	display: block;
	width: calc(96px * var(--dsh-pet-scale));
	height: auto;
	cursor: grab;
	filter: drop-shadow(0 10px 14px rgba(0,0,0,0.55));
}
html[${ROOT_ATTRIBUTE}] .dshPetFigure:active {
	cursor: grabbing;
}
/* Idle life: the whole robot breathes, the antenna sways, the treads tick. */
html[${ROOT_ATTRIBUTE}] .dshPetBob {
	transform-origin: 50% 100%;
	animation: dshPetBob 3.6s ease-in-out infinite;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-mood="busy"] .dshPetBob {
	animation-duration: 1.5s;
}
html[${ROOT_ATTRIBUTE}] .dshPetAntenna {
	transform-origin: 50% 100%;
	animation: dshPetSway 4.4s ease-in-out infinite;
}
html[${ROOT_ATTRIBUTE}] .dshPetEye {
	animation: dshPetBlink 5.2s steps(1, end) infinite;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-mood="busy"] .dshPetEye {
	animation-duration: 1.1s;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-mood="done"] .dshPetBob {
	animation: dshPetHop 0.72s ease-in-out 3;
}
/* The mood ring behind the head doubles as the status light. */
html[${ROOT_ATTRIBUTE}] .dshPetAura {
	fill: rgba(255,178,84,0.35);
	animation: dshPetPulse 3.6s ease-in-out infinite;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-mood="busy"] .dshPetAura {
	fill: rgba(110,214,255,0.42);
	animation-duration: 1.5s;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-mood="done"] .dshPetAura {
	fill: rgba(150,255,190,0.5);
	animation-duration: 0.6s;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot[data-mood="error"] .dshPetAura {
	fill: rgba(255,110,96,0.5);
}

/* ── the tool bar ─────────────────────────────────────────────────────────
   Hidden until hover or focus, so the pet is quiet when it is not wanted. */
html[${ROOT_ATTRIBUTE}] .dshPetNotice {
	padding: 3px 10px;
	border: 1px solid rgba(150,255,190,0.55);
	border-radius: 999px;
	background-color: rgba(10,26,18,0.92);
	color: #d6ffe0;
	font-size: 12px;
	font-weight: 600;
	line-height: 18px;
	letter-spacing: 0.04em;
	white-space: nowrap;
	box-shadow: 0 0 14px rgba(120,214,140,0.35);
	animation: dshPetNoticeIn 260ms ease-out both;
}
/* A question and an approval are different asks, so they do not share the
   completion's green: cyan for "type something", amber for "decide something". */
html[${ROOT_ATTRIBUTE}] .dshPetNotice[data-kind="input"] {
	border-color: rgba(120,214,255,0.6);
	background-color: rgba(10,20,30,0.92);
	color: #bfe6ff;
	box-shadow: 0 0 14px rgba(120,196,255,0.35);
}
html[${ROOT_ATTRIBUTE}] .dshPetNotice[data-kind="approve"] {
	border-color: rgba(255,178,84,0.65);
	background-color: rgba(30,20,10,0.94);
	color: #ffd08a;
	box-shadow: 0 0 16px rgba(255,178,84,0.4);
}
/* The "watch unavailable" badge reads as a warning, not as a completion. */
html[${ROOT_ATTRIBUTE}] .dshPetNotice[data-warn="true"] {
	border-color: rgba(255,178,84,0.6);
	background-color: rgba(30,20,10,0.92);
	color: #ffd08a;
	box-shadow: 0 0 14px rgba(255,178,84,0.3);
}
@keyframes dshPetNoticeIn {
	from { opacity: 0; transform: translateY(6px) scale(0.94); }
	to { opacity: 1; transform: translateY(0) scale(1); }
}
/* One full-width, zero-height item forces the line break after the third button,
   so the five controls read as three and two with both rows centred. Flex-wrap
   alone decides that split by measuring widths, which produced four and one. */
html[${ROOT_ATTRIBUTE}] .dshPetBarBreak {
	flex-basis: 100%;
	height: 0;
}
html[${ROOT_ATTRIBUTE}] .dshPetBar {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 4px;
	padding: 4px;
	border: 1px solid rgba(255,178,84,0.35);
	border-radius: 6px;
	background-color: rgba(14,11,8,0.9);
	box-shadow: 0 6px 18px rgba(0,0,0,0.55);
	opacity: 0;
	transform: translateY(4px);
	pointer-events: none;
	transition: opacity 140ms ease, transform 140ms ease;
}
html[${ROOT_ATTRIBUTE}] .dshPetRobot:hover .dshPetBar,
html[${ROOT_ATTRIBUTE}] .dshPetRobot:focus-within .dshPetBar {
	opacity: 1;
	transform: translateY(0);
	pointer-events: auto;
}
html[${ROOT_ATTRIBUTE}] .dshPetButton {
	cursor: pointer;
	border: 1px solid rgba(255,178,84,0.28);
	border-radius: 4px;
	background-color: rgba(255,178,84,0.12);
	color: #ffe6c4;
	padding: 3px 8px;
	font-size: 12px;
	line-height: 18px;
	white-space: nowrap;
}
html[${ROOT_ATTRIBUTE}] .dshPetButton:hover:not(:disabled) {
	background-color: rgba(255,178,84,0.26);
	border-color: rgba(255,178,84,0.6);
}
html[${ROOT_ATTRIBUTE}] .dshPetButton:disabled {
	cursor: default;
	opacity: 0.4;
}
/* The close button arms first: shutting the window is not undoable. */
html[${ROOT_ATTRIBUTE}] .dshPetButton[data-armed="true"] {
	background-color: rgba(255,86,72,0.28);
	border-color: rgba(255,86,72,0.75);
	color: #ffd9d4;
}
/* The sound switch shows which way it currently is, so "off" is never a guess. */
html[${ROOT_ATTRIBUTE}] .dshPetButton[data-on="true"] {
	background-color: rgba(120,214,140,0.18);
	border-color: rgba(120,214,140,0.6);
	color: #d6ffe0;
}
html[${ROOT_ATTRIBUTE}] .dshPetButton[data-on="false"] {
	background-color: rgba(255,255,255,0.06);
	border-color: rgba(255,255,255,0.18);
	color: rgba(255,230,196,0.6);
}

/* ── the balance card ─────────────────────────────────────────────────── */
html[${ROOT_ATTRIBUTE}] .dshPetCard {
	position: fixed;
	z-index: ${PET_Z};
	width: 232px;
	padding: 12px 14px;
	border: 1px solid rgba(255,178,84,0.4);
	border-radius: 8px;
	background-color: rgba(14,11,8,0.95);
	background-image: none;
	box-shadow: 0 14px 34px rgba(0,0,0,0.62);
	color: #ffe6c4;
	font-family: "Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
	font-size: 13px;
	font-weight: 400;
	font-style: normal;
	line-height: 19px;
	letter-spacing: normal;
	text-align: left;
	text-shadow: none;
	text-transform: none;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardHead {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	margin-bottom: 8px;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardTitle {
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.06em;
	color: #ffd08a;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardTotal {
	margin: 0 0 8px;
	font-size: 26px;
	font-weight: 700;
	line-height: 30px;
	color: #ffd08a;
	text-shadow: 0 0 14px rgba(255,178,84,0.35);
	font-variant-numeric: tabular-nums;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardList {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 2px 10px;
	margin: 0;
	color: rgba(255,230,196,0.82);
}
html[${ROOT_ATTRIBUTE}] .dshPetCardList dt {
	margin: 0;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardList dd {
	margin: 0;
	text-align: right;
	font-variant-numeric: tabular-nums;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardNote {
	margin: 8px 0 0;
	color: rgba(255,230,196,0.62);
	font-size: 12px;
	line-height: 17px;
}
html[${ROOT_ATTRIBUTE}] .dshPetCardActions {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 6px;
	margin-top: 10px;
}
/* The close panel carries three ways out plus cancel, so it needs more room than
   the balance readout and has to wrap instead of overflowing its own border. */
html[${ROOT_ATTRIBUTE}] .dshPetCard[data-dsh-pet-close] {
	width: 320px;
}
html[${ROOT_ATTRIBUTE}] .dshPetCard[data-dsh-pet-close] .dshPetButton {
	padding: 4px 10px;
	font-size: 12px;
	line-height: 17px;
}

/* ── the lock cover ───────────────────────────────────────────────────────
   The welcome screen, reusable: same backdrop family and the same line, but a
   single click drops it instead of skipping an animation. */
html[${ROOT_ATTRIBUTE}] .dshPetLock {
	position: fixed;
	inset: 0;
	z-index: ${LOCK_Z};
	display: grid;
	place-items: center;
	overflow: hidden;
	cursor: pointer;
	pointer-events: auto;
	background-color: #06070b;
	background-image: none;
	color: #ffe6c4;
	text-shadow: none;
}
html[${ROOT_ATTRIBUTE}] .dshPetLockArt {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	animation: dshPetLockIn 900ms ease-out both;
}
html[${ROOT_ATTRIBUTE}] .dshPetLockVeil {
	position: absolute;
	inset: 0;
	background-image:
		radial-gradient(120% 92% at 50% 48%, rgba(4,5,9,0) 26%, rgba(4,5,9,0.72) 76%, rgba(4,5,9,0.94) 100%),
		linear-gradient(180deg, rgba(4,5,9,0.6) 0%, rgba(4,5,9,0.16) 34%, rgba(4,5,9,0.9) 100%);
}
html[${ROOT_ATTRIBUTE}] .dshPetLockDeck {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18px;
	padding: 0 6vw;
	text-align: center;
}
html[${ROOT_ATTRIBUTE}] .dshPetLockTitle {
	margin: 0;
	display: flex;
	font-family: "Cascadia Mono", "JetBrains Mono", Consolas, ui-monospace, "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
	font-size: clamp(30px, 6.2vw, 92px);
	font-weight: 700;
	line-height: 1.08;
	letter-spacing: 0.06em;
	color: #86d2ff;
	text-shadow:
		0 0 0.14em rgba(190,240,255,0.55),
		0 0 0.5em rgba(60,170,255,0.45),
		0 0 1.4em rgba(30,110,255,0.35);
	animation: dshPetLockTitle 1100ms ease-out both;
}
@supports ((background-clip: text) or (-webkit-background-clip: text)) {
	html[${ROOT_ATTRIBUTE}] .dshPetLockTitle {
		background-image: linear-gradient(180deg, #f4fcff 0%, #a9e7ff 30%, #45a7ff 63%, #1a54d6 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}
}
@keyframes dshPetBob {
	0%, 100% { transform: translateY(0) rotate(0deg); }
	50% { transform: translateY(-3px) rotate(-0.6deg); }
}
@keyframes dshPetHop {
	0%, 100% { transform: translateY(0); }
	35% { transform: translateY(-10px); }
	70% { transform: translateY(0); }
}
@keyframes dshPetSway {
	0%, 100% { transform: rotate(-4deg); }
	50% { transform: rotate(4deg); }
}
@keyframes dshPetBlink {
	0%, 92%, 100% { opacity: 1; }
	94%, 97% { opacity: 0.15; }
}
@keyframes dshPetPulse {
	0%, 100% { opacity: 0.35; }
	50% { opacity: 0.75; }
}
@keyframes dshPetLockIn {
	from { opacity: 0; filter: blur(14px); transform: scale(1.04); }
	to { opacity: 1; filter: blur(0); transform: scale(1); }
}
@keyframes dshPetLockTitle {
	from { opacity: 0; filter: blur(12px); transform: translateY(0.16em); }
	to { opacity: 1; filter: blur(0); transform: translateY(0); }
}
/* A viewer who asked for less motion gets a still robot and a still cover. */
@media (prefers-reduced-motion: reduce) {
	html[${ROOT_ATTRIBUTE}] .dshPetBob,
	html[${ROOT_ATTRIBUTE}] .dshPetAntenna,
	html[${ROOT_ATTRIBUTE}] .dshPetEye,
	html[${ROOT_ATTRIBUTE}] .dshPetAura,
	html[${ROOT_ATTRIBUTE}] .dshPetLockArt,
	html[${ROOT_ATTRIBUTE}] .dshPetLockTitle {
		animation: none;
	}
}

/* ── settings page ─────────────────────────────────────────────────────── */
html[${ROOT_ATTRIBUTE}] .dshPetPanel {
	display: flex;
	flex-direction: column;
	gap: 14px;
	max-width: 620px;
	/* Same reasoning as the floating surfaces: this page is rendered inside the
	   app's settings column, where a display plugin's token layer also applies,
	   so it states its own palette instead of inheriting one. */
	color: #ffe6c4;
	font-family: "Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
	font-size: 13px;
	font-weight: 400;
	font-style: normal;
	line-height: 19px;
	letter-spacing: normal;
	text-align: left;
	text-shadow: none;
	text-transform: none;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelRow {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelThumb {
	position: relative;
	flex: none;
	width: 168px;
	aspect-ratio: 16 / 9;
	border: 1px solid rgba(255,178,84,0.35);
	border-radius: 4px;
	overflow: hidden;
	background-color: rgba(3,6,12,0.75);
	box-shadow: inset 0 0 18px rgba(0,0,0,0.55);
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelThumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelMeta {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelFile {
	display: none;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelTitle {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	line-height: 20px;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelHint {
	margin: 0;
	font-size: 12px;
	line-height: 18px;
	color: rgba(255,230,196,0.72);
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelChoice {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border: 1px solid rgba(255,178,84,0.3);
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelChoice[data-selected="true"] {
	background-color: rgba(255,178,84,0.2);
	border-color: rgba(255,178,84,0.7);
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelButton {
	cursor: pointer;
	border: 1px solid rgba(255,178,84,0.3);
	border-radius: 4px;
	background-color: rgba(255,178,84,0.14);
	color: #ffe6c4;
	padding: 6px 12px;
	font-size: 13px;
	line-height: 18px;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelButton:hover:not(:disabled) {
	background-color: rgba(255,178,84,0.28);
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelButton:disabled {
	cursor: default;
	opacity: 0.45;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelValue {
	min-width: 46px;
	font-variant-numeric: tabular-nums;
	color: #ffd08a;
}
html[${ROOT_ATTRIBUTE}] .dshPetPanelFoot {
	margin: 0;
	font-size: 12px;
	line-height: 18px;
	color: rgba(255,230,196,0.72);
}
`;

		/* ── storage ──────────────────────────────────────────────────────────
		 * One small record per concern, so a corrupt entry cannot take the pet
		 * with it. Nothing here is required: every read has a default. */
		const petStore = (() => {
			let opening = null;
			function open() {
				if (opening === null) {
					opening = new Promise((resolve, reject) => {
						if (typeof indexedDB === "undefined" || indexedDB === null) {
							reject(new Error("indexedDB unavailable"));
							return;
						}
						const request = indexedDB.open(PET_DATABASE, 1);
						request.onupgradeneeded = () => {
							const db = request.result;
							if (!db.objectStoreNames.contains(PET_STORE)) db.createObjectStore(PET_STORE);
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
					const transaction = db.transaction(PET_STORE, mode);
					const store = transaction.objectStore(PET_STORE);
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

		const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

		/* ── what the pet remembers ───────────────────────────────────────── */
		const prefs = (() => {
			const listeners = new Set();
			let state = { sound: DEFAULT_SOUND, scale: DEFAULT_SCALE, hidden: false };
			/** What the sound switch turns back on to, so `off` is not lossy. */
			let lastAudible = DEFAULT_SOUND;
			/** Set by the first write, so a slow read cannot undo a quick click. */
			let touched = false;
			function publish() {
				for (const listener of Array.from(listeners)) listener();
			}
			return {
				get() { return state; },
				lastAudible() { return lastAudible; },
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				hydrate() {
					return petStore.read(SETTINGS_KEY).then((record) => {
						// The stored value must not land on top of a choice the viewer
						// already made while this read was in flight.
						if (touched) return;
						const stored = record !== null && typeof record === "object" ? record : {};
						const sound = SOUNDS.some((entry) => entry.id === stored.sound) ? stored.sound : DEFAULT_SOUND;
						const scale = typeof stored.scale === "number" && Number.isFinite(stored.scale)
							? clamp(stored.scale, MIN_SCALE, MAX_SCALE)
							: DEFAULT_SCALE;
						if (sound !== "off") lastAudible = sound;
						state = { sound, scale, hidden: stored.hidden === true };
						publish();
					});
				},
				update(patch) {
					touched = true;
					if (typeof patch.sound === "string" && patch.sound !== "off") lastAudible = patch.sound;
					state = { ...state, ...patch };
					publish();
					return petStore.write(SETTINGS_KEY, state);
				},
			};
		})();

		/**
		 * Any session id, which is all the command Remote needs to authorize a call.
		 *
		 * The command itself is global and does not care which session it arrived
		 * through, so this only has to find one that exists: the status snapshot
		 * first, then whichever container the sessions snapshot happens to expose.
		 *
		 * @returns a session id, or undefined when the build exposes none.
		 */
		function sessionForCommand(report, sessions) {
			if (Array.isArray(report?.ids) && report.ids.length > 0) return report.ids[0];
			if (sessions === null || sessions === undefined || typeof sessions !== "object") return undefined;
			for (const key of ["order", "ids", "list", "items"]) {
				const value = sessions[key];
				if (Array.isArray(value) && value.length > 0) {
					const first = value[0];
					return typeof first === "string" ? first : first?.id;
				}
			}
			for (const key of ["byId", "sessions", "entities"]) {
				const value = sessions[key];
				if (value !== null && typeof value === "object") {
					const first = Object.keys(value)[0];
					if (first !== undefined) return first;
				}
			}
			return undefined;
		}

		/* ── the lock backdrop ────────────────────────────────────────────────
		 * The picked image is copied into IndexedDB as a Blob and served back
		 * through an object URL, so deleting the original file cannot break the
		 * lock, and a missing or unreadable record falls back to the bundled frame.
		 * This is deliberately its own record rather than a shared one with any
		 * sibling plugin: the lock is this plugin's surface. */
		const lockArt = (() => {
			const listeners = new Set();
			let state = { objectUrl: "", custom: false };
			function publish() {
				for (const listener of Array.from(listeners)) listener();
			}
			function release(url) {
				if (url === "") return;
				try { URL.revokeObjectURL(url); } catch (error) { /* already gone */ }
			}
			function commit(next) {
				release(state.objectUrl);
				state = next;
				publish();
			}
			return {
				get() { return state; },
				/** What the cover should paint right now. */
				src() { return state.objectUrl !== "" ? state.objectUrl : LOCK_RENDITION; },
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				hydrate() {
					return petStore.read(LOCK_IMAGE_KEY).then((blob) => {
						if (blob instanceof Blob) commit({ objectUrl: URL.createObjectURL(blob), custom: true });
					});
				},
				useFile(file) {
					// Show it either way: the lock has to work even when the record
					// could not be persisted, it just will not survive a reload.
					const show = () => commit({ objectUrl: URL.createObjectURL(file), custom: true });
					return petStore.write(LOCK_IMAGE_KEY, file).then(
						(saved) => { show(); return saved; },
						() => { show(); return false; });
				},
				reset() {
					commit({ objectUrl: "", custom: false });
					return petStore.clear(LOCK_IMAGE_KEY);
				},
				dispose() {
					release(state.objectUrl);
					state = { objectUrl: "", custom: false };
					listeners.clear();
				},
			};
		})();

		/* ── the completion sound ─────────────────────────────────────────────
		 * Synthesised rather than shipped: an audio file would be one more asset
		 * the host cannot serve, and three short recipes are a few lines each.
		 *
		 * Browsers refuse to start audio before a user gesture, so the context is
		 * created on the first interaction anywhere and every play resumes it. If
		 * the viewer has still never touched the window, a completion is silent
		 * instead of throwing. */
		const speaker = (() => {
			let context = null;
			let armed = false;
			function ensure() {
				if (context !== null) return context;
				const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
				if (typeof Ctor !== "function") return null;
				try {
					context = new Ctor();
				} catch (error) {
					context = null;
				}
				return context;
			}
			function tone(audio, options) {
				const oscillator = audio.createOscillator();
				const gain = audio.createGain();
				oscillator.type = options.type;
				oscillator.frequency.setValueAtTime(options.from, options.at);
				if (options.to !== undefined) {
					oscillator.frequency.exponentialRampToValueAtTime(options.to, options.at + options.duration);
				}
				gain.gain.setValueAtTime(0.0001, options.at);
				gain.gain.exponentialRampToValueAtTime(options.level, options.at + 0.012);
				gain.gain.exponentialRampToValueAtTime(0.0001, options.at + options.duration);
				oscillator.connect(gain).connect(audio.destination);
				oscillator.start(options.at);
				oscillator.stop(options.at + options.duration + 0.02);
			}
			/** A short noise burst through a low-pass: the mechanical half. */
			function noise(audio, at, duration, cutoff, level) {
				const frames = Math.max(1, Math.floor(audio.sampleRate * duration));
				const buffer = audio.createBuffer(1, frames, audio.sampleRate);
				const channel = buffer.getChannelData(0);
				for (let index = 0; index < frames; index += 1) {
					channel[index] = (Math.random() * 2 - 1) * (1 - index / frames);
				}
				const source = audio.createBufferSource();
				source.buffer = buffer;
				const filter = audio.createBiquadFilter();
				filter.type = "lowpass";
				filter.frequency.value = cutoff;
				const gain = audio.createGain();
				gain.gain.setValueAtTime(level, at);
				gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
				source.connect(filter).connect(gain).connect(audio.destination);
				source.start(at);
				source.stop(at + duration);
			}
			const recipes = {
				beep(audio, at) {
					tone(audio, { type: "square", from: 880, to: 880, at, duration: 0.09, level: SOUND_GAIN });
					tone(audio, { type: "square", from: 1320, to: 1320, at: at + 0.11, duration: 0.12, level: SOUND_GAIN });
				},
				clunk(audio, at) {
					noise(audio, at, 0.16, 520, SOUND_GAIN * 1.2);
					tone(audio, { type: "triangle", from: 180, to: 90, at, duration: 0.2, level: SOUND_GAIN });
					noise(audio, at + 0.19, 0.1, 900, SOUND_GAIN * 0.5);
				},
				chime(audio, at) {
					[880, 1320, 1760].forEach((frequency, index) => {
						tone(audio, {
							type: "sine",
							from: frequency,
							at: at + index * 0.045,
							duration: 0.7 - index * 0.12,
							level: SOUND_GAIN * (1 - index * 0.22),
						});
					});
				},
			};
			return {
				/** Called once per document: audio is allowed after the first gesture. */
				arm() {
					if (armed) return () => {};
					armed = true;
					const listener = () => {
						const audio = ensure();
						if (audio !== null && audio.state === "suspended") void audio.resume();
					};
					window.addEventListener("pointerdown", listener);
					window.addEventListener("keydown", listener);
					return () => {
						window.removeEventListener("pointerdown", listener);
						window.removeEventListener("keydown", listener);
					};
				},
				/** @returns true when a sound was actually started. */
				play(id) {
					const recipe = recipes[id];
					if (recipe === undefined) return false;
					const audio = ensure();
					if (audio === null) return false;
					// A suspended context silently swallows anything scheduled on it,
					// and it starts suspended until the first gesture. Resume first,
					// then schedule against the context that is actually running.
					if (audio.state === "suspended") {
						return audio.resume().then(
							() => { recipe(audio, audio.currentTime + 0.01); return true; },
							() => false);
					}
					try {
						recipe(audio, audio.currentTime + 0.01);
						return true;
					} catch (error) {
						return false;
					}
				},
				dispose() {
					if (context !== null) {
						try { void context.close(); } catch (error) { /* already closed */ }
						context = null;
					}
				},
			};
		})();

		/**
		 * Read one of this plugin's injected services.
		 *
		 * Cordis does not return undefined for a property that was not injected —
		 * it THROWS. Optional chaining therefore does not make service access
		 * safe, and an access outside a try turned the balance read into an
		 * unhandled rejection that left the card on "reading" forever. Every
		 * service is read through here instead.
		 *
		 * @returns the service, or undefined when it is not available.
		 */
		function service(ctx, name) {
			try {
				return ctx?.[name];
			} catch (error) {
				return undefined;
			}
		}

		/* ── the account Remote ───────────────────────────────────────────── */
		const account = (() => {
			let version = "";
			async function clientVersion() {
				if (version !== "") return version;
				try {
					const status = await window.dshDesktop?.updates?.status?.();
					const found = status?.currentVersion ?? status?.version;
					if (typeof found === "string" && found !== "") {
						version = found;
						return version;
					}
				} catch (error) { /* fall through to the literal */ }
				version = FALLBACK_CLIENT_VERSION;
				return version;
			}
			return {
				/**
				 * The account namespace, whichever way the shell published it.
				 *
				 * The shipped account UI injects both `remote` and `remote.account`,
				 * and that is not decoration: `remote` is the namespace holder, so
				 * without injecting it `ctx.remote` may not exist at all even though
				 * the leaf service resolved. Both layouts are accepted here.
				 *
				 * @returns the namespace object, or undefined when the build has none.
				 */
				namespace(ctx) {
					const nested = service(service(ctx, "remote"), "account");
					if (typeof nested?.getBalance === "function") return nested;
					const flat = service(ctx, "remote.account");
					if (typeof flat?.getBalance === "function") return flat;
					return undefined;
				},
				/** @returns the metadata every account Remote method carries. */
				async metadata() {
					const lang = document.documentElement.lang ?? "zh";
					return {
						version: await clientVersion(),
						locale: lang,
						timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
					};
				},
				/** Read the account state, which needs no metadata and never throws. */
				async state(ctx) {
					const space = this.namespace(ctx);
					if (space === undefined || typeof space.getState !== "function") return undefined;
					try {
						const result = await space.getState();
						if (result === null || result === undefined) return undefined;
						if (result.ok !== true) return { status: "failed" };
						return result.value ?? undefined;
					} catch (error) {
						return undefined;
					}
				},
				/**
				 * Read the balance.
				 *
				 * The Remote call answers `{ ok, value }`, and its value is either
				 * `{ status: "ready", value: [{currency, balance}], bonusWallets }`
				 * or `{ status: "failed" }`; a `null` payload means there is no
				 * account to read. Everything below is defensive because the shape
				 * crosses a wire this plugin does not own, and the card reports which
				 * of these it hit instead of a generic failure.
				 *
				 * @returns {{ kind: "ok", paid: object[], granted: object[] } | { kind: "unavailable" | "failed" | "empty", detail?: string }}
				 */
				async balance(ctx) {
					const space = this.namespace(ctx);
					if (space === undefined) return { kind: "unavailable", detail: "no remote.account" };
					try {
						const result = await space.getBalance(await this.metadata());
						if (result === null || result === undefined) return { kind: "failed", detail: "no envelope" };
						if (result.ok !== true) return { kind: "failed", detail: "not ok" };
						const payload = result.value;
						if (payload === null || payload === undefined) return { kind: "empty" };
						if (payload.status !== "ready") return { kind: "failed", detail: String(payload.status) };
						const wallets = Array.isArray(payload.value) ? payload.value : [];
						const bonus = Array.isArray(payload.bonusWallets) ? payload.bonusWallets : [];
						return { kind: "ok", paid: wallets, granted: bonus };
					} catch (error) {
						const message = error !== null && typeof error === "object" && typeof error.message === "string"
							? error.message
							: String(error);
						return { kind: "failed", detail: message.slice(0, 90) };
					}
				},
			};
		})();

		/** Currency symbol for the wallet currencies the account Remote reports. */
		const CURRENCY_SIGNS = { CNY: "¥", USD: "$" };

		/** Sum one wallet list, keeping the currency of its first entry. */
		function walletTotal(wallets) {
			let sum = 0;
			let currency = "";
			for (const wallet of wallets) {
				const amount = Number(wallet?.balance);
				if (!Number.isFinite(amount)) continue;
				sum += amount;
				if (currency === "" && typeof wallet?.currency === "string") currency = wallet.currency;
			}
			return { sum, currency };
		}

		/** @returns a display string for an amount, never NaN. */
		function money(amount, currency) {
			if (!Number.isFinite(amount)) return "—";
			const sign = CURRENCY_SIGNS[currency] ?? "";
			return sign + amount.toFixed(2);
		}

		/**
		 * Summarise whatever the account state came back as.
		 *
		 * The shape is not this plugin's to define and it is the one thing that
		 * decides whether a failed balance read is the viewer's problem (not signed
		 * in) or a real error, so it is reported verbatim rather than guessed at.
		 *
		 * @returns a short human-readable label.
		 */
		function describeAccount(state) {
			if (state === undefined) return text("读不到（没有账户接口或调用失败）", "unavailable");
			if (typeof state !== "object" || state === null) return String(state);
			const status = typeof state.status === "string" ? state.status : undefined;
			const signedIn = state.accountId !== undefined || state.user !== undefined || state.signedIn === true;
			if (status !== undefined) return signedIn ? status + " / 已登录" : status;
			return Object.keys(state).slice(0, 4).join(", ") || "—";
		}

		/**
		 * The lock request channel.
		 *
		 * The lock cover's state lives in the seat, but two other surfaces raise
		 * it (the pet's tool bar and the settings page). A module-level hub keeps
		 * that out of the plugin context, which belongs to the shell.
		 */
		const lockHub = {
			/** Replaced by the mounted seat; a no-op before then. */
			fire() {},
		};

		/* ── the robot ────────────────────────────────────────────────────────
		 * Drawn as inline SVG, not an image: the eye has to change colour with the
		 * mood and CSS has to animate the antenna and the treads, and neither is
		 * possible through an <img> data URI. */
		function RobotArt() {
			return h("svg", {
				className: "dshPetFigure",
				viewBox: "0 0 120 150",
				role: "img",
				"aria-label": text("废土机器人桌宠", "Wasteland robot pet"),
			},
				h("ellipse", { className: "dshPetAura", cx: "60", cy: "46", rx: "30", ry: "30" }),
				h("g", { className: "dshPetBob" },
					// antenna
					h("g", { className: "dshPetAntenna" },
						h("rect", { x: "58", y: "17", width: "4", height: "20", rx: "2", fill: "#4a3626" }),
						h("circle", { cx: "60", cy: "15", r: "5", fill: "#ffb254" }),
						h("circle", { cx: "60", cy: "15", r: "9", fill: "none", stroke: "#ffb254", strokeWidth: "1", opacity: "0.45" })),
					// head
					h("path", { d: "M28 34h64a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V40a6 6 0 0 1 6-6z", fill: "#6b5236" }),
					h("path", { d: "M28 34h64a6 6 0 0 1 6 6v6H22v-6a6 6 0 0 1 6-6z", fill: "#7d6144" }),
					h("rect", { x: "26", y: "33", width: "68", height: "3", rx: "1.5", fill: "#3a2c1e" }),
					// the one lens eye
					h("circle", { className: "dshPetEye", cx: "60", cy: "52", r: "13", fill: "#241a12" }),
					h("circle", { className: "dshPetEye", cx: "60", cy: "52", r: "9", fill: "#ffb254" }),
					h("circle", { className: "dshPetEye", cx: "60", cy: "52", r: "4", fill: "#fff3dd" }),
					// rivets and a vent
					h("circle", { cx: "30", cy: "44", r: "2", fill: "#3a2c1e" }),
					h("circle", { cx: "90", cy: "44", r: "2", fill: "#3a2c1e" }),
					h("rect", { x: "44", y: "64", width: "32", height: "3", rx: "1.5", fill: "#3a2c1e" }),
					// body
					h("path", { d: "M34 74h52l6 34a6 6 0 0 1-6 7H34a6 6 0 0 1-6-7z", fill: "#5a4630" }),
					h("path", { d: "M34 74h52l2 12H32z", fill: "#6b5236" }),
					// hazard stripe
					h("path", { d: "M33 96h54l1 6H32z", fill: "#c9902f", opacity: "0.8" }),
					h("path", { d: "M36 96l4 6h6l-4-6zM50 96l4 6h6l-4-6zM64 96l4 6h6l-4-6z", fill: "#3a2c1e", opacity: "0.75" }),
					// arms
					h("path", { d: "M22 78l-6 26 8 2 6-26z", fill: "#4a3626" }),
					h("path", { d: "M98 78l6 26-8 2-6-26z", fill: "#4a3626" }),
					h("path", { d: "M14 104h12v6H14zM94 104h12v6H94z", fill: "#6b5236" }),
					// treads
					h("rect", { x: "24", y: "116", width: "72", height: "20", rx: "9", fill: "#2c2118" }),
					h("circle", { cx: "38", cy: "126", r: "6", fill: "#4a3626" }),
					h("circle", { cx: "60", cy: "126", r: "6", fill: "#4a3626" }),
					h("circle", { cx: "82", cy: "126", r: "6", fill: "#4a3626" }),
					h("circle", { cx: "38", cy: "126", r: "2", fill: "#8a6a44" }),
					h("circle", { cx: "60", cy: "126", r: "2", fill: "#8a6a44" }),
					h("circle", { cx: "82", cy: "126", r: "2", fill: "#8a6a44" })));
		}

		/**
		 * The pet itself: draggable, double-click for the balance, and a tool bar
		 * whose close button arms before it fires.
		 */
		function Pet({ ctx, useSessionStatus, useSessions }) {
			const [snapshot, setSnapshot] = React.useState(prefs.get());
			const [position, setPosition] = React.useState(null);
			const [mood, setMood] = React.useState("idle");
			const [confirming, setConfirming] = React.useState(false);
			const [busy, setBusy] = React.useState(0);
			const [notice, setNotice] = React.useState("");
			const [quit, setQuit] = React.useState("");
			const [card, setCard] = React.useState(null);
			const drag = React.useRef(null);
			const cardRef = React.useRef(null);
			const celebrate = React.useRef(0);
			const previous = React.useRef({});
			const beforeCount = React.useRef(0);
			const lastRing = React.useRef(0);

			React.useEffect(() => prefs.subscribe(() => { setSnapshot(prefs.get()); }), []);
			React.useEffect(() => {
				void petStore.read(POSITION_KEY).then((record) => {
					if (record !== null && Number.isFinite(record?.x) && Number.isFinite(record?.y)) setPosition(record);
				});
			}, []);

			// A press anywhere outside the pet and its panels dismisses them, so the
			// balance readout does not depend on its own close button being found.
			// The capture phase is used so this sees the press before whatever it
			// landed on can act on it.
			const panelOpen = card !== null || confirming;
			React.useEffect(() => {
				if (!panelOpen) return;
				const onDown = (event) => {
					const target = event.target;
					if (typeof target?.closest === "function" && target.closest(".dshPetRobot, .dshPetCard") !== null) return;
					setCard(null);
					setConfirming(false);
				};
				document.addEventListener("pointerdown", onDown, true);
				return () => { document.removeEventListener("pointerdown", onDown, true); };
			}, [panelOpen]);

			// "Needs my input" watch.
			//
			// Four edges are treated as "your turn", because missing one is worse
			// than ringing once too often: a turn that settled, a question that
			// started waiting, an unseen completion, and — the case a per-session
			// walk cannot see on its own — the running COUNT going down, which also
			// covers a session that vanished from the snapshot while it was running.
			/**
			 * Ring once, whichever trigger noticed first.
			 *
			 * Four status edges and a DOM watcher can all observe the same moment,
			 * so they share one cooldown: two sounds for one turn would read as a
			 * bug just as much as no sound at all.
			 */
			const ring = React.useCallback((reason) => {
				if (Date.now() - lastRing.current < RING_COOLDOWN_MS) return;
				lastRing.current = Date.now();
				celebrate.current = Date.now() + CELEBRATE_MS;
				setMood("done");
				setNotice(reason === "approve" ? "approve" : (reason === "ask" || reason === "waiting" ? "input" : "done"));
				if (prefs.get().sound !== "off") void speaker.play(prefs.get().sound);
				const seen = statusReport.get();
				statusReport.publish({ ...seen, fired: seen.fired + 1, last: reason });
				window.setTimeout(() => {
					setMood((current) => (current === "done" ? "idle" : current));
					setNotice("");
				}, CELEBRATE_MS);
			}, []);

			/**
			 * A trigger that does not depend on the status hook at all.
			 *
			 * The composer's primary control is "stop" exactly while a turn is
			 * running, so the moment it stops being that, it is the viewer's turn.
			 * This covers a build where the hook is missing or reports something this
			 * plugin does not understand - which is precisely what happened twice.
			 */
			React.useEffect(() => {
				let running = findStopButton() !== null;
				const timer = window.setInterval(() => {
					if (document.querySelector("[data-composer-card]") === null) return;
					const now = findStopButton() !== null;
					if (running && !now) ring("settled");
					running = now;
				}, 900);
				return () => { window.clearInterval(timer); };
			}, [ring]);

			/**
			 * The same idea for every "it needs you" surface: an approval, a question
			 * set, or a plan review.
			 *
			 * The bell used to ring only for a finished turn and for the status hook's
			 * own "waiting" flag, so an approval - which is a different request path
			 * entirely - passed in silence. These markers belong to the surfaces
			 * themselves, so this fires for all of them and does not care which
			 * service produced the request.
			 */
			React.useEffect(() => {
				let seen = pendingActions().count;
				const timer = window.setInterval(() => {
					const now = pendingActions();
					if (now.count > seen) ring(now.reason);
					seen = now.count;
				}, 700);
				return () => { window.clearInterval(timer); };
			}, [ring]);

			const statuses = typeof useSessionStatus === "function" ? useSessionStatus((value) => value) : undefined;
			React.useEffect(() => {
				if (statuses === undefined || statuses === null) {
					statusReport.publish({
						shape: "none", entries: 0, running: 0, pending: 0,
						fired: statusReport.get().fired, last: statusReport.get().last,
					});
					return;
				}
				const before = previous.current;
				const beforeRunning = beforeCount.current;
				let landed = false;
				let waiting = false;
				let becameUnread = false;
				let running = 0;
				let pending = 0;
				const pairs = statusEntries(statuses);
				const next = {};
				for (const [id, entry] of pairs) {
					const now = readStatus(entry);
					const was = before[id] ?? { running: false, pending: false, unread: false };
					next[id] = now;
					if (now.running) running += 1;
					if (now.pending) pending += 1;
					if (was.running && !now.running) landed = true;
					if (!was.pending && now.pending) waiting = true;
					if (!was.unread && now.unread) becameUnread = true;
				}
				previous.current = next;
				beforeCount.current = running;
				setBusy(running);
				if (beforeRunning > running) landed = true;
				const shouldRing = landed || waiting || becameUnread;
				const fired = statusReport.get().fired + (shouldRing ? 1 : 0);
				statusReport.publish({
					shape: statusShape(statuses),
					ids: pairs.map(([id]) => id).slice(0, 8),
					entries: pairs.length,
					running,
					pending,
					fired,
					last: shouldRing
						? (waiting ? "waiting" : (becameUnread ? "unread" : "settled"))
						: statusReport.get().last,
				});
				if (!shouldRing) {
					setMood((current) => (current === "done" && Date.now() < celebrate.current ? current : (running > 0 ? "busy" : "idle")));
					return;
				}
				ring(waiting ? "waiting" : (becameUnread ? "unread" : "settled"));
			}, [statuses]);

			/**
			 * Close the window.
			 *
			 * There is no renderer-to-main quit channel in this build, so the
			 * strongest thing a page can do is close its own window — and that
			 * already ends the app when it was the last window (`window-all-closed`
			 * calls `app.quit()`). What it cannot do is force a quit while tasks are
			 * running, because the desktop shell deliberately keeps itself alive in
			 * the tray then. The confirmation below says exactly that instead of
			 * pretending otherwise.
			 */
			const close = React.useCallback(() => {
				const shortcuts = service(ctx, "shortcuts");
				const method = shortcuts?.closeWindow;
				if (typeof method === "function") {
					Promise.resolve(method.call(shortcuts)).catch(() => {});
					return;
				}
				try { window.close(); } catch (error) { /* nothing else to try */ }
			}, [ctx]);

			/**
			 * Stop the running turn.
			 *
			 * There is no client service for this — the composer owns the action —
			 * so its own stop button is pressed where it lives. Its presence is also
			 * the honest answer to "is there anything to stop".
			 *
			 * @returns true when a stop button was found and pressed.
			 */
			const stopTask = React.useCallback(() => {
				const button = findStopButton();
				if (button === null) return false;
				button.click();
				return true;
			}, []);

			/**
			 * End the whole application.
			 *
			 * The marker goes into this window's URL, which the host half watches for
			 * from inside the main process. Nothing happens if that half is not
			 * running (a web build), so the panel reports the fallback rather than
			 * leaving the viewer with a button that did nothing.
			 */
			const sessionSnapshot = typeof useSessions === "function" ? useSessions((value) => value) : undefined;
			const endApplication = React.useCallback(() => {
				setQuit("requested");
				// The command runs in the host half, which is the only half that can
				// reach the shell process. Reached through the shell's own command
				// Remote, so no new channel is invented here.
				const commands = service(service(ctx, "remote"), "commands");
				const id = sessionForCommand(statusReport.get(), sessionSnapshot);
				if (commands === undefined || typeof commands.execute !== "function" || id === undefined) {
					setQuit("unavailable");
					return;
				}
				Promise.resolve(commands.execute(id, "/" + QUIT_COMMAND, [])).then(
					(result) => {
						// The command registry answers undefined for an unknown name
						// instead of rejecting, which is exactly what a host half that
						// has not loaded yet looks like.
						if (result === undefined || result === null) { setQuit("unknown"); return; }
						window.setTimeout(() => { setQuit("fallback"); }, QUIT_FALLBACK_MS);
					},
					() => { setQuit("failed"); });
			}, [ctx]);

			/**
			 * Reload the interface.
			 *
			 * This is the shell's own reload path - the same thing its Ctrl+R does -
			 * because nothing else rebuilds the client module graph and re-renders
			 * the shell. One consequence is worth knowing: a reload starts a fresh
			 * document, so the opening animation plays again and an unsent draft in
			 * the composer does not survive. The button's tooltip says so.
			 */
			const refresh = React.useCallback(() => {
				try {
					window.location.reload();
				} catch (error) {
					// A build that refuses to reload has nothing else to fall back on.
				}
			}, []);

			const openBalance = React.useCallback(() => {
				setCard({ kind: "loading" });
				void account.balance(ctx).then(async (result) => {
					if (result.kind !== "failed" && result.kind !== "unavailable") {
						setCard(result);
						return;
					}
					// A failed read is not enough to act on, so the account state
					// travels with it: "signed out" and "the read broke" need
					// different fixes and must not look identical.
					const state = await account.state(ctx);
					setCard({ ...result, account: state });
				});
			}, [ctx]);

			const onPointerDown = (event) => {
				if (event.button !== 0) return;
				// A press on a control must not become a drag. Capturing here would
				// send the pointerup to this wrapper instead of the button, and the
				// button's click would be lost — this is what made every tool bar
				// button look dead.
				const target = event.target;
				if (typeof target?.closest === "function" && target.closest(INTERACTIVE) !== null) return;
				const root = event.currentTarget;
				const box = root.getBoundingClientRect();
				drag.current = {
					dx: event.clientX - box.left,
					dy: event.clientY - box.top,
					moved: false,
					root,
					origin: { x: event.clientX, y: event.clientY },
				};
			};
			const onPointerMove = (event) => {
				const state = drag.current;
				if (state === null) return;
				if (!state.moved) {
					const travel = Math.abs(event.clientX - state.origin.x) + Math.abs(event.clientY - state.origin.y);
					if (travel < DRAG_THRESHOLD) return;
					state.moved = true;
					// Capture only once a press has become a drag, so a plain click
					// keeps its own target and its own click event.
					state.root?.setPointerCapture?.(event.pointerId);
				}
				const x = clamp(event.clientX - state.dx, PET_INSET, window.innerWidth - PET_INSET - 40);
				const y = clamp(event.clientY - state.dy, PET_INSET, window.innerHeight - PET_INSET - 40);
				setPosition({ x, y });
			};
			const onPointerUp = (event) => {
				const state = drag.current;
				drag.current = null;
				if (state === null) return;
				if (state.moved) {
					state.root?.releasePointerCapture?.(event.pointerId);
					const box = event.currentTarget.getBoundingClientRect();
					void petStore.write(POSITION_KEY, { x: box.left, y: box.top });
				}
			};

			if (snapshot.hidden) return null;

			const style = {
				"--dsh-pet-scale": String(snapshot.scale),
				...(position === null
					? { right: DEFAULT_POSITION.right + "px", bottom: DEFAULT_POSITION.bottom + "px" }
					: { left: position.x + "px", top: position.y + "px" }),
			};

			const robot = h("div", {
				className: "dshPetRobot",
				[PET_ATTRIBUTE]: "",
				"data-mood": mood,
				"data-dragging": drag.current === null ? "false" : "true",
				style,
				onPointerDown,
				onPointerMove,
				onPointerUp,
				onPointerCancel: onPointerUp,
			},
				// A short bubble so "it needs me" is visible even when the sound is
				// off, muted by the OS, or still waiting for the first gesture.
				typeof useSessionStatus === "function" ? null : h("div", { className: "dshPetNotice", "data-warn": "true" },
					text("监听不可用", "Watch unavailable")),
				notice === "" ? null : h("div", { className: "dshPetNotice", "data-kind": notice },
					notice === "done"
					? text("任务完成", "Task finished")
					: (notice === "approve" ? text("等待审批", "Approval needed") : text("需要你输入", "Your turn"))),
				h("div", { className: "dshPetBar", role: "toolbar" },
					h("button", {
						type: "button",
						className: "dshPetButton",
						onClick: openBalance,
						title: text("查看余额（也可以双击机器人）", "Balance (or double-click the robot)"),
					}, text("余额", "Balance")),
					h("button", {
						type: "button",
						className: "dshPetButton",
						onClick: refresh,
						title: text("刷新界面（会重新加载，未发送的草稿会丢失）", "Reload the interface (unsent drafts are lost)"),
					}, text("刷新", "Refresh")),
					h("button", {
						type: "button",
						className: "dshPetButton",
						onClick: () => { lockHub.fire(); },
						title: text("锁屏：显示欢迎页，单击解锁", "Lock: show the welcome screen, click to unlock"),
					}, text("锁屏", "Lock")),
					h("span", { className: "dshPetBarBreak", key: "bar-break" }),
					h("button", {
						type: "button",
						className: "dshPetButton",
						// A real switch with two directions: on turns it off, off turns it
						// back on to whatever was chosen before, not always the default.
						"data-on": snapshot.sound === "off" ? "false" : "true",
						onClick: () => {
							const next = prefs.get().sound === "off" ? prefs.lastAudible() : "off";
							void prefs.update({ sound: next });
							if (next !== "off") speaker.play(next);
						},
						title: text("提示音开关：点一下切换开 / 关", "Sound switch: click to turn it on or off"),
					}, snapshot.sound === "off" ? text("音效 关", "Sound off") : text("音效 开", "Sound on")),
					h("button", {
						type: "button",
						className: "dshPetButton",
						"data-armed": confirming ? "true" : "false",
						onClick: () => { setConfirming(true); setCard(null); },
						title: text("关闭窗口（会先确认）", "Close the window (asks first)"),
					}, confirming ? text("确认中…", "Confirming…") : text("关闭", "Close"))),
				h("div", {
					onDoubleClick: openBalance,
					title: text("双击查看余额", "Double-click for the balance"),
				}, h(RobotArt)));

			return h(React.Fragment, null,
				robot,
				confirming ? h(ClosePanel, {
					busy,
					quit,
					onCancel: () => { setConfirming(false); },
					onStop: () => { stopTask(); },
					onClose: () => { setConfirming(false); close(); },
					onEnd: () => { endApplication(); },
					position,
				}) : null,
				card === null ? null : h(BalanceCard, { card, onClose: () => { setCard(null); }, onRefresh: openBalance, position }));
		}

		/**
		 * The composer's own stop button, or null when nothing is running.
		 *
		 * The action has no client service — the composer owns it — so this finds
		 * the real control and its presence doubles as the honest answer to "is
		 * there anything to stop". The labels are the two the shell ships; an
		 * unknown locale simply reports "nothing to stop" rather than guessing.
		 *
		 * @returns the button element, or null.
		 */
		function findStopButton() {
			for (const label of STOP_LABELS) {
				const button = document.querySelector('[data-composer-card] button[aria-label="' + label + '"]');
				if (button !== null && typeof button.click === "function") return button;
			}
			return null;
		}

		/**
		 * What is waiting on the viewer, judged from the surfaces themselves.
		 *
		 * The count matters, not just the presence: an answered question set stays
		 * in the transcript as a completed card, so "something is there" would be
		 * true for the rest of the session and every later request would be missed.
		 * A count that goes UP is a new request, whatever else is still on screen.
		 *
		 * @returns how many prompts are on screen, and which kind.
		 */
		function pendingActions() {
			let count = 0;
			let approval = false;
			for (const selector of PENDING_SELECTORS) {
				const found = document.querySelectorAll(selector);
				const size = typeof found?.length === "number" ? found.length : 0;
				if (size === 0) continue;
				count += size;
				if (selector.includes("approval")) approval = true;
			}
			return { count, reason: approval ? "approve" : "ask" };
		}

		/**
		 * The close panel: what to do about the app and its work.
		 *
		 * It exists because "close the window", "stop the work" and "end DSH" are
		 * three different things here. The desktop shell hides itself to the tray
		 * while tasks are running, so a plain window close is not a quit, and the
		 * panel states which one the viewer is about to get.
		 */
		function ClosePanel({ busy, quit, onCancel, onStop, onClose, onEnd, position }) {
			const style = position === null
				? { right: (DEFAULT_POSITION.right + 116) + "px", bottom: DEFAULT_POSITION.bottom + "px" }
				: { left: clamp(position.x - 300, PET_INSET, window.innerWidth - 300) + "px", top: position.y + "px" };
			return h("div", { className: "dshPetCard", "data-dsh-pet-close": "", style },
				h("p", { className: "dshPetCardTitle" }, text("怎么关？", "How should this end?")),
				busy > 0
					? h("p", { className: "dshPetCardNote" },
						text(
							"还有 " + busy + " 个会话正在运行。只关窗口的话，DSH 会留在系统托盘继续跑（这是桌面版自己的设计）。",
							busy + " session(s) are still running. Closing the window leaves DSH in the system tray and"
							+ " keeps working - that is the desktop shell's own design."))
					: h("p", { className: "dshPetCardNote" },
						text("当前没有任务在跑。", "Nothing is running right now.")),
				quit === "requested" ? h("p", { className: "dshPetCardNote" },
					text("已请宿主结束 DSH…若它没有响应，下面会说明，请改用托盘「退出」。",
						"Asked the host to end DSH... if nothing answers, use the tray Quit entry.")) : null,
				quit === "unknown" ? h("p", { className: "dshPetCardNote" },
					text(
						"宿主半里还没有这条命令 —— 它只在 DSH 启动时加载，所以**完整重启一次 DSH** 之后才会生效"
						+ "（只刷新页面不够）。现在要退出请用托盘图标右键 →「退出 DeepSeek Harness」。",
						"The host half does not have this command yet - it is loaded when DSH starts, so it needs a"
						+ " FULL restart of DSH (reloading the page is not enough). Meanwhile use the tray icon"
						+ " menu's Quit DeepSeek Harness entry.")) : null,
				quit === "failed" ? h("p", { className: "dshPetCardNote" },
					text("命令被拒绝了（可能没有可用的会话）。请用托盘「退出」。",
						"The command was rejected (there may be no session to route it through). Use the tray Quit entry.")) : null,
				quit === "fallback" ? h("p", { className: "dshPetCardNote" },
					text("宿主没有响应。请用托盘图标右键 →「退出 DeepSeek Harness」。",
						"The host did not answer. Use the tray icon menu - Quit DeepSeek Harness.")) : null,
				h("p", { className: "dshPetCardNote" },
					text(
						"「关闭窗口」只会把窗口收进系统托盘 —— 桌面外壳的关闭处理是写死的，关窗永远不退出应用。"
						+ "要完全退出：用「结束 DSH」，或托盘图标右键 →「退出 DeepSeek Harness」。"
						+ "「结束 DSH」会强制结束整个应用，正在跑的任务会被中断。",
						"Close window only hides the window in the system tray - the shell's close handler is"
						+ " hard-wired that way, so closing never quits. To quit: End DSH, or the tray icon's"
						+ " Quit DeepSeek Harness entry. End DSH ends the whole application and interrupts"
						+ " running tasks.")),
				h("div", { className: "dshPetCardActions" },
					h("button", { type: "button", className: "dshPetButton", onClick: onCancel }, text("取消", "Cancel")),
					h("button", {
						type: "button",
						className: "dshPetButton",
						onClick: onStop,
						disabled: busy === 0,
					}, text("停止任务", "Stop task")),
					h("button", { type: "button", className: "dshPetButton", onClick: onClose },
						text("关闭窗口", "Close window")),
					h("button", {
						type: "button",
						className: "dshPetButton",
						"data-armed": "true",
						onClick: onEnd,
					}, text("结束 DSH", "End DSH"))));
		}

		/** The balance readout, parked beside the robot. */
		function BalanceCard({ card, onClose, onRefresh, position }) {
			const style = position === null
				? { right: (DEFAULT_POSITION.right + 116) + "px", bottom: DEFAULT_POSITION.bottom + "px" }
				: { left: clamp(position.x - 246, PET_INSET, window.innerWidth - 246) + "px", top: position.y + "px" };
			const paid = card.kind === "ok" ? walletTotal(card.paid) : { sum: NaN, currency: "" };
			const granted = card.kind === "ok" ? walletTotal(card.granted) : { sum: NaN, currency: "" };
			const currency = paid.currency !== "" ? paid.currency : granted.currency;
			const rows = [
				[text("充值余额", "Topped up"), money(paid.sum, currency)],
				[text("赠送余额", "Granted"), money(granted.sum, currency)],
			];
			return h("div", { className: "dshPetCard", "data-dsh-pet-card": "", style },
				h("div", { className: "dshPetCardHead" },
					h("p", { className: "dshPetCardTitle" }, text("账户余额", "Account balance")),
					h("button", { type: "button", className: "dshPetButton", onClick: onClose }, text("收起", "Hide"))),
				card.kind === "loading" ? h("p", { className: "dshPetCardNote" }, text("读取中…", "Reading…")) : null,
				card.kind === "ok" ? h(React.Fragment, null,
					h("p", { className: "dshPetCardTotal" }, money(paid.sum + granted.sum, currency)),
					h("dl", { className: "dshPetCardList" },
						rows.flatMap(([label, shown]) => [
							h("dt", { key: label }, label),
							h("dd", { key: label + "-value" }, shown),
						]))) : null,
				card.kind === "empty" ? h("p", { className: "dshPetCardNote" },
					text("当前没有已登录的账户。", "No account is signed in.")) : null,
				card.kind === "unavailable" ? h("p", { className: "dshPetCardNote" },
					text("这个环境没有账户接口（网页版）。", "This build has no account Remote (web build).")) : null,
				card.kind === "failed" ? h("p", { className: "dshPetCardNote" },
					card.detail === undefined
						? text("读取失败，可能需要先登录账户。", "Read failed — you may need to sign in first.")
						: text("读取失败（" + card.detail + "）。", "Read failed (" + card.detail + ").")) : null,
				(card.kind === "failed" || card.kind === "unavailable")
					? h("p", { className: "dshPetCardNote" },
						text(
							"账户状态：" + describeAccount(card.account),
							"Account state: " + describeAccount(card.account))) : null,
				h("div", { className: "dshPetCardHead", style: { marginTop: "10px", marginBottom: "0" } },
					h("button", { type: "button", className: "dshPetButton", onClick: onRefresh }, text("刷新", "Refresh"))));
		}

		/**
		 * The lock cover: the welcome screen as a reusable surface.
		 *
		 * It unlocks on one click, and the click handler is attached to the node
		 * itself so it keeps working even if React's own event layer is the thing
		 * that broke - the same reason it removes itself as a last resort.
		 */
		function LockCover({ onUnlock }) {
			const done = React.useRef(false);
			const [source, setSource] = React.useState(() => lockArt.src());
			const unlock = React.useCallback(() => {
				if (done.current) return;
				done.current = true;
				onUnlock();
			}, [onUnlock]);
			React.useEffect(() => lockArt.subscribe(() => { setSource(lockArt.src()); }), []);
			React.useEffect(() => {
				const onKey = (event) => { if (event.key === "Escape" || event.key === "Enter") unlock(); };
				window.addEventListener("keydown", onKey);
				return () => { window.removeEventListener("keydown", onKey); };
			}, [unlock]);
			const attach = React.useCallback((node) => {
				if (node === null) return;
				node.addEventListener("pointerdown", () => {
					unlock();
					// If the unmount never comes, take the cover out by hand.
					window.setTimeout(() => { if (node.isConnected) node.remove(); }, 400);
				}, { once: true });
			}, [unlock]);
			return h("div", {
				className: "dshPetLock",
				[LOCK_ATTRIBUTE]: "",
				ref: attach,
				// No visible "click to unlock" line: the cover is meant to read as the
				// welcome screen and nothing else. The name stays for assistive tech,
				// which has no other way to learn what this surface is.
				"aria-label": text("锁屏，单击解锁", "Locked. Click to unlock."),
			},
				h("img", { className: "dshPetLockArt", src: source, alt: "", draggable: false }),
				h("div", { className: "dshPetLockVeil" }),
				h("div", { className: "dshPetLockDeck" },
					h("h1", { className: "dshPetLockTitle" },
						Array.from(WELCOME).map((character, index) => h("span", { key: String(index) }, character)))));
		}

		/**
		 * The seat entry: it owns the lock state for the whole document, hosts the
		 * pet, and portals both surfaces onto document.body.
		 */
		function PetSeat(props) {
			const [locked, setLocked] = React.useState(false);
			const ctx = props.ctx;
			React.useEffect(() => {
				lockHub.fire = () => { setLocked(true); };
				return () => { lockHub.fire = () => {}; };
			}, []);
			return h(React.Fragment, null,
				createPortal(h(Pet, { ctx, useSessionStatus: props.useSessionStatus, useSessions: props.useSessions }), document.body),
				locked ? createPortal(h(LockCover, { onUnlock: () => { setLocked(false); } }), document.body) : null);
		}

		/** The settings page body: sound, lock image, size, position. */
		function PetSection({ ctx }) {
			const [snapshot, setSnapshot] = React.useState(prefs.get());
			const [art, setArt] = React.useState(lockArt.get());
			const [report, setReport] = React.useState(statusReport.get());
			const input = React.useRef(null);
			React.useEffect(() => prefs.subscribe(() => { setSnapshot(prefs.get()); }), []);
			React.useEffect(() => lockArt.subscribe(() => { setArt(lockArt.get()); }), []);
			React.useEffect(() => statusReport.subscribe(() => { setReport(statusReport.get()); }), []);
			const choose = (id) => {
				void prefs.update({ sound: id });
				if (id !== "off") speaker.play(id);
			};
			const pick = () => { if (input.current !== null) input.current.click(); };
			const onFile = (event) => {
				const files = event.target.files;
				const file = files !== null && files.length > 0 ? files[0] : null;
				event.target.value = "";
				if (file !== null) void lockArt.useFile(file);
			};
			return h("div", { className: "dshPetPanel" },
				h("p", { className: "dshPetPanelTitle" }, text("锁屏画面", "Lock screen image")),
				h("div", { className: "dshPetPanelRow" },
					h("div", { className: "dshPetPanelThumb" },
						h("img", { src: art.custom && art.objectUrl !== "" ? art.objectUrl : LOCK_RENDITION, alt: "" })),
					h("div", { className: "dshPetPanelMeta" },
						h("p", { className: "dshPetPanelTitle" },
							art.custom ? text("自定义锁屏画面", "Custom lock image") : text("内置锁屏画面", "Bundled lock image")),
						h("p", { className: "dshPetPanelHint" },
							art.custom
								? text("图片已复制进插件存储，原文件删掉也不影响锁屏。", "The image is copied into plugin storage, so deleting the original file changes nothing.")
								: text("选一张你自己的图作为锁屏背景；不选就用内置的废土画面。", "Pick your own image, or keep the bundled wasteland frame.")))),
				h("div", { className: "dshPetPanelRow" },
					h("button", { type: "button", className: "dshPetPanelButton", onClick: pick },
						text("选择锁屏图片…", "Choose lock image…")),
					h("button", {
						type: "button",
						className: "dshPetPanelButton",
						onClick: () => { void lockArt.reset(); },
						disabled: !art.custom,
					}, text("恢复内置画面", "Restore bundled image")),
					h("input", {
						ref: input,
						type: "file",
						accept: "image/*",
						className: "dshPetPanelFile",
						onChange: onFile,
					})),
				h("p", { className: "dshPetPanelTitle" }, text("任务完成提示音", "Completion sound")),
				h("div", { className: "dshPetPanelRow" },
					SOUNDS.map((entry) => h("button", {
						key: entry.id,
						type: "button",
						className: "dshPetPanelChoice",
						"data-selected": snapshot.sound === entry.id ? "true" : "false",
						onClick: () => { choose(entry.id); },
					}, text(entry.zh, entry.en)))),
				h("div", { className: "dshPetPanelRow" },
					h("button", {
						type: "button",
						className: "dshPetPanelButton",
						onClick: () => { speaker.play(snapshot.sound === "off" ? prefs.lastAudible() : snapshot.sound); },
					}, text("试听", "Preview")),
					h("button", {
						type: "button",
						className: "dshPetPanelButton",
						onClick: () => { lockHub.fire(); },
					}, text("立即锁屏", "Lock now")),
					h("button", {
						type: "button",
						className: "dshPetPanelButton",
						onClick: () => { void petStore.write(POSITION_KEY, null); },
					}, text("重置机器人位置", "Reset robot position")),
					h("button", {
						type: "button",
						className: "dshPetPanelButton",
						onClick: () => { void prefs.update({ hidden: !snapshot.hidden }); },
					}, snapshot.hidden ? text("显示机器人", "Show robot") : text("隐藏机器人", "Hide robot"))),
				h("div", { className: "dshPetPanelRow" },
					h("span", null, text("机器人大小", "Robot size")),
					h("input", {
						type: "range",
						min: String(Math.round(MIN_SCALE * 100)),
						max: String(Math.round(MAX_SCALE * 100)),
						step: "5",
						value: String(Math.round(snapshot.scale * 100)),
						onChange: (event) => { void prefs.update({ scale: Number(event.target.value) / 100 }); },
					}),
					h("span", { className: "dshPetPanelValue" }, Math.round(snapshot.scale * 100) + "%")),
				h("p", { className: "dshPetPanelFoot" },
					text(
						"状态监听：" + report.shape + " 容器，" + report.entries + " 个会话（运行中 " + report.running
						+ "，等待输入 " + report.pending + "），已触发 " + report.fired + " 次（最后一次："
						+ (report.last === "" ? "无" : report.last) + "）。触发时机器人头上会冒气泡，"
						+ "并播放提示音 —— 如果这里有数字但没有气泡，说明是渲染问题；如果连数字都是 0，说明监听没拿到会话状态。",
						"Status watch: " + report.shape + " container, " + report.entries + " session(s) (running "
						+ report.running + ", waiting " + report.pending + "), fired " + report.fired
						+ " time(s). A trigger shows a bubble over the robot and plays the sound - numbers here"
						+ " with no bubble means a render problem, all zeroes means the watch sees no sessions.")),
				h("p", { className: "dshPetPanelFoot" },
					text(
						"提示音在任务完成时响一次（会话从「运行中」变为其他状态）。浏览器要求先有一次交互才允许出声，所以刚打开窗口时不会响。"
						+ "机器人可以拖动，位置会记住；双击它看余额，悬停出现工具条：余额 / 锁屏 / 音效 / 关闭。"
						+ "工具条上还有「刷新」：等于 Ctrl+R，会重新加载界面（未发送的草稿会丢失）。"
						+ "锁屏只是方便，不是安全措施：它盖住界面并保留欢迎页，单击或按 Esc 即可解锁。",
						"The chime plays once when a task finishes (a session leaving the running state). Browsers only"
						+ " allow audio after an interaction, so the very first window stays silent. Drag the robot to"
						+ " move it and the position is remembered; double-click it for the balance, or hover for the"
						+ " bar: balance / lock / sound / close. Close arms first and closes this window - if it is the"
						+ " last one, DSH exits, exactly like the title bar button. The lock is a convenience, not"
						+ " security: it covers the UI with the welcome screen, and one click or Escape unlocks it.")));
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
		 * Publish the scoping attribute so the stylesheet and both portalled
		 * surfaces can be addressed without inspecting this plugin.
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

		/**
		 * Required services.
		 *
		 * `shortcuts` is the window close, `remote` + `remote.account` are the
		 * balance (the namespace holder must be injected too, or `ctx.remote` may
		 * not exist even though the leaf resolved), and `slots` hosts both seats.
		 * Every one of them is also called defensively, so a composition without
		 * them shows a disabled button instead of a broken plugin.
		 */
		const inject = ["slots", "shortcuts", "remote", "remote.account", "remote.commands"];

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
		 * Add the pet and its settings page.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			const token = ++applicationToken;
			/** Run a document-level disposer only while this application is the live one. */
			const owned = (dispose) => () => {
				if (token === applicationToken) dispose();
			};
			ctx.effect(() => owned(publishRootAttribute()), "dsh-pet-robot: scope attribute");
			ctx.effect(() => owned(installStyles()), "dsh-pet-robot: stylesheet");
			ctx.effect(() => {
				void prefs.hydrate();
				void lockArt.hydrate();
				const disarm = speaker.arm();
				return owned(() => { disarm(); speaker.dispose(); lockArt.dispose(); });
			}, "dsh-pet-robot: pet storage, lock image and audio");
			// Self-heal: re-assert the scope once, shortly after apply.
			ctx.effect(() => {
				const timer = window.setTimeout(() => {
					if (token !== applicationToken) return;
					const root = document.documentElement;
					if (!root.hasAttribute(ROOT_ATTRIBUTE)) root.setAttribute(ROOT_ATTRIBUTE, "on");
				}, 900);
				return () => { window.clearTimeout(timer); };
			}, "dsh-pet-robot: scope self-heal");
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-pet-robot",
				order: 200,
			}, (props) => h(PetSeat, { ...props, ctx }))), "dsh-pet-robot: pet seat");
			ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-pet-robot",
				order: 50,
				label: () => text("桌宠", "Pet robot"),
			}, () => h(PetSection, { ctx }))), "dsh-pet-robot: settings page");
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = PLUGIN_ID;
		return module.exports;
	},
});

//# sourceMappingURL=client.js.map
