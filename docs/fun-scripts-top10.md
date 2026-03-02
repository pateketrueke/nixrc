# Fun mIRC Scripts — Top 10 Ranked

> Shortlist from `fun-scripts-catalog.md`. All top 10 require only what nixrc already supports.
>
> **Rank formula:** Fun (40%) + Visual novelty (30%) + Feasibility in current runtime (30%)
>
> Scores are out of 100. Only ✅ "Works now" candidates were ranked
> (🔧/🏗️ candidates are omitted until runtime gaps close).

---

## Ranked List

| Rank | Script | Fun | Visual | Feasibility | **Score** | Status |
|------|--------|-----|--------|-------------|-----------|--------|
| 1 | 3D Starfield / Warp Speed | 85 | 95 | 95 | **91.0** | ✅ Ready |
| 2 | Particle Fireworks | 85 | 95 | 95 | **91.0** | ✅ Ready |
| 3 | Matrix Digital Rain | 85 | 95 | 95 | **91.0** | ✅ Ready |
| 4 | Breakout / Arkanoid | 90 | 80 | 90 | **87.0** | ✅ Ready |
| 5 | Spirograph | 75 | 95 | 100 | **88.5** | ✅ Ready |
| 6 | Pong (Mouse vs AI) | 90 | 80 | 95 | **88.5** | ✅ Ready |
| 7 | Whack-a-Mole | 85 | 75 | 100 | **86.5** | ✅ Ready |
| 8 | Pixel Art Editor | 80 | 80 | 95 | **84.5** | ✅ Ready |
| 9 | Bouncing Ball Physics | 75 | 80 | 100 | **84.0** | ✅ Ready |
| 10 | Simon Says | 80 | 75 | 95 | **83.5** | ✅ Ready |

---

## Top 3 — Quick Wins (implement first)

These three share the highest score (91.0) and are the easiest to ship because:
- Pure timer + drawing loop — no state machine complexity
- No user interaction required beyond starting the demo
- Visually stunning from line 1

### #1 — 3D Starfield / Warp Speed

**What it does:** Simulates flying through a star field. Each star has an (x, y, z) position.
Per frame: `z` decreases, projected screen coords are `sx = x/z * W`, `sy = y/z * H`.
Star size grows as z → 0. On MDOWN the speed multiplies for warp effect.

**Key identifiers:** `$sin`, `$cos`, `$calc`, `$rand`, `$rgb`, `drawdot`, `drawrect`
**Events:** `.timer`, `MDOWN`
**Estimated LOC:** ~60
**Plan file:** `.journal/2026-03-02/plans/07-starfield.md`

---

### #2 — Particle Fireworks

**What it does:** MDOWN at any point launches a firework. After a short rise phase it bursts
into N particles (colors vary by `$rgb`). Each particle has vx/vy and decays under gravity.
Particles fade by drawing dark transparent rects each frame.

**Key identifiers:** `$rand`, `$rgb`, `$calc`, `drawdot`, `drawrect`, `$mouse.x/y`
**Events:** `.timer`, `MDOWN`
**Estimated LOC:** ~80
**Plan file:** `.journal/2026-03-02/plans/08-fireworks.md`

---

### #3 — Matrix Digital Rain

**What it does:** 40+ columns of falling characters. Each column has a head (bright green)
and a tail that fades to dark green. Characters randomize each tick. Column speed varies.
Background is near-black `drawrect` to create fade trail.

**Key identifiers:** `$rand`, `$chr`, `drawrect`, `drawtext`, `$rgb`
**Events:** `.timer`
**Estimated LOC:** ~50
**Plan file:** `.journal/2026-03-02/plans/09-matrix-rain.md`

---

## #4–10 — Next Wave

### #4 — Breakout / Arkanoid (Score: 87.0)
Ball-and-paddle with a brick grid. Mouse controls paddle. Brick state stored in `%vars`
encoded as a flat string or hash table. Win/lose detection, score display.
**Main challenge:** Brick-ball collision on a 10×5 grid.

### #5 — Spirograph (Score: 88.5)
Hypotrochoid: `x = (R-r)*cos(t) + d*cos((R-r)/r * t)`. Timer increments `t` by small steps,
connecting points with `drawline`. A dialog lets user pick R, r, d before starting.
**Main challenge:** Stopping condition (when curve closes = LCM-based period).

### #6 — Pong Mouse vs AI (Score: 88.5)
Bouncing ball with velocity; left paddle tracks `$mouse.y`; right paddle uses simple
AI (move toward ball.y each frame, capped speed). Score displayed with `drawtext`.
**Main challenge:** Ball speed increase and serve direction after score.

### #7 — Whack-a-Mole (Score: 86.5)
N holes drawn as circles. Timer randomly activates one; activated hole shows a "mole"
(filled circle). `MDOWN` checks if click is inside active mole. Round timer shortens
each level. Highest scoring, lowest implementation risk of any game here.

### #8 — Pixel Art Editor (Score: 84.5)
Fixed grid (e.g. 32×32 cells). `MDOWN`/`MMOVE` paints selected color.
Palette shown at bottom as colored drawrects. Hash table maps `x,y` to color.
Stretch: copy grid to clipboard as hex string via a dialog.

### #9 — Bouncing Ball Physics (Score: 84.0)
5–10 balls, each with vx/vy/radius. Per frame: update position, reverse on wall hit,
apply gravity. Simple elastic collision between balls. Visually lush for ~30 lines of logic.

### #10 — Simon Says (Score: 83.5)
4 colored quadrants. Timer drives sequence: flash next color, pause, wait for click.
`MDOWN` determines which quadrant was clicked. Wrong click = game over, display score.
Sequence stored as `%s1 %s2 … %sN` with `%len` tracking depth.

---

## Runtime Gaps to Close Next (for 🔧 candidates)

| Gap | Unlocks |
|----|---------|
| `KEYDOWN` event | Snake, Space Invaders, any keyboard game |
| `drawpic` command | Image mosaic, sprite display |
| Pixel batch draw | Plasma effect, Mandelbrot (performance) |
| Perlin/noise function | Flowfield, terrain generation |
