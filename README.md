# Loop — little games, big energy

A mobile-friendly browser arcade: six mini-games, a looping game viewer, personal records, saved games and shareable score challenges. Built with plain HTML, CSS, JavaScript and a small Java HTTP preview server.

Play the personal demo: <https://thomas-nejad.github.io/TikGame/>.

## Reviewed growth features

- A streak advances once per local calendar day after a completed round, not on page visits or arbitrary clicks.
- Native sharing is available when the browser supports it. The existing copy-link option remains available.
- The install button uses a native install prompt when supplied by the browser, otherwise it explains manual installation. Installation is optional.
- Offline play becomes available after one successful online download of the app shell. Look for **Offline ready** in the footer.
- The daily pick uses UTC, so friends see the same game; the play streak uses each visitor's local calendar.
- Versioned offline updates wait for tabs to close, or for an explicit **Update and reload** choice. An unfinished round restarts if that choice is accepted.
- PNG app icons, a 1200×630 social preview and a privacy link are included. Social apps may cache previews or ignore them.

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

On macOS/Linux, replace the classpath semicolon with a colon. The Java server binds to loopback by default and is a local preview, not a production backend. The frontend can also be published directly from `src/main/resources/static` on static hosting.

The default bind address stays `127.0.0.1`. For an intentional same-Wi-Fi gameplay test, set the run configuration's `HOST` environment variable to `0.0.0.0` and use your PC's local-network address. This makes the preview reachable on your network. HTTP on a phone's LAN address normally does not support service workers or PWA installation; use the published HTTPS link for those features. No firewall changes are automated.

## Publish updates

The live GitHub Pages site serves `docs/` on `main`.

```powershell
node scripts/prepare-pages.cjs
```

This copies the canonical frontend into `docs` and generates the service-worker cache version from all shell assets. Upload/push both source and generated files. Run it after every frontend change. Public preview metadata currently uses the existing GitHub Pages address; update it if the site moves.

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

Personal bests and saved games live under `loop-progress`, and local play streaks under `loop-streak`. No account, cross-device sync or operator-facing analytics is provided. The service worker caches only the explicit public shell inside this project's folder. Challenge URLs contain a game ID and optionally an unverified score, intended for friendly play. Memory uses four pairs; the old three-pair record is reset on migration. No chat, public competition, payments or creator uploads are implemented. This version uses system fonts without Google Fonts requests. Read `privacy.html` for the technical data explanation; it does not replace a legal review.

## Verification

Run the dependency-free navigation and gameplay-rule tests with:

```powershell
node --test tests/arcade-rules.test.cjs tests/growth.test.cjs tests/offline.test.cjs
```

See `tests/browser-qa.md` for manual/browser checks and verification limits.

## Next steps

1. Test on real iOS/Android phones, especially touch navigation and audio/visibility interruptions.
2. Gather feedback on game difficulty and controls before adding more games.
3. Test the existing public demo with willing players; see `BUSINESS_PLAN.md` for a validation plan.
4. Add authenticated, server-validated records before competitive public leaderboards.
5. Review isolation, moderation and content ownership before accepting external games.
