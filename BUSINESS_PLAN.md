# Loop: validate the game before building a business

## Current position

Loop is a free, public personal-project demo at <https://thomas-nejad.github.io/TikGame/>. There are six games, local personal records and challenge links. This reviewed release adds completed-round streaks, native sharing where supported, install help, a web app manifest and scoped offline caching. It does not add accounts, ads, payments or analytics.

These features are experiments. A streak counter is not evidence of retention, and there is no basis here to call it the strongest growth mechanism. Installation does not guarantee repeat use; fun games and a clear first experience still matter most.

## A practical next experiment

1. Ask five to ten willing testers to open the link on their actual phones.
2. Watch where they struggle to start, switch games, understand controls or replay. Fix those points.
3. Ask what made them want another round and whether they would send a challenge to a friend.
4. Invite them to return the next day without promising prizes or repeatedly sending reminders.
5. Only after this, decide whether another game, better controls or onboarding is the next useful change.

No paid domain is required. The existing HTTPS address is enough for testing, sharing and supported installation.

## What can be measured today

Local records and streaks exist only in each visitor's browser. The operator cannot use them to calculate site-wide day-one or day-seven return rates. Do not present local streak counts as audience analytics. Initially use voluntary tester feedback. If audience measurement becomes necessary, choose and review an appropriate data-minimising approach and update notices before adding it.

Useful questions are whether people finish their first round, voluntarily replay, understand a shared challenge and return later. A small initial test is feedback, not statistical proof of a business.

## Possible later revenue experiments

- An optional cosmetic pack, if players actually want personalisation.
- An optional ad-free offer, only if an advertising-supported version is first justified.
- Carefully labelled sponsorships, if a real audience and suitable agreements exist.

No income level, conversion rate or provider approval is guaranteed. Advertising adds privacy, performance and player-experience work. Do not start by adding ads between every round. Multiplayer, global leaderboards and creator payouts introduce substantial server, trust and operational requirements.

## Hosting and legal work before a commercial launch

The current GitHub Pages deployment is a personal/demo site. GitHub Pages restricts use for operating online businesses and commercial SaaS: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>. Reassess hosting before introducing commercial operations.

Keep employer-owned code and unlicensed third-party assets out of the project. AI assistance is not a licence to copy other people's work. Review applicable operator information, privacy, business registration, tax and payment obligations with qualified advice before a commercial launch. Do not assume every obligation starts only after the first euro is earned. The included privacy page describes technical behaviour; it is not a legal clearance or a complete Impressum.

## Publishing safely

Edit `src/main/resources/static`, then run `node scripts/prepare-pages.cjs`. This generates `docs` for the existing GitHub Pages deployment and fingerprints the complete offline build. Publish both the source and generated folder. Never edit only one copy and assume the other is synchronised.

Updates install into a separate project-scoped cache. Existing tabs continue using their current version until closed or until the player chooses Update and reload. Do not reintroduce forced mid-game reloads or delete unrelated origin caches.
