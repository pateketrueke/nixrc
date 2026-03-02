const demoScript = `; nixrc preview
alias init {
  echo -a nixrc browser runtime online
  timerclock 0 1000 clock
}

alias clock {
  var %a = $calc($ctime * 6)
  drawline -r @clock $rgb(77,166,255) 2 50 50 $calc(50 + $sin(%a) * 40) $calc(50 - $cos(%a) * 40)
}

on *:start:{ init }`;

const target = document.getElementById("typewriter");
const yearNode = document.getElementById("year");
let i = 0;

function typeNext() {
  if (!target || i >= demoScript.length) return;
  target.textContent += demoScript[i];
  i += 1;
  const delay = demoScript[i - 1] === "\n" ? 40 : 16;
  setTimeout(typeNext, delay);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
if (yearNode) yearNode.textContent = new Date().getFullYear();
setTimeout(typeNext, 250);
