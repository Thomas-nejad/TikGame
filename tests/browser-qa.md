# Browser verification — 2 November 2026

Verified in Chrome against the local static preview:

- All six games appear in sequence; next and previous wrap at both ends.
- Native wheel scrolling from Color Clash advances to Stack Attack, and reverse scrolling returns to Color Clash.
- Only one game card is mounted after repeated navigation.
- Stack Attack starts and registers a successful drop.
- Orbit Pop ends after three misses and supports replay.
- Neon Drift starts and exposes working left/right controls; its collision boundaries are covered by the rule tests.
- Tap Rush registers successive target hits and reaches zero time.
- Color Clash registers the correct ink colour and shows its result after the time limit.
- Match Club can be completed by remembering previously revealed cards; a six-move result was observed.
- Opening the game library pauses the active game.
- Search filters the library; game selection loads the selected game.
- A saved game remains saved after page reload.
- Phone viewport at 390 × 844 has no horizontal overflow.

The phone viewport is browser emulation, not a physical-device touch test. Real-device swiping, assistive technology and broad browser compatibility remain to be checked. Challenge scores are not server-validated.

Java compilation with `--release 17` passed using JDK 25.0.2. The Java preview server could not establish its loopback socket in the execution environment, so browser gameplay verification used the static frontend served by Node. Run `arcade.LoopServer` in IntelliJ for the normal Java preview.
## Reviewed growth release — 3 November 2026

- Completed-round streaks were tested in Chrome: starting a game did not increment the count, finishing a round did, and finishing another on the same day kept the count at one.
- Native Share was offered on the test browser, and the existing copy-link option remained. No message was sent to another person and no OS share destination was selected.
- The first /TikGame/ visit installed the offline shell. The preview server was then stopped; reloading the page and switching games still worked.
- A new app-shell version was generated. The existing tab offered Update ready; Later preserved the current version, and Update and reload loaded the new one while preserving the streak.
- The streak chip, install control and game layout were checked at a 320 × 740 viewport without horizontal overflow.
- All 18 automated tests pass, including Berlin DST date boundaries, project-path scope, unrelated-cache preservation, offline fallback and explicit update activation.
- The Java server compiles for Java 17. Starting Java from the execution tool still fails while establishing its internal loopback socket; frontend browser verification therefore used a Node static preview. Running the revised server from IntelliJ remains a separate check.
- Actual iOS/Android home-screen installation, native OS sharing destinations and social-app link-preview rendering have not been verified on physical devices.
