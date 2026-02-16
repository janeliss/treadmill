import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import mascotBase from './assets/MASCOT1.png';
import mascotExpression from './assets/MASCOT1-EXPRESSION.png';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type MascotExpression = 'idle' | 'happy' | 'blink' | 'smell';

interface Milestone {
  seconds: number;
  label: string;
  icon: string;
  dialogue: string;
}

interface DialogueState {
  text: string;
  visible: boolean;
  id: number;
  speaker: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SESSION_GOAL = 1200;
const MAP_H = 3200;

const WALK_MESSAGES = [
  "WOOF! Look at those flowers!",
  "The air smells like honey~",
  "*happy panting*",
  "I wonder what's ahead...",
  "This path is so pretty!",
  "Can you hear the birds?",
  "WOOF! Let's keep going!",
  "I feel so warm and cozy~",
  "The sky looks amazing!",
  "Best walk ever!",
  "*tiny yawn* ...still going!",
  "I see something sparkly!",
  "Nature is so peaceful~",
  "My paws are dancing!",
];

const MILESTONES: Milestone[] = [
  { seconds: 120, label: '2 min', icon: '🌱', dialogue: "WOOF! Something smells amazing over here!" },
  { seconds: 300, label: '5 min', icon: '🌸', dialogue: "The flowers are blooming just for us!" },
  { seconds: 600, label: '10 min', icon: '🧣', dialogue: "I found a cozy spot! *sniff sniff*" },
  { seconds: 1200, label: '20 min', icon: '👑', dialogue: "We did it! Champion walkers! WOOF WOOF!" },
];

// Winding path waypoints: x = % of width, y = % of map height
// progress 0 → bottom (start), progress 1 → top (finish)
const WAYPOINTS = [
  { x: 50, y: 94 },
  { x: 78, y: 82 },
  { x: 22, y: 70 },
  { x: 76, y: 58 },
  { x: 24, y: 46 },
  { x: 74, y: 34 },
  { x: 26, y: 22 },
  { x: 50, y: 8 },
];

// Scenery decorations scattered on the map
const DECO = [
  { t: 'tree', x: 7, y: 92 }, { t: 'tree', x: 91, y: 87 },
  { t: 'tree', x: 10, y: 74 }, { t: 'tree', x: 89, y: 66 },
  { t: 'tree', x: 8, y: 54 }, { t: 'tree', x: 92, y: 48 },
  { t: 'tree', x: 12, y: 36 }, { t: 'tree', x: 88, y: 28 },
  { t: 'tree', x: 6, y: 16 }, { t: 'tree', x: 93, y: 10 },
  { t: 'fl-p', x: 16, y: 90 }, { t: 'fl-b', x: 84, y: 84 },
  { t: 'fl-y', x: 4, y: 71 }, { t: 'fl-p', x: 96, y: 64 },
  { t: 'fl-b', x: 18, y: 52 }, { t: 'fl-y', x: 82, y: 44 },
  { t: 'fl-p', x: 6, y: 32 }, { t: 'fl-b', x: 94, y: 24 },
  { t: 'fl-y', x: 14, y: 14 }, { t: 'fl-p', x: 86, y: 7 },
  { t: 'shr', x: 93, y: 79 }, { t: 'shr', x: 7, y: 59 },
  { t: 'shr', x: 91, y: 39 }, { t: 'shr', x: 9, y: 19 },
  { t: 'bush', x: 5, y: 84 }, { t: 'bush', x: 95, y: 70 },
  { t: 'bush', x: 3, y: 50 }, { t: 'bush', x: 97, y: 30 },
  { t: 'bush', x: 8, y: 9 },
  { t: 'rock', x: 14, y: 96 }, { t: 'rock', x: 86, y: 76 },
  { t: 'rock', x: 12, y: 42 }, { t: 'rock', x: 88, y: 18 },
];

// Palette
const C = {
  pathBorder: '#6a5040',
  pathFill: '#c4a878',
  pathDash: 'rgba(255,255,255,0.15)',
  skyBlue: '#a8d8ea',
  skyLight: '#c8e8f0',
  grassLight: '#78b858',
  grassMid: '#68a848',
  grassDark: '#589838',
  uiBg: 'rgba(60,48,36,0.88)',
  uiText: '#f5ece0',
  dialogBg: '#f5ece0',
  dialogBorder: '#5a4838',
  dialogText: '#3a2a1a',
  accent: '#e8a0b0',
  accentAlt: '#a0c8e0',
  flowerPink: '#f0a0b8',
  flowerBlue: '#a0c0e8',
  flowerYellow: '#f0e080',
  mushroomCap: '#c87878',
  mushroom: '#e0a0a0',
  treeTrunk: '#8a6a48',
  treeLeaf: '#4a8a38',
  treeLeafLight: '#68a850',
  bushColor: '#5a9a48',
  bushLight: '#70aa58',
  rockColor: '#a0a098',
  rockDark: '#888880',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function randInt(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/** Interpolate position on the winding path given progress (0→1) */
function pathLerp(progress: number): { x: number; y: number } {
  const p = Math.max(0, Math.min(1, progress));
  const seg = p * (WAYPOINTS.length - 1);
  const i = Math.min(Math.floor(seg), WAYPOINTS.length - 2);
  const t = seg - i;
  return {
    x: WAYPOINTS[i].x + (WAYPOINTS[i + 1].x - WAYPOINTS[i].x) * t,
    y: WAYPOINTS[i].y + (WAYPOINTS[i + 1].y - WAYPOINTS[i].y) * t,
  };
}

/** Build SVG cubic bezier path string for the winding road */
function buildSvgPath(): string {
  const w = 400, h = MAP_H;
  const pts = WAYPOINTS.map(wp => ({ x: (wp.x / 100) * w, y: (wp.y / 100) * h }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = pts[i], n = pts[i + 1];
    const my = (c.y + n.y) / 2;
    d += ` C ${c.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`;
  }
  return d;
}

const PATH_D = buildSvgPath();

// ═══════════════════════════════════════════════════════════════════════════════
// MASCOT EXPRESSION COMPONENTS (GSAP-animated, using real PNG assets)
// ═══════════════════════════════════════════════════════════════════════════════

function MascotIdle({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(charRef.current, { y: -3, scaleY: 1.02, duration: 1.4, ease: 'sine.inOut' });
    return () => { tl.kill(); };
  }, []);
  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy idle" className="mascot-char" draggable={false} />
    </div>
  );
}

function MascotHappy({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(charRef.current, { y: -14, scaleX: 1.08, scaleY: 0.94, rotation: -5, duration: 0.25, ease: 'power2.out' })
      .to(charRef.current, { y: 0, scaleX: 0.96, scaleY: 1.06, rotation: 5, duration: 0.25, ease: 'power2.in' })
      .to(charRef.current, { y: -10, scaleX: 1.05, scaleY: 0.96, rotation: -3, duration: 0.25, ease: 'power2.out' })
      .to(charRef.current, { y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.3, ease: 'power2.in' });
    return () => { tl.kill(); };
  }, []);
  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy happy" className="mascot-char" draggable={false} />
      <div className="mascot-woof-bubble">WOOF!</div>
    </div>
  );
}

function MascotSmellBread({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(charRef.current, { y: -4, rotation: 8, scaleX: 1.03, duration: 0.3, ease: 'power1.out' })
      .to(charRef.current, { y: 0, rotation: 0, scaleX: 1, duration: 0.2, ease: 'power1.in' })
      .to(charRef.current, { y: -5, rotation: -6, scaleX: 1.02, duration: 0.3, ease: 'power1.out' })
      .to(charRef.current, { y: 0, rotation: 0, scaleX: 1, duration: 0.2, ease: 'power1.in' })
      .to(charRef.current, { y: -3, rotation: 4, duration: 0.25, ease: 'power1.out' })
      .to(charRef.current, { y: 0, rotation: 0, duration: 0.4, ease: 'power2.inOut' });
    return () => { tl.kill(); };
  }, []);
  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy sniffing" className="mascot-char" draggable={false} />
      <div className="mascot-sniff-particles">
        <span className="sniff-p sniff-p1">~</span>
        <span className="sniff-p sniff-p2">~</span>
        <span className="sniff-p sniff-p3">~</span>
      </div>
    </div>
  );
}

function MascotBlink({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
    tl.to(charRef.current, { scaleY: 0.92, y: 2, duration: 0.08, ease: 'power2.in' })
      .to(charRef.current, { scaleY: 1, y: 0, duration: 0.1, ease: 'power2.out' })
      .to(charRef.current, { scaleY: 0.92, y: 2, duration: 0.08, ease: 'power2.in' }, '+=0.12')
      .to(charRef.current, { scaleY: 1, y: 0, duration: 0.1, ease: 'power2.out' })
      .to(charRef.current, { y: -2, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1 });
    return () => { tl.kill(); };
  }, []);
  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy blink" className="mascot-char" draggable={false} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASCOT SWITCHER — picks expression component, adds walk bob
// ═══════════════════════════════════════════════════════════════════════════════

function LoafyMascot({ expression, running, onTap }: {
  expression: MascotExpression;
  running: boolean;
  onTap: () => void;
}) {
  const walkRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!walkRef.current) return;
    if (running) {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(walkRef.current, { y: -5, duration: 0.2, ease: 'steps(2)' })
        .to(walkRef.current, { y: 0, duration: 0.2, ease: 'steps(2)' });
      return () => { tl.kill(); };
    } else {
      gsap.to(walkRef.current, { y: 0, duration: 0.3 });
    }
  }, [running]);
  return (
    <div ref={walkRef} className="loafy-walk-wrapper">
      {expression === 'idle' && <MascotIdle onTap={onTap} />}
      {expression === 'happy' && <MascotHappy onTap={onTap} />}
      {expression === 'smell' && <MascotSmellBread onTap={onTap} />}
      {expression === 'blink' && <MascotBlink onTap={onTap} />}
      {running && (
        <div className="mascot-dust">
          <div className="m-dust m-dust-1" />
          <div className="m-dust m-dust-2" />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export default function App() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueState>({ text: '', visible: false, id: 0, speaker: '' });
  const [triggeredMs, setTriggeredMs] = useState<Set<number>>(() => new Set());
  const [expression, setExpression] = useState<MascotExpression>('idle');
  const [evolveFlash, setEvolveFlash] = useState(false);
  const [targetMinutes, setTargetMinutes] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [goalReached, setGoalReached] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueIdRef = useRef(0);
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionGoal = targetMinutes ? targetMinutes * 60 : SESSION_GOAL;
  const progress = Math.min(seconds / sessionGoal, 1);

  // ── Camera & mascot position ──────────────────────────────────────────────
  const mascotPos = pathLerp(progress);
  const vh = typeof window !== 'undefined' ? window.innerHeight : 700;
  const maxScroll = MAP_H - vh;
  const mascotAbsY = (mascotPos.y / 100) * MAP_H;
  const cameraY = Math.max(0, Math.min(maxScroll, mascotAbsY - vh * 0.45));

  // ── Expression management ─────────────────────────────────────────────────
  const setTempExpression = useCallback((expr: MascotExpression, duration = 3000) => {
    setExpression(expr);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    expressionTimerRef.current = setTimeout(() => { setExpression('idle'); }, duration);
  }, []);

  useEffect(() => {
    if (!running && expression === 'idle') {
      blinkIntervalRef.current = setInterval(() => {
        setTempExpression('blink', 4000);
      }, 6000);
      return () => { if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current); };
    }
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
  }, [running, expression, setTempExpression]);

  // ── Dialogue system ───────────────────────────────────────────────────────
  const showDialogue = useCallback((text: string, speaker = '', duration = 4500) => {
    const id = ++dialogueIdRef.current;
    setDialogue({ text, visible: true, id, speaker });
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    dialogueTimerRef.current = setTimeout(() => {
      setDialogue(prev => prev.id === id ? { ...prev, visible: false } : prev);
    }, duration);
  }, []);

  // ── Walking dialogue scheduler ────────────────────────────────────────────
  const scheduleWalkMsg = useCallback(() => {
    const delay = randInt(20, 45) * 1000;
    walkMsgTimerRef.current = setTimeout(() => {
      showDialogue(WALK_MESSAGES[Math.floor(Math.random() * WALK_MESSAGES.length)], 'Loafy');
      if (Math.random() > 0.5) setTempExpression('happy', 2500);
      scheduleWalkMsg();
    }, delay);
  }, [showDialogue, setTempExpression]);

  // ── Timer controls ────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    setExpression('happy');
    showDialogue("WOOF! Let's go for a walk!", 'Loafy');
    setTimeout(() => setExpression('idle'), 2000);
    timerRef.current = setInterval(() => setSeconds(p => p + 1), 1000);
    scheduleWalkMsg();
  }, [running, showDialogue, scheduleWalkMsg]);

  const stop = useCallback(() => {
    if (!running) return;
    setRunning(false);
    setExpression('idle');
    showDialogue("*sits down* ...nice break~", 'Loafy');
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (walkMsgTimerRef.current) { clearTimeout(walkMsgTimerRef.current); walkMsgTimerRef.current = null; }
  }, [running, showDialogue]);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
    setTriggeredMs(new Set());
    setExpression('idle');
    setEvolveFlash(false);
    setGoalReached(false);
    setTargetMinutes(null);
    setCustomInput('');
    showDialogue("A new adventure awaits!", 'Loafy');
  }, [stop, showDialogue]);

  // ── Milestone checker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    for (const ms of MILESTONES) {
      if (seconds >= ms.seconds && !triggeredMs.has(ms.seconds)) {
        setTriggeredMs(p => new Set(p).add(ms.seconds));
        setTempExpression('smell', 5000);
        setEvolveFlash(true);
        showDialogue(ms.dialogue, 'Loafy', 6000);
        setTimeout(() => setEvolveFlash(false), 2000);
      }
    }
    if (seconds >= sessionGoal && !goalReached) {
      setGoalReached(true);
      stop();
      setTempExpression('happy', 8000);
      setEvolveFlash(true);
      showDialogue("WOOF WOOF!! We did it!! Best walk EVER!", 'Loafy', 8000);
      setTimeout(() => setEvolveFlash(false), 3000);
    }
  }, [seconds, running, triggeredMs, showDialogue, setTempExpression, sessionGoal, goalReached, stop]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    if (walkMsgTimerRef.current) clearTimeout(walkMsgTimerRef.current);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
  }, []);

  const handleMascotTap = useCallback(() => {
    setTempExpression('happy', 2000);
    showDialogue('WOOF! *tail wag*', 'Loafy', 2500);
  }, [setTempExpression, showDialogue]);

  const handlePickTime = (mins: number) => {
    setTargetMinutes(mins);
    setGoalReached(false);
    showDialogue(`${mins} minutes? Let's do this! WOOF!`, 'Loafy');
    setTempExpression('happy', 2000);
  };

  const handleCustomSubmit = () => {
    const mins = parseInt(customInput, 10);
    if (mins > 0 && mins <= 180) handlePickTime(mins);
  };

  const remaining = Math.max(sessionGoal - seconds, 0);
  const activeMilestones = MILESTONES.filter(ms => ms.seconds <= sessionGoal);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  // ── TIME PICKER SCREEN ──
  if (targetMinutes === null) {
    return (
      <div className="app">
        <style>{cssText}</style>
        <div className="picker-bg">
          <div className="picker-panel">
            <div className="picker-mascot">
              <img src={mascotExpression} alt="Loafy" className="picker-mascot-img" draggable={false} />
            </div>
            <div className="picker-title">How long will you walk?</div>
            <div className="picker-grid">
              {TIME_PRESETS.map(m => (
                <button key={m} className="picker-btn" onClick={() => handlePickTime(m)}>
                  {m}<span className="picker-btn-unit">min</span>
                </button>
              ))}
            </div>
            <div className="picker-custom">
              <input
                className="picker-input"
                type="number" min="1" max="180"
                placeholder="Custom"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
              />
              <button className="picker-btn picker-btn-go" onClick={handleCustomSubmit}>Go!</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GOAL REACHED SCREEN ──
  if (goalReached) {
    return (
      <div className="app">
        <style>{cssText}</style>
        <div className="goal-bg">
          <div className="goal-panel">
            <div className="goal-stars-row">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="goal-star" style={{ animationDelay: `${i * 0.12}s` }}>&#9733;</span>
              ))}
            </div>
            <div className="goal-title">Walk Complete!</div>
            <div className="goal-time">{fmt(seconds)}</div>
            <div className="goal-sub">{targetMinutes} minute goal crushed!</div>
            <div className="goal-mascot">
              <LoafyMascot expression="happy" running={false} onTap={handleMascotTap} />
            </div>
            <button className="ctrl-btn ctrl-btn-start" onClick={reset}>
              &#8634; New Walk
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN ADVENTURE MAP VIEW ──
  return (
    <div className="app">
      <style>{cssText}</style>

      <div className="map-viewport">
        <div className="adventure-map" style={{ transform: `translateY(${-cameraY}px)` }}>
          {/* Background gradient (sky → grass) */}
          <div className="map-bg" />

          {/* Clouds near top of map */}
          <div className="map-cloud mc-1" />
          <div className="map-cloud mc-2" />
          <div className="map-cloud mc-3" />

          {/* SVG winding path */}
          <svg className="path-svg" viewBox={`0 0 400 ${MAP_H}`} preserveAspectRatio="none">
            <path d={PATH_D} fill="none" stroke={C.pathBorder} strokeWidth="62"
              strokeLinecap="round" strokeLinejoin="round" />
            <path d={PATH_D} fill="none" stroke={C.pathFill} strokeWidth="48"
              strokeLinecap="round" strokeLinejoin="round" />
            <path d={PATH_D} fill="none" stroke={C.pathDash} strokeWidth="3"
              strokeDasharray="10 14" strokeLinecap="round" />
          </svg>

          {/* Scenery decorations */}
          {DECO.map((d, i) => (
            <div key={i} className={`deco deco-${d.t}`}
              style={{ left: `${d.x}%`, top: `${d.y}%` }} />
          ))}

          {/* Start marker */}
          <div className="path-marker path-start"
            style={{ left: `${WAYPOINTS[0].x}%`, top: `${WAYPOINTS[0].y}%` }}>
            &#128062; Start
          </div>

          {/* Finish marker */}
          <div className="path-marker path-finish"
            style={{ left: `${WAYPOINTS[WAYPOINTS.length - 1].x}%`, top: `${WAYPOINTS[WAYPOINTS.length - 1].y}%` }}>
            &#127937; Finish
          </div>

          {/* Milestone markers on the path */}
          {activeMilestones.map(ms => {
            const p = Math.min(ms.seconds / sessionGoal, 1);
            const pos = pathLerp(p);
            const hit = triggeredMs.has(ms.seconds);
            return (
              <div key={ms.seconds}
                className={`ms-marker ${hit ? 'ms-hit' : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <div className="ms-icon">{ms.icon}</div>
                <div className="ms-label">{ms.label}</div>
                {hit && <div className="ms-sparkle" />}
              </div>
            );
          })}

          {/* Mascot on the path */}
          <div className="mascot-on-path"
            style={{ left: `${mascotPos.x}%`, top: `${mascotPos.y}%` }}>
            <LoafyMascot expression={expression} running={running} onTap={handleMascotTap} />
          </div>
        </div>
      </div>

      {/* Fixed UI overlay */}
      <div className="ui-overlay">
        <div className="top-bar">
          <div className="ui-timer">
            <div className={`status-dot ${running ? 'active' : ''}`} />
            <span>{fmt(seconds)}</span>
          </div>
          <div className="ui-tama">
            <img src={mascotBase} alt="Tama" className="tama-img" draggable={false} />
          </div>
          <div className="ui-remaining">
            {remaining > 0 ? `-${fmt(remaining)}` : 'DONE!'}
          </div>
        </div>

        <div className="ui-progress-bar">
          <div className="ui-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className={`dialogue-box ${dialogue.visible ? 'show' : 'hide'}`}>
          <div className="dialogue-inner">
            {dialogue.speaker && <div className="dialogue-speaker">{dialogue.speaker}</div>}
            <div className="dialogue-text">{dialogue.text}</div>
          </div>
        </div>

        <div className="bottom-bar">
          {!running ? (
            <button className="ctrl-btn ctrl-btn-start" onClick={start}>
              &#9654; {seconds > 0 ? 'Continue' : 'Start Walk'}
            </button>
          ) : (
            <button className="ctrl-btn ctrl-btn-stop" onClick={stop}>
              &#9612;&#9612; Rest
            </button>
          )}
          {!running && seconds > 0 && (
            <button className="ctrl-btn ctrl-btn-reset" onClick={reset}>
              &#8634; New
            </button>
          )}
        </div>
      </div>

      {evolveFlash && <div className="evolve-flash" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL CSS
// ═══════════════════════════════════════════════════════════════════════════════

const cssText = `
@import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { height: 100%; overflow: hidden; }

.app {
  position: fixed; inset: 0;
  font-family: 'Silkscreen', monospace;
  overflow: hidden; user-select: none;
  -webkit-user-select: none;
  image-rendering: pixelated;
  background: ${C.grassMid};
}

/* ═══════════ MAP VIEWPORT ═══════════ */
.map-viewport {
  position: absolute; inset: 0;
  overflow: hidden;
}
.adventure-map {
  position: absolute;
  left: 0; right: 0;
  height: ${MAP_H}px;
  top: 0;
  transition: transform 1s ease-out;
  will-change: transform;
}
.map-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg,
    ${C.skyBlue} 0%,
    ${C.skyLight} 6%,
    ${C.grassLight} 12%,
    ${C.grassMid} 50%,
    ${C.grassDark} 100%
  );
}

/* Clouds */
.map-cloud {
  position: absolute;
  background: rgba(255,255,255,0.75);
  border-radius: 4px;
  height: 14px;
  z-index: 1;
}
.mc-1 { width: 64px; top: 1.5%; left: 12%; }
.mc-2 { width: 84px; top: 2.8%; right: 18%; }
.mc-3 { width: 48px; top: 4.2%; left: 52%; }

/* SVG path */
.path-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* ═══════════ DECORATIONS ═══════════ */
.deco {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -100%);
  pointer-events: none;
}

/* Tree */
.deco-tree { width: 30px; height: 44px; }
.deco-tree::before {
  content: '';
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 8px; height: 16px;
  background: ${C.treeTrunk};
  border-radius: 1px;
}
.deco-tree::after {
  content: '';
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 28px solid ${C.treeLeaf};
  filter: drop-shadow(0 -2px 0 ${C.treeLeafLight});
}

/* Flowers */
.deco-fl-p, .deco-fl-b, .deco-fl-y {
  width: 8px; height: 8px;
  border-radius: 2px;
}
.deco-fl-p::after, .deco-fl-b::after, .deco-fl-y::after {
  content: '';
  position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
  width: 2px; height: 6px;
  background: #5a8a3a;
}
.deco-fl-p { background: ${C.flowerPink}; box-shadow: 0 -3px 0 ${C.flowerPink}, 3px 0 0 ${C.flowerPink}, -3px 0 0 ${C.flowerPink}, 0 3px 0 ${C.flowerPink}; }
.deco-fl-b { background: ${C.flowerBlue}; box-shadow: 0 -3px 0 ${C.flowerBlue}, 3px 0 0 ${C.flowerBlue}, -3px 0 0 ${C.flowerBlue}, 0 3px 0 ${C.flowerBlue}; }
.deco-fl-y { background: ${C.flowerYellow}; box-shadow: 0 -3px 0 ${C.flowerYellow}, 3px 0 0 ${C.flowerYellow}, -3px 0 0 ${C.flowerYellow}, 0 3px 0 ${C.flowerYellow}; }

/* Mushroom */
.deco-shr { width: 14px; height: 12px; }
.deco-shr::before {
  content: '';
  position: absolute; top: 0; left: 0;
  width: 14px; height: 8px;
  background: ${C.mushroomCap};
  border-radius: 7px 7px 0 0;
}
.deco-shr::after {
  content: '';
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 6px; height: 5px;
  background: ${C.mushroom};
  border-radius: 0 0 3px 3px;
}

/* Bush */
.deco-bush { width: 26px; height: 16px; }
.deco-bush::before {
  content: '';
  position: absolute; bottom: 0; left: 0;
  width: 26px; height: 16px;
  background: ${C.bushColor};
  border-radius: 12px 12px 4px 4px;
  box-shadow: inset 4px -3px 0 ${C.bushLight};
}

/* Rock */
.deco-rock { width: 18px; height: 12px; }
.deco-rock::before {
  content: '';
  position: absolute; bottom: 0; left: 0;
  width: 18px; height: 12px;
  background: ${C.rockColor};
  border-radius: 7px 9px 4px 3px;
  box-shadow: inset 2px -2px 0 ${C.rockDark};
}

/* ═══════════ PATH MARKERS ═══════════ */
.path-marker {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -100%);
  font-size: 11px;
  color: ${C.uiText};
  background: ${C.uiBg};
  padding: 5px 12px;
  border-radius: 4px;
  border: 2px solid ${C.dialogBorder};
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.12);
}
.path-start { transform: translate(-50%, 20px); }

/* Milestone markers */
.ms-marker {
  position: absolute;
  z-index: 6;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  pointer-events: none;
  transition: filter 0.5s;
}
.ms-marker:not(.ms-hit) {
  filter: grayscale(0.6) brightness(0.7);
}
.ms-icon {
  font-size: 22px;
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 50%;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.12);
}
.ms-hit .ms-icon {
  border-color: #f0e080;
  box-shadow: 0 0 12px rgba(240,224,128,0.5);
}
.ms-label {
  font-size: 8px;
  color: ${C.uiText};
  background: rgba(60,48,36,0.75);
  padding: 2px 7px;
  border-radius: 3px;
}
.ms-sparkle {
  position: absolute;
  width: 56px; height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(240,224,128,0.5) 0%, transparent 70%);
  animation: sparkPop 1.5s ease-out forwards;
  pointer-events: none;
}
@keyframes sparkPop {
  0% { transform: scale(0.3); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* ═══════════ MASCOT ON PATH ═══════════ */
.mascot-on-path {
  position: absolute;
  z-index: 8;
  transform: translate(-50%, -90%);
  transition: left 1.5s ease-out, top 1.5s ease-out;
}
.loafy-walk-wrapper {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  will-change: transform;
}
.mascot-container {
  position: relative;
  width: 130px; height: 130px;
  cursor: pointer;
  display: flex; align-items: flex-end; justify-content: center;
}
.mascot-char {
  width: 120px; height: auto;
  image-rendering: pixelated;
  will-change: transform, opacity;
  transform-origin: center bottom;
  filter: drop-shadow(0 3px 2px rgba(0,0,0,0.2));
  position: relative; z-index: 2;
  mix-blend-mode: multiply;
}
.mascot-shadow {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 70px; height: 12px;
  background: rgba(0,0,0,0.15);
  border-radius: 50%;
  z-index: 1;
}

/* WOOF bubble */
.mascot-woof-bubble {
  position: absolute; top: -8px; right: -22px;
  background: #fff;
  border: 3px solid #5a4a3a;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 11px; font-weight: 700;
  color: #5a4a3a;
  z-index: 10;
  animation: woofPop 0.3s ease-out;
  box-shadow: 2px 2px 0 rgba(90,74,58,0.15);
}
.mascot-woof-bubble::after {
  content: '';
  position: absolute; bottom: -7px; left: 12px;
  width: 0; height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid #5a4a3a;
}
@keyframes woofPop {
  0% { opacity: 0; transform: scale(0.5) translateY(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Sniff particles */
.mascot-sniff-particles {
  position: absolute; top: 14px; right: -16px;
  display: flex; flex-direction: column; gap: 3px;
  z-index: 10;
}
.sniff-p {
  font-size: 13px; color: ${C.accent};
  opacity: 0;
  animation: sniffFloat 1.5s ease-out infinite;
}
.sniff-p1 { animation-delay: 0s; }
.sniff-p2 { animation-delay: 0.3s; }
.sniff-p3 { animation-delay: 0.6s; }
@keyframes sniffFloat {
  0% { opacity: 0; transform: translateX(0) translateY(0); }
  30% { opacity: 0.8; }
  100% { opacity: 0; transform: translateX(16px) translateY(-14px); }
}

/* Dust when walking */
.mascot-dust {
  position: absolute; bottom: 4px; right: -10px;
  width: 26px; height: 18px; pointer-events: none;
}
.m-dust {
  position: absolute; width: 5px; height: 5px;
  background: ${C.pathFill}; border-radius: 1px; opacity: 0.5;
}
.m-dust-1 { bottom: 2px; right: 0; animation: mDustGo 0.7s steps(3) infinite; }
.m-dust-2 { bottom: 7px; right: 7px; animation: mDustGo 0.7s steps(3) infinite 0.25s; }
@keyframes mDustGo {
  0% { opacity: 0.5; transform: translate(0, 0); }
  100% { opacity: 0; transform: translate(10px, -10px); }
}

/* ═══════════ UI OVERLAY (fixed on screen) ═══════════ */
.ui-overlay {
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  justify-content: space-between;
  z-index: 20;
  pointer-events: none;
}
.ui-overlay > * { pointer-events: auto; }

.top-bar {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 10px 12px 0;
}
.ui-timer {
  display: flex; align-items: center; gap: 6px;
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 15px; font-weight: 700;
  color: ${C.uiText};
  font-variant-numeric: tabular-nums;
}
.status-dot {
  width: 7px; height: 7px; background: #888;
  border-radius: 2px; transition: background 0.3s;
}
.status-dot.active {
  background: #80e890;
  box-shadow: 0 0 5px rgba(128,232,144,0.6);
}
.ui-tama {
  width: 46px; height: 46px;
  border-radius: 6px;
  overflow: hidden;
  border: 3px solid ${C.dialogBorder};
  background: ${C.uiBg};
  display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
}
.tama-img {
  width: 40px; height: 40px;
  object-fit: cover;
  image-rendering: pixelated;
  mix-blend-mode: multiply;
}
.ui-remaining {
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px; font-weight: 700;
  color: ${C.accent};
}

/* Progress bar */
.ui-progress-bar {
  margin: 6px 14px 0;
  height: 8px;
  background: rgba(60,48,36,0.5);
  border: 2px solid ${C.dialogBorder};
  border-radius: 2px;
  overflow: hidden;
  pointer-events: none;
}
.ui-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, ${C.accent}, ${C.accentAlt});
  transition: width 1s ease;
  border-radius: 1px;
}

/* Dialogue box */
.dialogue-box {
  position: absolute;
  bottom: 90px;
  left: 10px; right: 10px;
  z-index: 25;
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: none;
}
.dialogue-box.show { opacity: 1; transform: translateY(0); }
.dialogue-box.hide { opacity: 0; transform: translateY(8px); }
.dialogue-inner {
  position: relative;
  background: ${C.dialogBg};
  border: 4px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 10px 14px;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.12);
}
.dialogue-speaker {
  position: absolute;
  top: -12px; left: 10px;
  background: ${C.dialogBorder};
  color: ${C.uiText};
  font-size: 9px; font-weight: 700;
  padding: 2px 8px;
  border-radius: 3px 3px 0 0;
}
.dialogue-text {
  font-size: 12px;
  color: ${C.dialogText};
  line-height: 1.6;
}

/* Bottom controls */
.bottom-bar {
  padding: 0 12px 16px;
  display: flex; justify-content: center; gap: 8px;
}
.ctrl-btn {
  padding: 10px 24px;
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  font-family: 'Silkscreen', monospace;
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.18);
  transition: transform 0.1s;
}
.ctrl-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.18);
}
.ctrl-btn-start {
  background: linear-gradient(180deg, ${C.accent}, #d08898);
  color: #fff; border-color: #a06878;
}
.ctrl-btn-stop {
  background: linear-gradient(180deg, ${C.accentAlt}, #88b0c8);
  color: #fff; border-color: #6890a8;
}
.ctrl-btn-reset {
  background: rgba(60,48,36,0.6);
  color: ${C.uiText}; font-size: 11px; padding: 10px 16px;
}

/* ═══════════ EVOLVE FLASH ═══════════ */
.evolve-flash {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(255,255,240,0.5);
  animation: evoFlash 2s steps(4) forwards;
  pointer-events: none;
}
@keyframes evoFlash {
  0% { opacity: 1; }
  30% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ═══════════ TIME PICKER SCREEN ═══════════ */
.picker-bg {
  position: fixed; inset: 0;
  background: linear-gradient(180deg, ${C.skyBlue} 0%, ${C.grassLight} 45%, ${C.grassMid} 100%);
  display: flex; align-items: center; justify-content: center;
}
.picker-panel {
  display: flex; flex-direction: column; align-items: center;
  gap: 18px; padding: 24px;
  max-width: 340px; width: 90%;
}
.picker-mascot {
  width: 160px; height: 160px;
  display: flex; align-items: center; justify-content: center;
}
.picker-mascot-img {
  width: 150px; height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.2));
  animation: pickerBob 2s ease-in-out infinite;
  mix-blend-mode: multiply;
}
@keyframes pickerBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.picker-title {
  font-size: 16px; font-weight: 700;
  color: #3a2a1a;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255,255,255,0.3);
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px; width: 100%;
}
.picker-btn {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 12px 4px;
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 6px;
  font-family: 'Silkscreen', monospace;
  font-size: 16px; font-weight: 700;
  color: ${C.uiText};
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.15);
  transition: transform 0.1s;
}
.picker-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.15);
}
.picker-btn-unit {
  font-size: 8px; opacity: 0.6; margin-top: 2px;
}
.picker-custom {
  display: flex; gap: 8px; width: 100%;
}
.picker-input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(255,255,255,0.9);
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  font-family: 'Silkscreen', monospace;
  font-size: 14px;
  color: ${C.dialogText};
  outline: none;
}
.picker-input::placeholder { color: #aaa; font-size: 11px; }
.picker-btn-go { padding: 10px 18px; font-size: 14px; }

/* ═══════════ GOAL REACHED SCREEN ═══════════ */
.goal-bg {
  position: fixed; inset: 0;
  background: linear-gradient(180deg, #f5e8c0 0%, ${C.accent} 50%, ${C.grassLight} 100%);
  display: flex; align-items: center; justify-content: center;
}
.goal-panel {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 24px;
}
.goal-stars-row {
  display: flex; gap: 8px;
}
.goal-star {
  font-size: 30px;
  color: #f0d060;
  animation: starBounce 0.6s ease-out forwards;
  opacity: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
@keyframes starBounce {
  0% { opacity: 0; transform: scale(0) translateY(20px); }
  60% { opacity: 1; transform: scale(1.3) translateY(-5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.goal-title {
  font-size: 22px; font-weight: 700;
  color: #3a2a1a;
  text-shadow: 0 2px 0 rgba(255,255,255,0.4);
}
.goal-time {
  font-size: 38px; font-weight: 700;
  color: #5a4030;
  font-variant-numeric: tabular-nums;
}
.goal-sub {
  font-size: 12px;
  color: #5a4a3a; opacity: 0.8;
}
.goal-mascot { margin: 8px 0; }

/* ═══════════ RESPONSIVE ═══════════ */
@media (max-width: 400px) {
  .ui-timer { font-size: 13px; padding: 5px 10px; }
  .ui-remaining { font-size: 10px; padding: 5px 8px; }
  .dialogue-text { font-size: 11px; }
  .ctrl-btn { font-size: 12px; padding: 9px 18px; }
  .mascot-char { width: 100px; }
  .mascot-container { width: 110px; height: 110px; }
  .mascot-shadow { width: 58px; height: 10px; }
  .ui-tama { width: 40px; height: 40px; }
  .tama-img { width: 34px; height: 34px; }
  .picker-mascot-img { width: 120px; }
  .ms-icon { width: 34px; height: 34px; font-size: 18px; }
}
`;
