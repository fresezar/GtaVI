# Joke shorts: format rules

Separate channel from Six Star. Old jokes retold as animated shorts. All on-video text and voice in English.

## Format

- **Anonymous stories.** "The Story of the Man Who…" No named recurring character. Narration in past tense:
  "There once was a man…".
- **Funny = contrast.** A sad piano plays under the whole story while something absurd happens. The piano is generated
  in `render.mjs` (Am–F–Dm–E, 66 bpm) and fades out before the punchline sting (`musicEnd` in `lines.json`).
- **Punchline sting:** sad trombone, then one closing line, then a short visual tag (fall, thud…).
- **Look:** flat cartoon, dark outline `#2a2238`, Shrikhand for words that pop, DM Sans captions (white, yellow numbers).
- **Length:** aim for 35–45 s. Episode 1 is 54 s; compare retention before deciding.
- Rude jokes stay cartoon-clean: censor bars with labels (×1, ×3), never drawn anatomy.

## Shared drawing: `cast.js`

Every episode loads `../cast.js`. A character that appears in more than one episode is drawn only there, so it looks
the same everywhere. Change a design there, never inside an episode.

- `hero()`, `heroHead()`: the default "man" of a story. Bald, three-hair comb-over, big nose, pale blue shirt, red tie.
  Expressions: neutral, sad, cry, scared, shock, shout, smug. Options: `bandaid`, `bar` (censor label), poses.
- `brick()`: the big calm guy, half-shut eyes, chewing.
- `captain()`, `passenger()`: extras.
- Sets: `cabin()`, `sky()`, `street()`, `plane()`. Props: `rainCloud()`, `censor()`, `bubble()`, `word()`.

## New episode

1. `shorts/jokes/epNN/lines.json`: lines with `who` (nar, hero, captain, crowd, big) and optional `pre`/`post` pauses.
2. `shorts/jokes/epNN/index.html`: copy ep01, keep `setup/render/sfx`, write the scenes.
3. `node shorts/jokes/render.mjs shorts/jokes/epNN` → `shorts/out/joke-epNN.mp4`. `--still 3,12.5` renders single frames.
4. Voice: `epNN/voice/<id>.wav`. Missing lines are made with Windows voices as placeholders.
