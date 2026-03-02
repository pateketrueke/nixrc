export const EXAMPLES = {
  "Bouncing Ball": `alias start {
  window -pz @ball 0 0 420 260
  set %x 40
  set %y 40
  set %dx 4
  set %dy 3
  .timerball 0 40 drawframe
}

alias drawframe {
  drawrect -fr @ball $rgb(10,12,18) 0 0 420 260
  drawdot -r @ball $rgb(255,120,0) 8 %x %y
  set %x $calc(%x + %dx)
  set %y $calc(%y + %dy)
  if (%x > 410 || %x < 10) { set %dx $calc(%dx * -1) }
  if (%y > 250 || %y < 10) { set %dy $calc(%dy * -1) }
}`,
  "Clock": `alias start {
  window -pz @clock 0 0 400 220
  .timerclock 0 500 tick
}

alias tick {
  drawrect -fr @clock $rgb(16,20,30) 0 0 400 220
  drawtext @clock $rgb(77,166,255) JetBrainsMono 28 30 120 nixrc / mirx live
}`,
  "Dialog Counter": `dialog counter {
  title "Counter"
  text "0", 1, 8 8 20 10
  button "-", 2, 8 24 12 10
  button "+", 3, 24 24 12 10
}

alias start {
  dialog -m counter counter
}`,
};
