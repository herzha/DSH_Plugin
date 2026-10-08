/**
 * dsh-pet-robot — host half.
 *
 * It exists for exactly one action the pet cannot perform from a page: ending the
 * whole application.
 *
 * What the shell actually does, read out of its own code:
 *
 *  - the window `close` handler ALWAYS calls `event.preventDefault()` and hides
 *    the window to the tray, so closing a window never quits, with or without
 *    tasks running;
 *  - the only clean quit is the shell's own path (the tray's Quit entry), which
 *    asks this host to shut down first;
 *  - this host is a CHILD process, and the shell treats its exit as a failure
 *    ("dsh desktop host exited with N" / "stopped"), so exiting here produces the
 *    crash notice rather than a quit.
 *
 * A page therefore has no way to ask for a quit, and this host has no way to ask
 * politely. The one thing left that genuinely ends the application is to end the
 * process supervising it, which is what the command below does — reached through
 * the shell's own command Remote rather than through any new channel, so the page
 * only ever says "run this command".
 *
 * The command is registered, never run by itself: nothing happens until the pet's
 * own button asks for it.
 */

/** Public plugin name, matching the loader row id. */
export const name = 'dsh-pet-robot'

/**
 * Services this half needs.
 *
 * This has to be declared: Cordis THROWS when a plugin reads a service it did not
 * inject, and the guarded read below turned that throw into a silent no-op — the
 * command was never registered, and the client's call resolved as "unknown
 * command" instead of failing loudly.
 */
export const inject = ['commands']

/** The command the pet's "end DSH" button invokes. */
const QUIT_COMMAND = 'quitdsh'

/** How long the shell gets to die before this process leaves on its own. */
const SELF_EXIT_MS = 600

/**
 * End the application.
 *
 * The shell is this process's parent. Killing it takes the whole Electron
 * application down with it — including the notice that would otherwise report an
 * unexpected host exit, because that notice lives in the shell.
 *
 * @returns the command result the adapter renders.
 */
function endApplication () {
  try {
    process.kill(process.ppid)
  } catch (error) {
    // A refused kill still means the request was made; fall through and leave.
  }
  setTimeout(() => { process.exit(0) }, SELF_EXIT_MS)
  return { kind: 'success', text: 'Ending DeepSeek Harness' }
}

/**
 * Register the quit command when this host provides a command registry.
 * @param ctx - host plugin context.
 */
export function apply (ctx) {
  const commands = (() => {
    try {
      return ctx.commands
    } catch (error) {
      // Cordis throws for a service that was not injected, instead of returning
      // undefined, so every access is guarded.
      return undefined
    }
  })()
  if (commands === undefined || typeof commands.register !== 'function') return

  ctx.effect(() => commands.register({
    name: QUIT_COMMAND,
    description: 'End DeepSeek Harness completely (interrupts running tasks)',
    handler: endApplication,
  }), 'dsh-pet-robot: end-application command')
}
