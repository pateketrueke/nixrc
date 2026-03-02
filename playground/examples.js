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
  window -pz @clock 0 0 400 400
  .timerclock 0 1000 tick
}

alias tick {
  drawrect -fr @clock $rgb(16,20,30) 0 0 400 400
  drawdot -r @clock $rgb(30,35,50) 150 200 200
  drawdot -r @clock $rgb(16,20,30) 148 200 200
  drawline -r @clock $rgb(60,70,90) 2 200 52 200 60
  drawline -r @clock $rgb(60,70,90) 2 200 340 200 348
  drawline -r @clock $rgb(60,70,90) 2 52 200 60 200
  drawline -r @clock $rgb(60,70,90) 2 340 200 348 200
  var %s = $calc($asctime(s) * 6)
  var %m = $calc($asctime(n) * 6 + %s / 60)
  var %h = $calc($asctime(H) * 30 + %m / 12)
  drawhand %s 100 $rgb(255,120,80)
  drawhand %m 80 $rgb(77,166,255)
  drawhand %h 50 $rgb(255,255,255)
  drawtext @clock $rgb(77,166,255) JetBrainsMono 16 160 360 $asctime(H:nn:ss)
}

alias drawhand {
  var %a = $1
  var %len = $2
  var %col = $3
  var %x = $calc(200 + %len * $sin(%a))
  var %y = $calc(200 - %len * $cos(%a))
  drawline -r @clock %col 2 200 200 %x %y
}`,
  "Dialog Counter": `dialog counter {
  title "Counter"
  text "0", 1, 8 8 20 10
  button "-", 2, 8 24 12 10
  button "+", 3, 24 24 12 10
}

on *:DIALOG:counter:sclick:2 {
  dec %count
  did -ra counter 1 %count
}

on *:DIALOG:counter:sclick:3 {
  inc %count
  did -ra counter 1 %count
}

alias start {
  set %count 0
  dialog -m counter counter
}`,
};
