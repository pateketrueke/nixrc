# Fun mIRC Scripts Catalog — nixrc

> Raw research catalog for Plan 06. 50 candidate script ideas sourced from mIRC scripting
> knowledge, canonical command docs, and classic IRC script archives.
> See `fun-scripts-top10.md` for the ranked shortlist.

**Compatibility tags:**
- ✅ Works now — all required commands/identifiers are implemented
- 🔧 Small gap — 1–3 missing identifiers or minor runtime feature
- 🏗️ Large gap — needs a major subsystem (keyboard, network, image loading, etc.)

---

## Drawing & Animation

### 1. 3D Starfield / Warp Speed
**Concept:** Hundreds of stars projected from a 3D vanishing point; speed accelerates on click.
**Why fun:** Iconic screensaver feel; immediate visual payoff; entirely deterministic math.
**Commands:** `window -p`, `drawdot`, `drawrect` (cls), `.timer`, `$sin`, `$cos`, `$rand`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 2. Particle Fireworks
**Concept:** Click canvas to launch a firework; burst of colored dots arc under gravity.
**Why fun:** Satisfying explosion effect; user-triggered; visually rich with minimal code.
**Commands:** `drawdot`, `drawrect`, `.timer`, `MDOWN`, `$rand`, `$rgb`, `%vars` for particle state
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 3. Matrix Digital Rain
**Concept:** Columns of falling green kanji/ASCII characters on black, fading over time.
**Why fun:** Iconic; immediately recognizable; timer-driven elegance.
**Commands:** `drawrect`, `drawtext`, `.timer`, `$rand`, `$chr`, `%vars` for column state
**Compatibility:** ✅ Works now
**Difficulty:** Easy–Medium

---

### 4. Spirograph
**Concept:** Hypotrochoid curves drawn with `$sin`/`$cos`; user picks R/r/d via dialog.
**Why fun:** Mesmerizing growing patterns; one formula, infinite variety.
**Commands:** `drawline`, `.timer`, `$sin`, `$cos`, `$calc`, `dialog`, `$did`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 5. Lissajous Curves
**Concept:** Parametric curves with varying phase and frequency ratio.
**Why fun:** Beautiful closed curves; small parameter changes = wildly different shapes.
**Commands:** `drawline`, `.timer`, `$sin`, `$cos`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 6. Bouncing Ball Physics
**Concept:** Multiple balls with velocity, gravity, bounce damping, and wall collisions.
**Why fun:** Classic physics toy; satisfying realism; extendable with more balls.
**Commands:** `drawdot`, `drawrect`, `.timer`, `%vars` for state, `$calc`, `$abs`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 7. Pendulum / Double Pendulum
**Concept:** Single or double pendulum with angle physics; draws trail path.
**Why fun:** Double pendulum is chaotic — unpredictable, mesmerizing trajectories.
**Commands:** `drawline`, `drawdot`, `.timer`, `$sin`, `$cos`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 8. Oscilloscope / Waveform Visualizer
**Concept:** Draws sin/square/sawtooth waves scrolling left; user picks wave type.
**Why fun:** Looks like a real instrument; smooth animated feel.
**Commands:** `drawline`, `.timer`, `$sin`, `$calc`, `dialog`, `$did`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 9. Plasma Effect
**Concept:** Each pixel colored by `$sin($x) + $sin($y) + $sin(t)` — psychedelic color waves.
**Why fun:** Classic demoscene effect; pure math beauty.
**Commands:** `drawdot`, `.timer`, `$sin`, `$rgb`, `$calc`
**Compatibility:** 🔧 Small gap — pixel-by-pixel `drawdot` is slow; need a way to batch draws or reduce resolution
**Difficulty:** Medium
**Gap:** Performance — drawdot called N*N times per frame

---

### 10. Sierpinski Triangle
**Concept:** Recursive fractal drawn iteratively with midpoint algorithm.
**Why fun:** Beautiful self-similar structure; emerges quickly from simple rules.
**Commands:** `drawline`, `.timer`, `$calc`
**Compatibility:** ✅ Works now (iterative chaos-game version)
**Difficulty:** Easy

---

### 11. Koch Snowflake
**Concept:** Recursive edge subdivision; draws progressively finer snowflake.
**Why fun:** Infinite perimeter, finite area — visually satisfying recursion.
**Commands:** `drawline`, `.timer`, `$sin`, `$cos`, `$calc`
**Compatibility:** 🔧 Small gap — needs recursive alias calls with coordinate args
**Difficulty:** Hard (recursion depth limited by interpreter)

---

### 12. Barnsley Fern
**Concept:** IFS fractal — random affine transforms produce a fern shape dot-by-dot.
**Why fun:** A fern from four math formulas — magic.
**Commands:** `drawdot`, `.timer`, `$rand`, `$calc`, `$rgb`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 13. Gravity N-Body Simulator
**Concept:** 5–10 masses attract each other; draw trails of orbits.
**Why fun:** Emergent orbital patterns; chaotic but beautiful.
**Commands:** `drawdot`, `drawline`, `.timer`, `$calc`, `%vars` for mass/vel state
**Compatibility:** ✅ Works now
**Difficulty:** Hard

---

### 14. Binary Clock
**Concept:** Grid of circles representing hours/minutes/seconds in binary.
**Why fun:** Genuinely readable by nerds; visually clean.
**Commands:** `drawrect`, `drawtext`, `.timer`, `$asctime`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 15. Bouncing DVD Logo
**Concept:** Text bounces around the canvas, changes color on corner hit.
**Why fun:** Perfect meme reference; hits corners surprisingly rarely.
**Commands:** `drawrect`, `drawtext`, `.timer`, `$rgb`, `$rand`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 16. Scrolling Starfield (2D parallax)
**Concept:** Stars at different speeds create depth; fast stars are bright/large.
**Why fun:** Space travel feel; infinite loop; easy to tune.
**Commands:** `drawdot`, `drawrect`, `.timer`, `$rand`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

## Games

### 17. Pong (Mouse vs AI)
**Concept:** Classic pong; player paddle follows `$mouse.y`; AI paddle tracks ball.
**Why fun:** Immediately playable; skill ceiling from AI difficulty tuning.
**Commands:** `drawrect`, `.timer`, `MMOVE`, `$mouse.y`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 18. Breakout / Arkanoid Clone
**Concept:** Ball bounces off bricks; mouse-controlled paddle; brick grid tracked with vars.
**Why fun:** Addictive loop; brick destruction is satisfying.
**Commands:** `drawrect`, `.timer`, `MMOVE`, `$mouse.x`, `%vars` for brick state
**Compatibility:** ✅ Works now
**Difficulty:** Hard (brick collision grid needs hash table or encoded vars)

---

### 19. Whack-a-Mole
**Concept:** Moles pop up at random positions; click to score; timer shortens each round.
**Why fun:** Playable in 5 seconds; high score loop is addictive.
**Commands:** `drawrect`, `drawtext`, `.timer`, `MDOWN`, `$rand`, `$mouse.x/y`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 20. Tic-Tac-Toe (vs AI)
**Concept:** 3×3 grid drawn on canvas; MDOWN picks cell; minimax AI opponent.
**Why fun:** Perfect implementation showcases AI logic; instantly familiar.
**Commands:** `drawline`, `drawtext`, `MDOWN`, `$mouse.x/y`, `%vars` for board
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 21. Simon Says
**Concept:** 4 colored quadrants flash a sequence; click them in order to extend.
**Why fun:** Pure memory game; escalating tension; audio-visual rhythm feel.
**Commands:** `drawrect`, `.timer`, `MDOWN`, `$rand`, `$mouse.x/y`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 22. Minesweeper
**Concept:** Grid of hidden cells; MDOWN reveals; flag with right-click; mine count.
**Why fun:** Complete classic puzzle game; logic-heavy.
**Commands:** `drawrect`, `drawtext`, `MDOWN`, `$rand`, `hmake/hadd/hget`
**Compatibility:** ✅ Works now
**Difficulty:** Hard

---

### 23. Reaction Timer
**Concept:** Green dot appears after random delay; click it as fast as possible; log score.
**Why fun:** Competitive self-testing; instant feedback.
**Commands:** `drawrect`, `drawtext`, `.timer`, `MDOWN`, `$ctime`, `$rand`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 24. Snake (keyboard-free version)
**Concept:** Snake changes direction by clicking quadrants of the window instead of arrow keys.
**Why fun:** Keyboard-free adaptation keeps it playable now; tile-based grid.
**Commands:** `drawrect`, `.timer`, `MDOWN`, `$mouse.x/y`, `%vars` for segments
**Compatibility:** ✅ Works now (click-to-turn adaptation)
**Difficulty:** Hard

---

### 25. Maze Generator + Solver
**Concept:** Generates a random maze via iterative DFS; then animates solving it.
**Why fun:** Watching the algorithm think is mesmerizing.
**Commands:** `drawrect`, `.timer`, `hmake/hadd/hget`, `$rand`
**Compatibility:** 🔧 Small gap — needs `$hget` enumeration or encoded %var grid
**Difficulty:** Hard

---

## Tools & Utilities with Visual Output

### 26. Pixel Art Editor
**Concept:** Grid of colored cells; click to paint; palette selector at bottom; export text.
**Why fun:** Creative tool; shareable output; shows off dialog + canvas integration.
**Commands:** `drawrect`, `MDOWN`, `MMOVE`, `$mouse.x/y`, `dialog`, hash tables
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 27. RGB Color Mixer
**Concept:** Three canvas sliders (painted rectangles) for R/G/B; preview swatch updates live.
**Why fun:** Interactive; useful; shows `$rgb()` visually.
**Commands:** `drawrect`, `drawtext`, `MDOWN`, `MMOVE`, `$rgb`, `$mouse.x`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 28. Calculator (Dialog)
**Concept:** Full button-grid calculator dialog with memory; evaluates via `$calc()`.
**Why fun:** Classic widget demo; shows dialog system power.
**Commands:** `dialog`, `button`, `edit`, `$did`, `did -ra`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 29. Bar Chart Visualizer
**Concept:** Draw a bar chart from a set of `%vars`; animate bars growing on load.
**Why fun:** Data visualization via drawing primitives; educational.
**Commands:** `drawrect`, `drawtext`, `.timer`, `$rgb`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 30. Fibonacci / Golden Spiral
**Concept:** Draws the classic golden ratio spiral using arcs approximated with line segments.
**Why fun:** Math meets beauty; satisfying reveal as spiral grows.
**Commands:** `drawline`, `drawrect`, `.timer`, `$sin`, `$cos`, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 31. Morse Code Encoder
**Concept:** Type text in an edit dialog; canvas draws dots/dashes and flashes a square.
**Why fun:** Tactile encoding feel; teaches Morse interactively.
**Commands:** `dialog`, `edit`, `button`, `drawrect`, `.timer`, `hadd/hget` for code table
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 32. Notepad with INI Save
**Concept:** Multi-line edit dialog; Save/Load buttons read/write an INI file.
**Why fun:** Demonstrates persistent storage; practical tool.
**Commands:** `dialog`, `edit multi`, `button`, `writeini`, `$readini`, `$did`, `did -ra`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 33. Trivia Quiz (Dialog)
**Concept:** Hash table stores Q&A; dialog shows question and 4 buttons; score tracked.
**Why fun:** Game feel from pure dialog + hash tables.
**Commands:** `dialog`, `button`, `text`, `hmake/hadd/hget`, `%score`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 34. Flashcard App
**Concept:** INI file stores card decks; dialog flips front/back; tracks correct/wrong.
**Why fun:** Practical utility; shows real-world mIRC scripting patterns.
**Commands:** `dialog`, `button`, `writeini`, `$readini`, `%vars`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 35. Password Generator
**Concept:** Dialog with length slider and charset checkboxes; generates via `$rand`+`$chr`.
**Why fun:** Immediately useful; shows char math.
**Commands:** `dialog`, `check`, `edit`, `button`, `$rand`, `$chr`, `$str`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

## IRC / Event-Driven (needs live IRC)

### 36. Word Frequency Tracker
**Concept:** `ON *:TEXT` counts words into a hash table; draws live bar chart on canvas.
**Why fun:** Real-time data visualization from live chat.
**Commands:** `on *:TEXT`, `hadd/hget`, `drawrect`, `drawtext`
**Compatibility:** 🏗️ Large gap — needs real IRC socket
**Difficulty:** Medium

---

### 37. Nick Activity Heatmap
**Concept:** Tracks message timestamps per nick; draws a grid heatmap by hour.
**Why fun:** Visual analytics from passive lurking.
**Commands:** `on *:TEXT`, `hadd`, `drawrect`, `$asctime`
**Compatibility:** 🏗️ Large gap — needs real IRC socket
**Difficulty:** Hard

---

### 38. Flood Protector Bot
**Concept:** Counts lines/sec per nick; kicks/bans on threshold.
**Why fun:** Classic mIRC utility; still relevant for bot ops.
**Commands:** `on *:TEXT`, `hadd`, `$ctime`, IRC commands (`kick`, `ban`)
**Compatibility:** 🏗️ Large gap — needs real IRC socket + op
**Difficulty:** Medium

---

### 39. Auto-Greeter
**Concept:** `ON *:JOIN` checks nick against a hash table; sends personalized greeting.
**Why fun:** Classic "bot buddy" script; nostalgia factor.
**Commands:** `on *:JOIN`, `hadd/hget`, `msg`
**Compatibility:** 🏗️ Large gap — needs real IRC socket
**Difficulty:** Easy

---

### 40. Seen Tracker
**Concept:** Logs last-seen time per nick; `!seen nick` reports it.
**Why fun:** Useful bot feature; pure hash + time math.
**Commands:** `on *:TEXT`, `on *:JOIN`, `on *:PART`, `hadd`, `$ctime`, `$asctime`
**Compatibility:** 🏗️ Large gap — needs real IRC socket
**Difficulty:** Easy

---

## Advanced / Stretch Goals

### 41. Snake (keyboard-driven)
**Concept:** Classic snake with arrow-key direction changes.
**Why fun:** Definitive casual game; keyboard is the natural input.
**Commands:** `drawrect`, `.timer`, `KEYDOWN` (missing)
**Compatibility:** 🏗️ Large gap — needs `KEYDOWN` event
**Difficulty:** Medium after keyboard

---

### 42. Sprite Animator
**Concept:** Load pixel frames from INI; play animation on canvas; edit frames in dialog.
**Why fun:** Creative tool; bridges data storage and drawing.
**Commands:** `drawrect`, `dialog`, `writeini`, `.timer`
**Compatibility:** ✅ Works now (INI as sprite sheet)
**Difficulty:** Hard

---

### 43. Image Mosaic (drawpic)
**Concept:** Load a user URL image and tile it across a picture window.
**Why fun:** Eye-catching visual; shows web asset integration.
**Commands:** `drawpic` (missing)
**Compatibility:** 🏗️ Large gap — `drawpic` not implemented
**Difficulty:** Medium after drawpic

---

### 44. Audio Visualizer
**Concept:** Beat-driven bars react to audio amplitude in real time.
**Why fun:** Flashy; common demo scene staple.
**Commands:** Web Audio API bridge needed (no mIRC equivalent)
**Compatibility:** 🏗️ Large gap — needs custom audio subsystem
**Difficulty:** Hard

---

### 45. Drag-and-Drop Shape Builder
**Concept:** MDOWN picks nearest shape; MMOVE drags it; MUP drops it.
**Why fun:** Interactive canvas manipulation; requires hit-testing.
**Commands:** `drawrect`, `drawline`, `MDOWN`, `MMOVE`, `MUP`, `$mouse.x/y`, `%vars`
**Compatibility:** ✅ Works now
**Difficulty:** Hard

---

### 46. Analog VU Meter
**Concept:** Needle swings to random value (simulated signal); smooth animation.
**Why fun:** Retro hardware aesthetic; smooth arc needle.
**Commands:** `drawline`, `drawrect`, `.timer`, `$sin`, `$cos`, `$rand`
**Compatibility:** ✅ Works now
**Difficulty:** Easy

---

### 47. Typing Speed Test (Dialog)
**Concept:** Shows a sentence; user types in edit; measures WPM and accuracy.
**Why fun:** Self-improvement; competitive.
**Commands:** `dialog`, `edit`, `button`, `$ctime`, `$len`, `$mid`, `$rand`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 48. Cellular Automaton (Rule 110)
**Concept:** 1D CA; each row is next generation; scrolls down the canvas.
**Why fun:** Turing-complete from 3-cell neighborhood rules.
**Commands:** `drawrect`, `.timer`, `%vars` for row state, `$calc`
**Compatibility:** ✅ Works now
**Difficulty:** Medium

---

### 49. Mandelbrot Set Renderer
**Concept:** Renders fractal iteratively, tile by tile via timer to avoid blocking.
**Why fun:** Math classic; zoom is rewarding.
**Commands:** `drawdot`, `.timer`, `$calc`, `$rgb`
**Compatibility:** 🔧 Small gap — no complex number ops; must encode as `$calc` expressions; very slow
**Difficulty:** Hard

---

### 50. Flowfield / Perlin Noise Arrows
**Concept:** Grid of arrows pointing in directions driven by noise; particles follow the field.
**Why fun:** Organic flowing visual; screensaver-quality.
**Commands:** `drawline`, `.timer`, `$sin`, `$cos`, `$calc`
**Compatibility:** 🔧 Small gap — no native Perlin noise; can fake with `$sin($x*$y)` field
**Difficulty:** Hard

---

## Summary by Compatibility

| Tag | Count |
|-----|-------|
| ✅ Works now | 36 |
| 🔧 Small gap | 6 |
| 🏗️ Large gap | 8 |
