# Loop — little games, big energy

A mobile-friendly browser arcade: six mini-games, a looping game viewer, personal records, saved games and shareable score challenges. Built with plain HTML, CSS, JavaScript and a small Java HTTP preview server.

## Run in IntelliJ

1. Open this Maven project and select JDK 17 or newer.
2. Run `arcade.LoopServer.main()`.
3. Open <http://localhost:8080>.

An optional program argument changes the port, for example `8090`. Restart the run configuration after changing Java or resources. Refresh the browser after changing the frontend; use Ctrl+Shift+R if an older style is cached.

## Run without Maven

From the project root on Windows:

```powershell
javac --release 17 -d target/classes src/main/java/arcade/LoopServer.java
java -cp "target/classes;src/main/resources" arcade.LoopServer
```

On macOS/Linux, replace the classpath semicolon with a colon. The Java server is a loopback-only local preview, not a production backend. The frontend can also be published directly from `src/main/resources/static` on static hosting.

## Games

| Game | How to play |
| --- | --- |
| Stack Attack | Drop moving blocks on the stack. Perfect landings preserve width. |
| Orbit Pop | Tap as the comet crosses the highlighted arc. Three misses end the run. |
| Neon Drift | Switch between three lanes and avoid obstacles. Speed increases with score. |
| Tap Rush | Hit glowing tiles for 15 seconds. |
| Match Club | Find four pairs in as few moves as possible. |
| Color Clash | Select the ink colour, ignoring the word, for 20 seconds. |

## Navigation and accessibility

- Next/Previous, arrow keys, or scrolling over the card switch games; both ends wrap.
- Swipe vertically on the card heading to switch on touch devices. The game arena keeps its own touch controls.
- Space starts timing games and performs their main action; left/right arrows control Neon Drift.
- Escape pauses a running game. Opening a panel or hiding the browser tab pauses it too; Resume continues.
- Search, Saved and Records panels work without an account.
- Visible keyboard focus, reduced-motion support and touch controls are included.

## Data and limitations

Personal bests and saved games live in this browser's local storage. No account or cross-device sync is provided. Challenge URLs contain a game ID and optionally an unverified score, intended for friendly play. Memory now uses four pairs; the old three-pair record is reset on migration. No chat, public competition, payments, analytics or creator uploads are implemented. Google Fonts is optional; system fonts provide a fallback.

## Verification

Run the dependency-free navigation and gameplay-rule tests with:

```powershell
node --test tests/arcade-rules.test.cjs
```

See `tests/browser-qa.md` for manual/browser checks and verification limits.

## Next steps

1. Test on real iOS/Android phones, especially touch navigation and audio/visibility interruptions.
2. Gather feedback on game difficulty and controls before adding more games.
3. Publish a static demo so people can play directly.
4. Add authenticated, server-validated records before competitive public leaderboards.
5. Review isolation, moderation and content ownership before accepting external games.
