# Loop — one more game
A mobile-friendly arcade feed with four original mini-games, local personal bests, saved games, and shareable score challenges.

## Run in IntelliJ
Open this Maven project with JDK 17 or newer. Run arcade.LoopServer and visit http://localhost:8080. An optional program argument changes the port.

## Run without Maven
javac -d target/classes src/main/java/arcade/LoopServer.java
java -cp "target/classes;src/main/resources" arcade.LoopServer

The frontend also works on static hosting. Publish the contents of src/main/resources/static. Java is a local preview server, not a production backend.

## Current scope
Scores and favourites are stored in this browser only. Challenge scores are user-provided, not verified competitive records. Four games cycle without cloning the document. Timed games pause offscreen. Following, comments and global rankings are not implemented. No accounts, payments, ads or external game uploads.

## Next milestones
1. Test all four games on real phones and collect gameplay feedback.
2. Add a fifth polished game and a dedicated results/collection screen.
3. Deploy the static frontend and measure voluntary return visits.
4. Add authenticated server-validated scores before public competition.
5. Introduce reviewed creator submissions only after isolation and moderation exist.
