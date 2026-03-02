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
  "Paint Canvas": `alias start {
  window -pz @paint 0 0 420 320
  drawrect -fr @paint $rgb(10,12,18) 0 0 420 320
  set %painting 0
  set %color $rgb(255,120,0)
}

on *:MDOWN:@paint {
  set %painting 1
  drawdot -r @paint %color 6 $mouse.x $mouse.y
}

on *:MUP:@paint {
  set %painting 0
}

on *:MMOVE:@paint {
  if (%painting == 1) {
    drawdot -r @paint %color 6 $mouse.x $mouse.y
  }
}`,
  "Conway's Life": `alias start {
  window -pz @life 0 0 400 300
  set %cols 40
  set %rows 30
  set %cell 10
  hmake life
  hmake next
  lifeinit
  .timerlife 0 120 lifetick
}

alias lifeinit {
  var %i = 0
  var %max = $calc(%cols * %rows)
  while (%i < %max) {
    hadd life %i $rand(0,1)
    inc %i
  }
}

alias getcell {
  set %ret $hget(life,$1)
  if (%ret == "") { set %ret 0 }
}

alias lifeneighbors {
  var %idx = $1
  var %r = $int($calc(%idx / %cols))
  var %c = $calc(%idx - %r * %cols)
  set %sum 0
  var %dr = -1
  while (%dr <= 1) {
    var %dc = -1
    while (%dc <= 1) {
      if (%dr != 0 || %dc != 0) {
        var %nr = $calc(%r + %dr)
        var %nc = $calc(%c + %dc)
        if (%nr >= 0 && %nr < %rows && %nc >= 0 && %nc < %cols) {
          var %nidx = $calc(%nr * %cols + %nc)
          getcell %nidx
          set %sum $calc(%sum + %ret)
        }
      }
      inc %dc
    }
    inc %dr
  }
}

alias lifeevolve {
  var %i = 0
  var %max = $calc(%cols * %rows)
  while (%i < %max) {
    getcell %i
    set %cur %ret
    lifeneighbors %i
    if (%cur == 1 && (%sum == 2 || %sum == 3)) {
      hadd next %i 1
    }
    elseif (%cur == 0 && %sum == 3) {
      hadd next %i 1
    }
    else {
      hadd next %i 0
    }
    inc %i
  }

  var %i = 0
  while (%i < %max) {
    hadd life %i $hget(next,%i)
    inc %i
  }
}

alias lifetick {
  drawrect -fr @life $rgb(10,12,18) 0 0 400 300
  var %i = 0
  var %max = $calc(%cols * %rows)
  while (%i < %max) {
    getcell %i
    if (%ret == 1) {
      var %r = $int($calc(%i / %cols))
      var %c = $calc(%i - %r * %cols)
      drawrect -fr @life $rgb(80,220,120) $calc(%c * %cell) $calc(%r * %cell) %cell %cell
    }
    inc %i
  }
  lifeevolve
}`,
  "Regex Tester": `dialog regtest {
  title "Regex Tester"
  edit "/nixrc/i", 1, 8 8 220 12
  edit "hello nixrc world", 2, 8 28 220 12
  button "Test", 3, 8 48 50 12
  text "Result:", 4, 8 68 240 20
}

alias start {
  dialog -m regtest regtest
}

on *:DIALOG:regtest:sclick:3 {
  var %pat = $did(regtest,1)
  var %str = $did(regtest,2)
  var %n = $regex(%str,%pat)
  if (%n > 0) {
    did -ra regtest 4 Matches: $regml(0)
  }
  else {
    did -ra regtest 4 No match
  }
}`,
  "IRC Echo Bot": `alias start {
  echo [echo-bot] Playground stub: IRC socket bridge is not enabled yet.
  echo [echo-bot] Use /server and /join when IRC networking lands.
  echo [echo-bot] If someone says !hello in #nixrc, this bot would reply.
}

on *:TEXT:!hello:#nixrc {
  msg #nixrc Hello, $nick ! Welcome to nixrc.
}

on *:TEXT:!ping:#nixrc {
  msg #nixrc $nick : Pong!
}

on *:JOIN:#nixrc {
  msg #nixrc Welcome, $nick !
}`,
  "Flood Fill": `alias start {
  window -pz @fill 0 0 420 300
  drawrect -fr @fill $rgb(10,12,18) 0 0 420 300
  drawrect -r @fill $rgb(255,80,80) 20 20 180 120
  drawrect -r @fill $rgb(80,160,255) 220 20 180 120
  drawrect -r @fill $rgb(80,220,120) 20 160 180 120
  drawrect -r @fill $rgb(255,200,80) 220 160 180 120
  set %fillcol 0
}

on *:MDOWN:@fill {
  inc %fillcol
  if (%fillcol == 1) {
    drawfill -r @fill $rgb(255,120,0) $rgb(10,12,18) $mouse.x $mouse.y
  }
  elseif (%fillcol == 2) {
    drawfill -r @fill $rgb(200,80,255) $rgb(10,12,18) $mouse.x $mouse.y
  }
  elseif (%fillcol == 3) {
    drawfill -r @fill $rgb(0,220,200) $rgb(10,12,18) $mouse.x $mouse.y
  }
  else {
    set %fillcol 0
  }
}`,
};
