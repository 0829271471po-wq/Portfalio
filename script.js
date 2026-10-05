// ===== Click sound (WebAudio, no file needed) =====
let soundOn = true;
try { soundOn = localStorage.getItem("sound") !== "off"; } catch {}
let audioCtx;
function playClick() {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {}
}
const soundBtn = document.getElementById("soundBtn");
function renderSound() {
  soundBtn.classList.toggle("off", !soundOn);
  soundBtn.innerHTML = `<i class="fa-solid ${soundOn ? "fa-volume-high" : "fa-volume-xmark"}"></i>`;
}
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  try { localStorage.setItem("sound", soundOn ? "on" : "off"); } catch {}
  renderSound();
});
renderSound();

// ===== Intro: circuit traces connect to the chip =====
const intro = document.getElementById("intro");
const board = document.getElementById("board");
const fillEl = document.getElementById("introFill");
const pctEl = document.getElementById("introPct");
const statusEl = document.getElementById("introStatus");
const bootEl = document.getElementById("boot");
const SVGNS = "http://www.w3.org/2000/svg";
const traces = [];
const sides = [
  { pin: (i) => [264 + i * 18, 150], out: [0, -1], perp: [1, 0], reach: 130 },
  { pin: (i) => [264 + i * 18, 250], out: [0, 1], perp: [1, 0], reach: 60 },  // short: keeps clear of the name below
  { pin: (i) => [250, 164 + i * 18], out: [-1, 0], perp: [0, 1], reach: 230 },
  { pin: (i) => [350, 164 + i * 18], out: [1, 0], perp: [0, 1], reach: 230 },
];
const traceGroup = document.getElementById("traces");
sides.forEach((s) => {
  for (let i = 0; i < 5; i++) {
    const [sx, sy] = s.pin(i);
    const [ox, oy] = s.out, [px, py] = s.perp;
    const a = 22 + Math.random() * 20;          // clear the orbit rings first
    const d = (8 + Math.random() * 24) * (i < 2 ? -1 : i > 2 ? 1 : 0); // outer pins fan outward
    const b = s.reach * (0.4 + Math.random() * 0.5);
    const p1 = [sx + ox * a, sy + oy * a];
    const p2 = [p1[0] + ox * Math.abs(d) + px * d, p1[1] + oy * Math.abs(d) + py * d];
    const p3 = [p2[0] + ox * b, p2[1] + oy * b];
    const dAttr = `M${sx} ${sy} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} L${p3[0]} ${p3[1]}`;
    const path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", dAttr);
    path.setAttribute("class", "trace");
    const pulse = document.createElementNS(SVGNS, "path");
    pulse.setAttribute("d", dAttr);
    pulse.setAttribute("class", "pulse");
    pulse.style.animationDelay = (Math.random() * -1.6).toFixed(2) + "s";
    const pad = document.createElementNS(SVGNS, "circle");
    pad.setAttribute("cx", p3[0]);
    pad.setAttribute("cy", p3[1]);
    pad.setAttribute("r", 4);
    pad.setAttribute("class", "pad");
    traceGroup.append(path, pulse, pad);
    traces.push({ path, pad, at: Math.random() * 0.75 });
  }
});
traces.forEach((t) => {
  t.len = t.path.getTotalLength();
  t.path.style.strokeDasharray = t.len;
  t.path.style.strokeDashoffset = t.len;
});
const bootLines = [
  [0, "> power on ............ <span class=\"ok\">ok</span>"],
  [18, "> load profile.json ... <span class=\"ok\">ok</span>"],
  [38, "> mount /projects ..... <span class=\"ok\">ok</span>"],
  [58, "> link hw + sw ........ <span class=\"ok\">ok</span>"],
  [80, "> start journey.exe ... <span class=\"ok\">ok</span>"],
];
const stages = [[0, "INITIALIZING"], [25, "LOADING ASSETS"], [55, "CONNECTING CIRCUITS"], [85, "PREPARING SURFACES"], [100, "READY"]];
let pct = 0;
let introDone = false;
function endIntro() {
  if (introDone) return;
  introDone = true;
  clearInterval(introTimer);
  board.classList.add("lit");
  intro.classList.add("done");
  document.body.classList.remove("loading");
  document.body.classList.add("ready");
  setTimeout(typeLoop, 1500);
  setTimeout(revealCheck, 60);
  onScroll();
}
const introTimer = setInterval(() => {
  pct = Math.min(100, pct + 1.2 + Math.random() * 2.6);
  const f = pct / 100;
  fillEl.style.width = pct + "%";
  pctEl.textContent = Math.floor(pct) + "%";
  statusEl.textContent = stages.filter((s) => pct >= s[0]).pop()[1];
  bootEl.innerHTML = bootLines.filter((l) => pct >= l[0]).map((l) => l[1]).join("\n");
  traces.forEach((t) => {
    const k = Math.max(0, Math.min(1, (f - t.at) / 0.25));
    t.path.style.strokeDashoffset = t.len * (1 - k);
    t.path.classList.toggle("on", k >= 1);
    t.pad.classList.toggle("on", k >= 1);
  });
  if (pct >= 100) {
    clearInterval(introTimer);
    board.classList.add("lit");
    setTimeout(endIntro, 1100);
  }
}, 50);
intro.addEventListener("click", endIntro);

// ===== Custom cursor + click effect =====
const dot = document.getElementById("cursorDot");
const ring = document.getElementById("cursorRing");
const bgGlow = document.getElementById("bgGlow");
let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
addEventListener("pointermove", (e) => {
  mx = e.clientX; my = e.clientY;
  document.body.classList.add("has-cursor");
  dot.style.transform = `translate(${mx}px, ${my}px)`;
  bgGlow.style.setProperty("--x", mx + "px");
  bgGlow.style.setProperty("--y", my + "px");
});
(function follow() {
  rx += (mx - rx) * 0.18;
  ry += (my - ry) * 0.18;
  ring.style.transform = `translate(${rx}px, ${ry}px)`;
  requestAnimationFrame(follow);
})();
document.addEventListener("pointerover", (e) => {
  ring.classList.toggle("hover", !!e.target.closest("a, button, input, textarea, .tile, .work, .id-card"));
});
addEventListener("pointerdown", (e) => {
  ring.classList.add("down");
  playClick();
  const r = document.createElement("span");
  r.className = "ripple";
  r.style.left = e.clientX + "px";
  r.style.top = e.clientY + "px";
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 650);
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span");
    const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
    const d = 22 + Math.random() * 18;
    s.className = "spark";
    s.style.left = e.clientX + "px";
    s.style.top = e.clientY + "px";
    s.style.setProperty("--dx", Math.cos(a) * d + "px");
    s.style.setProperty("--dy", Math.sin(a) * d + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }
});
addEventListener("pointerup", () => ring.classList.remove("down"));

// ===== Nav: sliding pill, progress, active section =====
const nav = document.getElementById("nav");
const pill = document.getElementById("pill");
const pillBg = document.getElementById("pillBg");
const navLinks = [...pill.querySelectorAll("a")];
const navIds = new Set(navLinks.map((a) => a.getAttribute("href").slice(1)));
const sections = [...document.querySelectorAll("main section[id]")];
document.getElementById("burger").addEventListener("click", () => pill.classList.toggle("open"));
navLinks.forEach((a) => a.addEventListener("click", () => pill.classList.remove("open")));
function currentIndex() {
  const y = scrollY + innerHeight / 3;
  let idx = 0;
  sections.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
  return idx;
}
const heroEl = document.getElementById("home");
function onScroll() {
  nav.classList.toggle("scrolled", scrollY > 30);
  // hero gently fades and lifts as it scrolls away
  const k = Math.min(1, scrollY / (innerHeight * 0.9));
  heroEl.style.setProperty("--fade", (1 - k * 0.85).toFixed(3));
  heroEl.style.setProperty("--shift", (-k * 60).toFixed(1) + "px");
  const max = document.documentElement.scrollHeight - innerHeight;
  document.getElementById("navProgress").style.setProperty("--p", (max > 0 ? (scrollY / max) * 100 : 0) + "%");
  let i = currentIndex();
  while (i > 0 && !navIds.has(sections[i].id)) i--;   // PDF section has no link
  const id = sections[i].id;
  navLinks.forEach((a) => {
    const on = a.getAttribute("href") === "#" + id;
    a.classList.toggle("active", on);
    if (on) { pillBg.style.left = a.offsetLeft + "px"; pillBg.style.width = a.offsetWidth + "px"; }
  });
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
document.fonts.ready.then(onScroll);
onScroll();
document.getElementById("upBtn").addEventListener("click", () => sections[Math.max(0, currentIndex() - 1)].scrollIntoView({ behavior: "smooth" }));
document.getElementById("downBtn").addEventListener("click", () => {
  const next = sections[currentIndex() + 1];
  if (next) next.scrollIntoView({ behavior: "smooth" });
});

// ===== Typed headline =====
const words = ["Future Engineer.", "Young Maker.", "Problem Solver.", "Curious Coder."];
const typed = document.getElementById("typed");
let wi = 0, ci = words[0].length, deleting = true;
function typeLoop() {
  typed.textContent = words[wi].slice(0, ci);
  if (deleting) {
    if (ci > 0) ci--; else { deleting = false; wi = (wi + 1) % words.length; }
  } else if (ci < words[wi].length) ci++;
  else { deleting = true; return setTimeout(typeLoop, 2000); }
  setTimeout(typeLoop, deleting ? 40 : 85);
}

// ===== Hanging Student ID: pendulum physics on a rope =====
// The card's clip point hangs from the bar on a rope of fixed length L.
// Gravity + an inextensible rope = natural swing; drag moves the clip point,
// release keeps the throw velocity, air damping lets it settle. The clip can
// never get further than L from the bar, so the card can't come off the rope.
const card = document.getElementById("idCard");
const idWrap = card.parentElement;
const ropeBase = document.getElementById("ropeBase");
const ropeStripe = document.getElementById("ropeStripe");
const ropeShadow = document.getElementById("ropeShadow");
const ropeClip = document.getElementById("ropeClip");
const CLIP_Y = 14;                 // clip point inside the card (matches transform-origin)
const G = 2200;                    // gravity, px/s²
const AIR = 2.2;                   // linear damping (settles in a few swings)
const ANG_K = 170, ANG_C = 15;     // card tilt spring / damping
const phys = { ax: 0, ay: 0, L: 0, rx: 0, ry: 0, x: 0, y: 0, vx: 0, vy: 0, ang: 0, av: 0, drag: false, gx: 0, gy: 0, running: false, last: 0 };

function layoutRig() {
  const w = idWrap.clientWidth;
  phys.ax = w / 2;
  phys.ay = 6;                                       // centre of the bar
  phys.rx = card.offsetLeft + card.offsetWidth / 2;  // rest clip position
  phys.ry = card.offsetTop + CLIP_Y;
  phys.L = phys.ry - phys.ay;
  if (!phys.drag) { phys.x = phys.rx; phys.y = phys.ry; phys.vx = phys.vy = 0; }
  render(0);
}
function clampToRope() {
  const dx = phys.x - phys.ax, dy = phys.y - phys.ay;
  const d = Math.hypot(dx, dy);
  if (d > phys.L) {
    const nx = dx / d, ny = dy / d;
    phys.x = phys.ax + nx * phys.L;
    phys.y = phys.ay + ny * phys.L;
    const vr = phys.vx * nx + phys.vy * ny;      // remove outward speed (rope is taut)
    if (vr > 0) { phys.vx -= vr * nx * 1.15; phys.vy -= vr * ny * 1.15; }
  }
}
function render(slackBend) {
  const dx = phys.x - phys.ax, dy = phys.y - phys.ay;
  const d = Math.hypot(dx, dy) || 1;
  // rope: quadratic curve; sags when slack, bows against the motion when moving
  const slack = Math.max(0, phys.L - d);
  const mx = (phys.ax + phys.x) / 2, my = (phys.ay + phys.y) / 2;
  const px = -dy / d, py = dx / d;                 // perpendicular to the rope
  const bow = Math.max(-28, Math.min(28, -(phys.vx * py - phys.vy * px) * 0.018 + (slackBend || 0)));
  const cx = mx + px * bow;
  const cy = my + py * bow + slack * 0.9;
  const dAttr = `M${phys.ax} ${phys.ay} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${phys.x.toFixed(1)} ${(phys.y - 2).toFixed(1)}`;
  ropeBase.setAttribute("d", dAttr);
  ropeStripe.setAttribute("d", dAttr);
  ropeShadow.setAttribute("d", dAttr);
  ropeClip.setAttribute("transform", `translate(${phys.x.toFixed(1)} ${(phys.y - 2).toFixed(1)}) rotate(${phys.ang.toFixed(2)})`);
  card.style.transform = `translate(${(phys.x - phys.rx).toFixed(2)}px, ${(phys.y - phys.ry).toFixed(2)}px) rotate(${phys.ang.toFixed(2)}deg)`;
  card.style.setProperty("--shine", (50 + phys.ang * 2.2).toFixed(1) + "%");
}
function step(dt) {
  if (!phys.drag) {
    phys.vy += G * dt;
    phys.vx -= phys.vx * AIR * dt;
    phys.vy -= phys.vy * AIR * dt;
    phys.x += phys.vx * dt;
    phys.y += phys.vy * dt;
    clampToRope();
  }
  // card follows the rope direction, plus a little lag from its own inertia
  const ropeDeg = -Math.atan2(phys.x - phys.ax, phys.y - phys.ay) * 180 / Math.PI;
  const target = Math.max(-38, Math.min(38, ropeDeg * 0.85 + phys.vx * 0.011));
  phys.av += (ANG_K * (target - phys.ang) - ANG_C * phys.av) * dt;
  phys.ang += phys.av * dt;
  if (phys.ang > 40) { phys.ang = 40; phys.av = Math.min(phys.av, 0); }
  if (phys.ang < -40) { phys.ang = -40; phys.av = Math.max(phys.av, 0); }
}
function loop(t) {
  const dt = Math.min(1 / 30, (t - phys.last) / 1000 || 0);
  phys.last = t;
  const sub = 4;
  for (let i = 0; i < sub; i++) step(dt / sub);
  render();
  const settled = !phys.drag && Math.abs(phys.vx) < 3 && Math.abs(phys.vy) < 3 && Math.abs(phys.av) < 1
    && Math.abs(phys.x - phys.rx) < 0.4 && Math.abs(phys.ang) < 0.15;
  if (settled) {
    phys.x = phys.rx; phys.y = phys.ry; phys.vx = phys.vy = phys.ang = phys.av = 0;
    render();
    phys.running = false;
    return;
  }
  requestAnimationFrame(loop);
}
function wake() {
  if (phys.running) return;
  phys.running = true;
  phys.last = performance.now();
  requestAnimationFrame(loop);
}
function localPoint(e) {
  const r = idWrap.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
let lastDrag = { x: 0, y: 0, t: 0 };
card.addEventListener("pointerdown", (e) => {
  if (e.button !== undefined && e.button > 0) return;
  e.preventDefault();
  try { card.setPointerCapture(e.pointerId); } catch {}
  const p = localPoint(e);
  phys.drag = true;
  phys.gx = p.x - phys.x;
  phys.gy = p.y - phys.y;
  phys.vx = phys.vy = 0;
  lastDrag = { x: phys.x, y: phys.y, t: performance.now() };
  card.classList.add("dragging");
  wake();
});
card.addEventListener("pointermove", (e) => {
  if (!phys.drag) return;
  const p = localPoint(e);
  phys.x = p.x - phys.gx;
  phys.y = p.y - phys.gy;
  clampToRope();                                   // can't pull the card off the rope
  const now = performance.now();
  const dt = Math.max(0.008, (now - lastDrag.t) / 1000);
  // smoothed throw velocity for the release
  phys.vx = phys.vx * 0.5 + ((phys.x - lastDrag.x) / dt) * 0.5;
  phys.vy = phys.vy * 0.5 + ((phys.y - lastDrag.y) / dt) * 0.5;
  lastDrag = { x: phys.x, y: phys.y, t: now };
});
function release() {
  if (!phys.drag) return;
  phys.drag = false;
  const sp = Math.hypot(phys.vx, phys.vy), max = 2600;
  if (sp > max) { phys.vx *= max / sp; phys.vy *= max / sp; }
  card.classList.remove("dragging");
  wake();
}
card.addEventListener("pointerup", release);
card.addEventListener("pointercancel", release);
card.addEventListener("lostpointercapture", release);
addEventListener("resize", () => { layoutRig(); });
layoutRig();
document.fonts.ready.then(layoutRig);
// a gentle swing-in once the page has opened
const rigReady = setInterval(() => {
  if (!document.body.classList.contains("ready")) return;
  clearInterval(rigReady);
  setTimeout(() => { layoutRig(); phys.vx = 520; wake(); }, 700);
}, 150);

// ===== Marquee: fill any width, slow constant speed =====
const mTrack = document.getElementById("mTrack");
const setHTML = mTrack.innerHTML;
function buildTrack() {
  mTrack.innerHTML = setHTML;
  while (mTrack.scrollWidth < innerWidth + 200) mTrack.insertAdjacentHTML("beforeend", setHTML);
  mTrack.insertAdjacentHTML("beforeend", mTrack.innerHTML);
  mTrack.style.setProperty("--dur", Math.round(mTrack.scrollWidth / 2 / 28) + "s");
}
buildTrack();
document.fonts.ready.then(buildTrack);
let rT;
addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(buildTrack, 200); });

// ===== Skill tiles + waveform =====
const wave = document.getElementById("wave");
for (let i = 0; i < 34; i++) {
  const b = document.createElement("i");
  b.style.setProperty("--h", 6 + Math.random() * 22 + "px");
  b.style.animationDelay = (Math.random() * -1.2).toFixed(2) + "s";
  b.style.animationDuration = (0.9 + Math.random() * 0.8).toFixed(2) + "s";
  wave.appendChild(b);
}
document.querySelectorAll(".tile").forEach((t) => {
  t.addEventListener("pointermove", (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", e.clientX - r.left + "px");
    t.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

// ===== About terminal: real typing animation =====
// Each command is typed character by character after the "$ " prompt, then
// "Enter" prints its output, then the next command starts. Loops forever.
const TERM_SCRIPT = [
  { cmd: "whoami", out: ["posarin — ม.6 สายวิทย์-คณิต"] },
  { cmd: "cat goal.txt", out: ["วิศวกรรมคอมพิวเตอร์ 🎯"] },
  { cmd: "ls skills/", out: ["python/  arduino/  web/", "math/    physics/  team/"] },
  { cmd: "./future.sh", out: ['<span class="ok">✓ ready to start</span>'] },
];
const PROMPT = '<span class="p">$</span> ';
const termBody = document.getElementById("termBody");
const termState = { done: [], typing: null, solid: false };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function drawTerm() {
  const cursor = `<span class="cur${termState.solid ? " solid" : ""}"></span>`;
  const lines = termState.done.slice();
  if (termState.typing !== null) lines.push(PROMPT + termState.typing + cursor);
  termBody.innerHTML = lines.join("\n");
}
async function typeCommand(cmd) {
  termState.typing = "";
  termState.solid = false;
  drawTerm();
  await wait(550);                                // prompt waits with a blinking cursor
  termState.solid = true;                         // cursor stays solid while keys are pressed
  for (const ch of cmd) {
    termState.typing += ch;
    drawTerm();
    await wait(ch === " " ? 140 : 55 + Math.random() * 75);
  }
  termState.solid = false;
  drawTerm();
  await wait(380);                                // brief pause before "Enter"
  termState.done.push(PROMPT + cmd);
  termState.typing = null;
}
async function runTerm() {
  if (termState.running) return;
  termState.running = true;
  for (;;) {
    termState.done = [];
    termBody.classList.remove("fade");
    for (const step of TERM_SCRIPT) {
      await typeCommand(step.cmd);
      for (const line of step.out) {               // output prints line by line
        termState.done.push(line);
        drawTerm();
        await wait(110);
      }
      await wait(650);
    }
    termState.typing = "";                         // idle prompt, blinking cursor
    termState.solid = false;
    drawTerm();
    await wait(2600);
    termBody.classList.add("fade");                // smooth clear before the next loop
    await wait(450);
    termState.typing = null;
  }
}

// ===== Journey stepper =====
const STEPS = [
  { tag: "ม.4 · FIRST YEAR", title: "The Foundations",
    desc: "ปีแห่งการวางรากฐาน เริ่มเขียนโปรแกรมอย่างจริงจัง ฝึกคิดเป็นขั้นตอน และเข้าใจว่าคอมพิวเตอร์ \"คิด\" อย่างไร",
    concepts: ["Algorithm & Flowchart", "Python พื้นฐาน", "ตรรกศาสตร์และการให้เหตุผล"], tools: ["Python", "Scratch", "Arduino"],
    project: "Math Quiz Game", note: "เกมแรกที่ทำให้คนอื่นใช้จริง ฝึกคิดเลขเร็วให้น้อง ม.ต้น" },
  { tag: "ม.5 · SECOND YEAR", title: "The Builder",
    desc: "ปีที่ลงมือสร้างของจริง จากโค้ดบนจอสู่หุ่นยนต์และอุปกรณ์ที่เชื่อมต่ออินเทอร์เน็ต และได้ลงสนามแข่งขันครั้งแรก",
    concepts: ["Sensor & Motor Control", "PID Control", "IoT เบื้องต้น"], tools: ["C++", "ESP32", "Blynk"],
    project: "Line Follower Robot", note: "รองชนะเลิศอันดับ 1 ระดับภาค จากการทำงานเป็นทีม" },
  { tag: "ม.6 · THIRD YEAR", title: "The Problem Solver",
    desc: "ปีที่นำทุกอย่างที่เรียนมาแก้ปัญหาจริงในโรงเรียน และเริ่มใช้ข้อมูลช่วยตัดสินใจ",
    concepts: ["Data Analysis", "Web Development", "การทำงานเป็นทีม"], tools: ["Python", "HTML/CSS/JS", "Arduino"],
    project: "Smart Plant Watering", note: "ระบบรดน้ำอัตโนมัติที่ใช้งานจริงในแปลงผักของโรงเรียน" },
  { tag: "NEXT · CURRENT FOCUS", title: "Computer Engineering",
    desc: "ก้าวต่อไปคือการเรียนรู้อย่างลึกซึ้งในสาขาวิศวกรรมคอมพิวเตอร์ ตอนนี้ผมกำลังเตรียมพื้นฐานให้พร้อมที่สุด",
    concepts: ["Digital Logic", "C Programming", "Computer Architecture เบื้องต้น"], tools: ["C", "Linux", "Git"], progress: 78 },
];
const panel = document.getElementById("stepPanel");
const stepBtns = [...document.querySelectorAll(".step")];
function showStep(i) {
  const s = STEPS[i];
  stepBtns.forEach((b, j) => { b.classList.toggle("active", j === i); b.classList.toggle("done", j < i); });
  document.getElementById("stepFill").style.width = (i / (STEPS.length - 1)) * 100 + "%";
  const extra = s.progress
    ? `<small>READINESS ${s.progress}%</small><div class="pbar"><span style="--w:${s.progress}%"></span></div>`
    : `<p><b style="color:var(--text)">${s.project}</b><br />${s.note}</p>`;
  panel.innerHTML = `
    <div class="sp-card main"><small>${s.tag}</small><h4>${s.title}</h4><p>${s.desc}</p></div>
    <div class="sp-card"><small>KEY CONCEPTS</small><ul>${s.concepts.map((c) => `<li>${c}</li>`).join("")}</ul></div>
    <div class="sp-card"><small>${s.progress ? "TOOLS · GOAL" : "TOOLS · MAJOR PROJECT"}</small>
      <div class="tags">${s.tools.map((t) => `<span>${t}</span>`).join("")}</div>${extra}</div>`;
}
stepBtns.forEach((b, i) => b.addEventListener("click", () => showStep(i)));
showStep(0);

// ===== Scroll-in effects =====
// 1) split section titles into words that rise from a mask
function wrapWord(node, i) {
  const outer = document.createElement("span");
  outer.className = "w";
  const inner = document.createElement("span");
  inner.style.setProperty("--i", i);
  inner.append(node);
  outer.append(inner);
  return outer;
}
document.querySelectorAll(".split").forEach((el) => {
  const nodes = [...el.childNodes];
  el.textContent = "";
  let i = 0;
  nodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) el.append(" ");
        else el.append(wrapWord(document.createTextNode(part), i++));
      });
    } else if (n.nodeName === "BR") el.append(n);
    else el.append(wrapWord(n, i++));
  });
});
// 2) stagger siblings inside [data-stagger] groups
document.querySelectorAll("[data-stagger]").forEach((group) => {
  [...group.querySelectorAll(":scope > [data-anim]")].forEach((el, i) => el.style.setProperty("--d", (i * 0.1).toFixed(2) + "s"));
});
// 3) light sweep layer on cards
document.querySelectorAll(".card[data-anim]").forEach((el) => {
  const s = document.createElement("i");
  s.className = "sweep";
  el.appendChild(s);
});
// 4) scroll reveal: fade in + slide up when an element reaches ~88% of the screen height.
//    Elements reset when they drop back below the screen, so the effect replays on every pass.
function countUp(el) {
  const to = +el.dataset.to;
  let v = 0;
  const t = setInterval(() => { v = Math.min(to, v + 1); el.textContent = v; if (v >= to) clearInterval(t); }, 90);
}
let termStarted = false;
function onFirstReveal(el) {
  el.querySelectorAll("[data-to]").forEach(countUp);
  if (el.classList.contains("stack-card")) {
    setTimeout(() => el.querySelectorAll(".tile").forEach((t) => (t.querySelector(".bar span").style.width = t.dataset.val + "%")), 500);
  }
  if (!termStarted && el.classList.contains("cell-term")) { termStarted = true; setTimeout(runTerm, 500); }
}
const revealTargets = [
  ...[...document.querySelectorAll(".section")].map((el) => ({ el, cls: "sec-in", at: 0.95 })),
  ...[...document.querySelectorAll("[data-anim], .sec-head")].map((el) => ({ el, cls: "in-view", at: 0.88 })),
];
function revealCheck() {
  if (document.body.classList.contains("loading")) return;
  const h = innerHeight;
  for (const t of revealTargets) {
    const r = t.el.getBoundingClientRect();
    if (r.top < h * t.at && r.bottom > 0) {
      if (!t.el.classList.contains(t.cls)) {
        t.el.classList.add(t.cls);
        if (!t.el.dataset.done) { t.el.dataset.done = "1"; onFirstReveal(t.el); }
      }
    } else if (r.top > h) {
      t.el.classList.remove(t.cls);   // below the screen again → replay next time
    }
  }
}
let revealQueued = false;
function queueReveal() {
  if (revealQueued) return;
  revealQueued = true;
  requestAnimationFrame(() => { revealQueued = false; revealCheck(); });
}
addEventListener("scroll", queueReveal, { passive: true });
addEventListener("resize", queueReveal);
setInterval(revealCheck, 250);   // safety net in case a scroll event is missed

// ===== Works filter =====
document.querySelectorAll("#seg button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#seg button").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".work").forEach((w) => w.classList.toggle("hide", btn.dataset.f !== "all" && w.dataset.cat !== btn.dataset.f));
  });
});

// ===== Copy email + contact form =====
const EMAIL = "your.email@gmail.com";
document.getElementById("copyEmail").addEventListener("click", async () => {
  const hint = document.getElementById("copyHint");
  try { await navigator.clipboard.writeText(EMAIL); hint.textContent = "คัดลอกแล้ว ✓"; }
  catch { hint.textContent = "คัดลอกไม่ได้"; }
  setTimeout(() => (hint.textContent = "คัดลอก"), 1800);
});
document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const subject = f.subject.value || "ติดต่อจากเว็บไซต์ Portfolio";
  const body = `${f.message.value}\n\n— ${f.name.value} (${f.email.value})`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.getElementById("formNote").textContent = "กำลังเปิดโปรแกรมอีเมล... ถ้าไม่เปิด ส่งมาที่ " + EMAIL + " ได้เลยครับ";
});

// ===== PosarinBot =====
const chat = document.getElementById("chat");
const chatBody = document.getElementById("chatBody");
const KB = [
  { k: ["ทำไม", "วิศวะ", "why", "เหตุผล", "แรงบันดาลใจ"], a: "โปสรินท์เริ่มสนใจตอน ม.3 จากการต่อไฟ LED กับ Arduino ครั้งแรก 💡 แล้วอยากเข้าใจคอมพิวเตอร์ตั้งแต่ระดับวงจรจนถึงซอฟต์แวร์ วิศวะคอมจึงเป็นสาขาที่ใช่ที่สุดครับ" },
  { k: ["ผลงาน", "โปรเจ", "project", "ทำอะไร"], a: "ผลงานเด่นมี Smart Plant Watering (ใช้จริงในโรงเรียน), Line Follower Robot, IoT Weather Station และโครงงานวิเคราะห์ฝุ่น PM2.5 ครับ ดูได้ที่ส่วน Projects" },
  { k: ["รางวัล", "award", "แข่ง", "ค่าย"], a: "🏆 รองชนะเลิศอันดับ 1 แข่งหุ่นยนต์ระดับภาค, ผ่านเข้าค่าย สอวน. คอมพิวเตอร์ ค่าย 1, ค่าย ComCamp และเหรียญทองโครงงานวิทยาศาสตร์ครับ" },
  { k: ["เกรด", "gpax", "gpa", "คะแนน", "เรียน"], a: "โปสรินท์เรียนแผนวิทย์-คณิต GPAX 3.xx ครับ 📚 วิชาที่ชอบที่สุดคือคณิตศาสตร์และฟิสิกส์" },
  { k: ["ทักษะ", "skill", "ภาษา", "เขียน"], a: "ถนัด Python, Arduino/C++, HTML/CSS/JS และมีพื้นฐาน ESP32, Git ครับ 💻" },
  { k: ["ติดต่อ", "contact", "อีเมล", "email", "เบอร์"], a: "ติดต่อได้ที่ your.email@gmail.com หรือกรอกฟอร์มในส่วน Contact ได้เลยครับ ✉️" },
  { k: ["pdf", "พอร์ต", "portfolio", "ดาวน์โหลด"], a: "ดาวน์โหลด Portfolio ฉบับ PDF ได้ที่ปุ่ม Portfolio มุมขวาบน หรือส่วน Portfolio PDF ครับ 📄" },
  { k: ["สวัสดี", "hello", "hi", "หวัดดี"], a: "สวัสดีครับ! 👋 ถามเรื่องผลงาน รางวัล หรือเหตุผลที่โปสรินท์เลือกวิศวะคอมได้เลยครับ" },
];
function addMsg(text, cls) {
  const m = document.createElement("div");
  m.className = "msg " + cls;
  m.textContent = text;
  chatBody.appendChild(m);
  chatBody.scrollTop = chatBody.scrollHeight;
  return m;
}
function ask(q) {
  if (!q.trim()) return;
  addMsg(q, "me");
  const typing = addMsg("กำลังพิมพ์...", "bot typing");
  const t = q.toLowerCase();
  const hit = KB.find((e) => e.k.some((k) => t.includes(k)));
  setTimeout(() => {
    typing.remove();
    addMsg(hit ? hit.a : "ขอโทษครับ ยังตอบเรื่องนี้ไม่ได้ 😅 ลองถามเรื่อง ผลงาน, รางวัล, เกรด หรือ ทำไมต้องวิศวะคอม ดูนะครับ", "bot");
  }, 600);
}
let greeted = false;
document.getElementById("chatFab").addEventListener("click", () => {
  chat.classList.toggle("open");
  if (!greeted) { greeted = true; addMsg("สวัสดีครับ 👋 ผมคือ PosarinBot ผู้ช่วยของโปสรินท์ ถามเกี่ยวกับผลงาน รางวัล หรือเป้าหมายการเรียนได้เลยครับ", "bot"); }
});
document.getElementById("chatClose").addEventListener("click", () => chat.classList.remove("open"));
document.getElementById("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("chatText");
  ask(input.value);
  input.value = "";
});
document.querySelectorAll("#chatQuick button").forEach((b) => b.addEventListener("click", () => ask(b.textContent)));

document.getElementById("year").textContent = new Date().getFullYear();
