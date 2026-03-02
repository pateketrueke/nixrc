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
  "Widget Toolkit": `alias start {
  hmake ui
  window -pz @ui 0 0 440 320
  set %ids "BTN1 BTN2 CHK1 SLD1"
  set %skin 1
  set %drag 0
  set %hit ""
  set %tiles "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='192'%20height='64'%3E%3Crect%20x='0'%20y='0'%20width='32'%20height='32'%20fill='%23384d7a'/%3E%3Crect%20x='32'%20y='0'%20width='32'%20height='32'%20fill='%234c67a5'/%3E%3Crect%20x='64'%20y='0'%20width='32'%20height='32'%20fill='%232f3f66'/%3E%3Crect%20x='96'%20y='0'%20width='32'%20height='32'%20fill='%23343b4f'/%3E%3Crect%20x='102'%20y='6'%20width='20'%20height='20'%20fill='none'%20stroke='%239aa8d0'%20stroke-width='2'/%3E%3Crect%20x='128'%20y='0'%20width='32'%20height='32'%20fill='%233f6a43'/%3E%3Crect%20x='134'%20y='6'%20width='20'%20height='20'%20fill='none'%20stroke='%23d8ffd8'%20stroke-width='2'/%3E%3Cpath%20d='M138%2017l5%205l10-11'%20stroke='%23d8ffd8'%20stroke-width='3'%20fill='none'/%3E%3Crect%20x='160'%20y='0'%20width='32'%20height='32'%20rx='8'%20fill='%23cfd6ea'/%3E%3Crect%20x='0'%20y='32'%20width='160'%20height='16'%20rx='8'%20fill='%2330394d'/%3E%3Crect%20x='0'%20y='50'%20width='192'%20height='14'%20fill='%231a1f2d'/%3E%3C/svg%3E"
  loadpic %tiles
  ui-seed BTN1 button 24 44 140 32 "Run Script"
  ui-seed BTN2 button 24 88 140 32 "Toggle Skin"
  ui-seed CHK1 check 24 146 20 20 "Dark FX"
  ui-seed SLD1 slider 24 206 240 20 "Volume"
  hadd SLD1 min 0
  hadd SLD1 max 100
  hadd SLD1 val 72
  hadd CHK1 checked 0
  ui-draw
}

alias ui-seed {
  hadd $1 type $2
  hadd $1 x $3
  hadd $1 y $4
  hadd $1 w $5
  hadd $1 h $6
  hadd $1 label $7
  hadd $1 state normal
}

alias ui-clear-states {
  var %i = 1
  var %n = $numtok(%ids,32)
  while (%i <= %n) {
    var %id = $gettok(%ids,%i,32)
    if (%id != SLD1 || %drag == 0) {
      hadd %id state normal
    }
    inc %i
  }
}

alias ui-hit-test {
  var %mx = $1
  var %my = $2
  var %mode = $3
  set %hit ""
  var %i = 1
  var %n = $numtok(%ids,32)
  while (%i <= %n) {
    var %id = $gettok(%ids,%i,32)
    var %x = $hget(%id,x)
    var %y = $hget(%id,y)
    var %w = $hget(%id,w)
    var %h = $hget(%id,h)
    if (%mx >= %x && %mx <= $calc(%x + %w) && %my >= %y && %my <= $calc(%y + %h)) {
      set %hit %id
      if (%id != SLD1) {
        hadd %id state %mode
      }
    }
    inc %i
  }
}

alias ui-slider-from-x {
  var %id = $1
  var %mx = $2
  var %x = $hget(%id,x)
  var %w = $hget(%id,w)
  var %min = $hget(%id,min)
  var %max = $hget(%id,max)
  var %pct = $calc((%mx - %x) / %w)
  if (%pct < 0) { set %pct 0 }
  if (%pct > 1) { set %pct 1 }
  var %val = $int($calc(%min + (%max - %min) * %pct))
  hadd %id val %val
}

alias ui-draw-button {
  var %x = $hget($1,x)
  var %y = $hget($1,y)
  var %w = $hget($1,w)
  var %h = $hget($1,h)
  var %label = $hget($1,label)
  var %state = $hget($1,state)
  if (%skin == 1) {
    var %sx = 0
    if (%state == hover) { set %sx 32 }
    if (%state == pressed) { set %sx 64 }
    drawpic @ui %x %y %w %h %sx 0 32 32 %tiles
  }
  else {
    var %bg = $rgb(56,77,122)
    if (%state == hover) { set %bg $rgb(76,103,165) }
    if (%state == pressed) { set %bg $rgb(47,63,102) }
    drawrect -fr @ui %bg %x %y %w %h
  }
  drawtext @ui $rgb(230,236,255) JetBrainsMono 12 $calc(%x + 12) $calc(%y + 21) %label
}

alias ui-draw-check {
  var %x = $hget($1,x)
  var %y = $hget($1,y)
  var %w = $hget($1,w)
  var %h = $hget($1,h)
  var %label = $hget($1,label)
  var %checked = $hget($1,checked)
  if (%skin == 1) {
    if (%checked == 1) {
      drawpic @ui %x %y %w %h 128 0 32 32 %tiles
    }
    else {
      drawpic @ui %x %y %w %h 96 0 32 32 %tiles
    }
  }
  else {
    drawrect -r @ui $rgb(154,168,208) %x %y %w %h
    if (%checked == 1) {
      drawline -r @ui $rgb(216,255,216) 2 $calc(%x + 4) $calc(%y + 10) $calc(%x + 9) $calc(%y + 15)
      drawline -r @ui $rgb(216,255,216) 2 $calc(%x + 9) $calc(%y + 15) $calc(%x + 16) $calc(%y + 5)
    }
  }
  drawtext @ui $rgb(230,236,255) JetBrainsMono 12 $calc(%x + 30) $calc(%y + 15) %label
}

alias ui-draw-slider {
  var %x = $hget($1,x)
  var %y = $hget($1,y)
  var %w = $hget($1,w)
  var %h = $hget($1,h)
  var %min = $hget($1,min)
  var %max = $hget($1,max)
  var %val = $hget($1,val)
  var %pct = 0
  if (%max > %min) {
    set %pct $calc((%val - %min) / (%max - %min))
  }
  var %thumb = $calc(%x + %pct * (%w - 20))
  if (%skin == 1) {
    drawpic @ui %x $calc(%y + 2) %w 16 0 32 160 16 %tiles
    drawpic @ui %thumb $calc(%y - 6) 20 20 160 0 32 32 %tiles
  }
  else {
    drawrect -fr @ui $rgb(48,57,77) %x $calc(%y + 7) %w 6
    drawrect -fr @ui $rgb(207,214,234) %thumb %y 20 20
  }
  drawtext @ui $rgb(230,236,255) JetBrainsMono 12 %x $calc(%y + 38) $hget($1,label) %val
}

alias ui-draw {
  drawrect -fr @ui $rgb(16,19,28) 0 0 440 320
  drawtext @ui $rgb(141,165,255) JetBrainsMono 15 24 26 Canvas Widget Toolkit
  var %i = 1
  var %n = $numtok(%ids,32)
  while (%i <= %n) {
    var %id = $gettok(%ids,%i,32)
    var %t = $hget(%id,type)
    if (%t == button) { ui-draw-button %id }
    if (%t == check) { ui-draw-check %id }
    if (%t == slider) { ui-draw-slider %id }
    inc %i
  }
  if (%skin == 1) {
    drawtext @ui $rgb(170,255,180) JetBrainsMono 11 24 302 Skin: tiled drawpic
  }
  else {
    drawtext @ui $rgb(255,220,150) JetBrainsMono 11 24 302 Skin: geometric fallback
  }
}

on *:MMOVE:@ui {
  if (%drag == 1) {
    ui-slider-from-x SLD1 $mouse.x
  }
  ui-clear-states
  ui-hit-test $mouse.x $mouse.y hover
  ui-draw
}

on *:MDOWN:@ui {
  set %drag 0
  ui-clear-states
  ui-hit-test $mouse.x $mouse.y pressed
  if (%hit == SLD1) {
    set %drag 1
    ui-slider-from-x SLD1 $mouse.x
  }
  ui-draw
}

on *:MUP:@ui {
  if (%drag == 1) {
    ui-slider-from-x SLD1 $mouse.x
    set %drag 0
  }
  if (%hit == BTN1) {
    echo [ui] Run Script clicked
  }
  if (%hit == BTN2) {
    if (%skin == 1) { set %skin 0 }
    else { set %skin 1 }
  }
  if (%hit == CHK1) {
    if ($hget(CHK1,checked) == 1) { hadd CHK1 checked 0 }
    else { hadd CHK1 checked 1 }
  }
  ui-clear-states
  ui-hit-test $mouse.x $mouse.y hover
  ui-draw
}`,
};
