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

// Pastel pixel palette
const C = {
  skyTop: '#c8b8d8',
  skyMid: '#dcc8d8',
  skyBot: '#e8d8c8',
  hillFar: '#98b87a',
  hillNear: '#7da860',
  grass: '#6b9850',
  grassDark: '#5a8742',
  path: '#d8c8a0',
  pathDark: '#c4b48c',
  pathEdge: '#b0a078',
  dialogBg: '#f5ece0',
  dialogBorder: '#6a5878',
  dialogText: '#4a3a5a',
  uiBg: 'rgba(90,72,106,0.85)',
  uiText: '#f5ece0',
  accent: '#e8a0b0',
  accentAlt: '#a0c8e0',
  flowerPink: '#f0a0b8',
  flowerBlue: '#a0c0e8',
  flowerYellow: '#f0e080',
  mushroomCap: '#c87878',
  mushroom: '#e0a0a0',
  moon: '#f5f0d8',
  star: '#f5e8c0',
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

// ═══════════════════════════════════════════════════════════════════════════════
// MASCOT EXPRESSION COMPONENTS
// All use the real PNG assets with GSAP-powered animations.
// Base = MASCOT1.png (Tamagotchi device), Expression = the pixel puppy.
// Expression overlay is layered via absolute positioning + z-index.
// Only transform + opacity for GPU-accelerated performance.
// ═══════════════════════════════════════════════════════════════════════════════

/** Idle state — gentle breathing bob, relaxed puppy */
function MascotIdle({ onTap }: { onTap: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(charRef.current, {
      y: -2, scaleY: 1.02, duration: 1.4, ease: 'sine.inOut',
    });
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={wrapRef} className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy idle" className="mascot-char" draggable={false} />
    </div>
  );
}

/** Happy state — bouncy celebration */
function MascotHappy({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(charRef.current, {
      y: -10, scaleX: 1.08, scaleY: 0.94, rotation: -5,
      duration: 0.25, ease: 'power2.out',
    })
    .to(charRef.current, {
      y: 0, scaleX: 0.96, scaleY: 1.06, rotation: 5,
      duration: 0.25, ease: 'power2.in',
    })
    .to(charRef.current, {
      y: -8, scaleX: 1.05, scaleY: 0.96, rotation: -3,
      duration: 0.25, ease: 'power2.out',
    })
    .to(charRef.current, {
      y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      duration: 0.3, ease: 'power2.in',
    });
    return () => { tl.kill(); };
  }, []);

  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy happy" className="mascot-char" draggable={false} />
      {/* WOOF speech bubble overlay */}
      <div className="mascot-woof-bubble">WOOF!</div>
    </div>
  );
}

/** SmellBread state — sniffing animation, head tilts, used when hitting milestones */
function MascotSmellBread({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!charRef.current) return;
    const tl = gsap.timeline({ repeat: -1 });
    // Sniffing: head bob forward repeatedly
    tl.to(charRef.current, {
      y: -3, rotation: 8, scaleX: 1.03, duration: 0.3, ease: 'power1.out',
    })
    .to(charRef.current, {
      y: 0, rotation: 0, scaleX: 1, duration: 0.2, ease: 'power1.in',
    })
    .to(charRef.current, {
      y: -4, rotation: -6, scaleX: 1.02, duration: 0.3, ease: 'power1.out',
    })
    .to(charRef.current, {
      y: 0, rotation: 0, scaleX: 1, duration: 0.2, ease: 'power1.in',
    })
    .to(charRef.current, {
      y: -2, rotation: 4, duration: 0.25, ease: 'power1.out',
    })
    .to(charRef.current, {
      y: 0, rotation: 0, duration: 0.4, ease: 'power2.inOut',
    });
    return () => { tl.kill(); };
  }, []);

  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy sniffing" className="mascot-char" draggable={false} />
      {/* Sniff particles */}
      <div className="mascot-sniff-particles">
        <span className="sniff-p sniff-p1">~</span>
        <span className="sniff-p sniff-p2">~</span>
        <span className="sniff-p sniff-p3">~</span>
      </div>
    </div>
  );
}

/** Blink state — quick eye squish, then returns to idle */
function MascotBlink({ onTap }: { onTap: () => void }) {
  const charRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!charRef.current || !overlayRef.current) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
    // Blink = quick scaleY squish on the whole character
    tl.to(charRef.current, {
      scaleY: 0.92, y: 2, duration: 0.08, ease: 'power2.in',
    })
    .to(charRef.current, {
      scaleY: 1, y: 0, duration: 0.1, ease: 'power2.out',
    })
    // Double blink
    .to(charRef.current, {
      scaleY: 0.92, y: 2, duration: 0.08, ease: 'power2.in',
    }, '+=0.12')
    .to(charRef.current, {
      scaleY: 1, y: 0, duration: 0.1, ease: 'power2.out',
    })
    // Gentle idle bob in between
    .to(charRef.current, {
      y: -1.5, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1,
    });
    return () => { tl.kill(); };
  }, []);

  return (
    <div className="mascot-container" onClick={onTap}>
      <div className="mascot-shadow" />
      <img ref={charRef} src={mascotExpression} alt="Loafy blink" className="mascot-char" draggable={false} />
      <div ref={overlayRef} className="mascot-blink-overlay" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASCOT SWITCHER — picks expression component based on state
// ═══════════════════════════════════════════════════════════════════════════════

function LoafyMascot({ expression, running, onTap }: {
  expression: MascotExpression;
  running: boolean;
  onTap: () => void;
}) {
  const walkRef = useRef<HTMLDivElement>(null);

  // Walking bob driven by GSAP when running
  useEffect(() => {
    if (!walkRef.current) return;
    if (running) {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(walkRef.current, {
        y: -4, duration: 0.2, ease: 'steps(2)',
      })
      .to(walkRef.current, {
        y: 0, duration: 0.2, ease: 'steps(2)',
      });
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
      {/* Dust particles when walking */}
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

export default function App() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueState>({ text: '', visible: false, id: 0, speaker: '' });
  const [triggeredMs, setTriggeredMs] = useState<Set<number>>(() => new Set());
  const [expression, setExpression] = useState<MascotExpression>('idle');
  const [evolveFlash, setEvolveFlash] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueIdRef = useRef(0);
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = Math.min(seconds / SESSION_GOAL, 1);

  // ── Expression management ──────────────────────────────────────────────────
  const setTempExpression = useCallback((expr: MascotExpression, duration = 3000) => {
    setExpression(expr);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    expressionTimerRef.current = setTimeout(() => {
      setExpression('idle');
    }, duration);
  }, []);

  // Periodic blink when idle
  useEffect(() => {
    if (!running && expression === 'idle') {
      blinkIntervalRef.current = setInterval(() => {
        setTempExpression('blink', 4000);
      }, 6000);
      return () => { if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current); };
    }
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
  }, [running, expression, setTempExpression]);

  // ── Dialogue system ────────────────────────────────────────────────────────
  const showDialogue = useCallback((text: string, speaker = '', duration = 4500) => {
    const id = ++dialogueIdRef.current;
    setDialogue({ text, visible: true, id, speaker });
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    dialogueTimerRef.current = setTimeout(() => {
      setDialogue(prev => prev.id === id ? { ...prev, visible: false } : prev);
    }, duration);
  }, []);

  // ── Walking dialogue scheduler ─────────────────────────────────────────────
  const scheduleWalkMsg = useCallback(() => {
    const delay = randInt(20, 45) * 1000;
    walkMsgTimerRef.current = setTimeout(() => {
      showDialogue(WALK_MESSAGES[Math.floor(Math.random() * WALK_MESSAGES.length)], 'Loafy');
      // Random chance to show happy expression during walk messages
      if (Math.random() > 0.5) setTempExpression('happy', 2500);
      scheduleWalkMsg();
    }, delay);
  }, [showDialogue, setTempExpression]);

  // ── Timer controls ─────────────────────────────────────────────────────────
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
    showDialogue("A new adventure awaits!", 'Loafy');
  }, [stop, showDialogue]);

  // ── Milestone checker ("oven opens" = milestone reached → smell expression) ─
  useEffect(() => {
    if (!running) return;
    for (const ms of MILESTONES) {
      if (seconds >= ms.seconds && !triggeredMs.has(ms.seconds)) {
        setTriggeredMs(p => new Set(p).add(ms.seconds));
        // "Oven opens" → switch to smell bread expression
        setTempExpression('smell', 5000);
        setEvolveFlash(true);
        showDialogue(ms.dialogue, 'Loafy', 6000);
        setTimeout(() => setEvolveFlash(false), 2000);
      }
    }
  }, [seconds, running, triggeredMs, showDialogue, setTempExpression]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    if (walkMsgTimerRef.current) clearTimeout(walkMsgTimerRef.current);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
  }, []);

  // ── Mascot tap handler ─────────────────────────────────────────────────────
  const handleMascotTap = useCallback(() => {
    setTempExpression('happy', 2000);
    showDialogue('WOOF! *tail wag*', 'Loafy', 2500);
  }, [setTempExpression, showDialogue]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`app ${running ? 'running' : 'paused'}`}>
      <style>{cssText}</style>

      {/* ══════ SKY ══════ */}
      <div className="sky">
        <div className="px-stars">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="px-star" style={{
              left: `${(i * 5.7) % 96}%`,
              top: `${(i * 3.9) % 40}%`,
              animationDelay: `${(i * 1.1) % 4}s`,
              width: [3, 2, 3, 2][i % 4],
              height: [3, 2, 3, 2][i % 4],
            }} />
          ))}
        </div>
        <div className="px-moon"><div className="px-moon-dark" /></div>
        <div className="px-clouds">
          <div className="px-cloud px-cloud-1" />
          <div className="px-cloud px-cloud-2" />
          <div className="px-cloud px-cloud-3" />
        </div>
      </div>

      {/* ══════ HILLS ══════ */}
      <div className="hills-far"><div className="hills-far-strip" /></div>
      <div className="hills-near"><div className="hills-near-strip" /></div>

      {/* ══════ GROUND + SCENERY ══════ */}
      <div className="ground-layer">
        <div className="grass-scroll"><div className="grass-texture" /></div>
        <div className="scenery-scroll">
          <div className="scenery-strip">
            <div className="px-flower px-fl-pink" style={{ left: '5%', bottom: 14 }} />
            <div className="px-flower px-fl-blue" style={{ left: '18%', bottom: 10 }} />
            <div className="px-flower px-fl-yellow" style={{ left: '30%', bottom: 16 }} />
            <div className="px-flower px-fl-pink" style={{ left: '44%', bottom: 8 }} />
            <div className="px-flower px-fl-blue" style={{ left: '58%', bottom: 14 }} />
            <div className="px-flower px-fl-yellow" style={{ left: '70%', bottom: 12 }} />
            <div className="px-flower px-fl-pink" style={{ left: '85%', bottom: 10 }} />
            <div className="px-flower px-fl-blue" style={{ left: '95%', bottom: 16 }} />
            <div className="px-mushroom" style={{ left: '12%', bottom: 6 }} />
            <div className="px-mushroom" style={{ left: '52%', bottom: 8 }} />
            <div className="px-mushroom" style={{ left: '78%', bottom: 6 }} />
            <div className="px-grass-tuft" style={{ left: '8%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '25%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '40%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '62%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '88%', bottom: 2 }} />
          </div>
        </div>
        <div className="path-area">
          <div className="path-scroll"><div className="path-texture" /></div>
          <div className="path-dashes-scroll"><div className="path-dashes" /></div>
        </div>
        <div className="scenery-bottom-scroll">
          <div className="scenery-strip">
            <div className="px-flower px-fl-yellow" style={{ left: '10%', bottom: 6 }} />
            <div className="px-flower px-fl-pink" style={{ left: '35%', bottom: 8 }} />
            <div className="px-grass-tuft" style={{ left: '22%', bottom: 2 }} />
            <div className="px-flower px-fl-blue" style={{ left: '55%', bottom: 6 }} />
            <div className="px-mushroom" style={{ left: '75%', bottom: 4 }} />
            <div className="px-flower px-fl-pink" style={{ left: '90%', bottom: 8 }} />
            <div className="px-grass-tuft" style={{ left: '48%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '82%', bottom: 2 }} />
          </div>
        </div>
      </div>

      {/* ══════ LOAFY MASCOT (real PNG + GSAP) ══════ */}
      <div className="mascot-layer">
        <LoafyMascot expression={expression} running={running} onTap={handleMascotTap} />
      </div>

      {/* ══════ EVOLVE FLASH ══════ */}
      {evolveFlash && <div className="evolve-overlay" />}

      {/* ══════ UI OVERLAY ══════ */}
      <div className="ui-overlay">
        {/* Top bar */}
        <div className="top-bar">
          <div className="px-timer-box">
            <div className={`px-status-dot ${running ? 'active' : ''}`} />
            <span className="px-timer-text">{fmt(seconds)}</span>
          </div>
          {/* Tamagotchi device as UI badge */}
          <div className="tama-badge">
            <img src={mascotBase} alt="Tama device" className="tama-img" draggable={false} />
          </div>
          <div className="px-progress-pill">
            <span className="px-progress-text">{Math.floor(progress * 100)}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="evo-bar-wrap">
          <div className="evo-bar">
            <div className="evo-fill" style={{ width: `${progress * 100}%` }} />
            {MILESTONES.map((ms, i) => (
              <div key={i} className={`evo-marker ${triggeredMs.has(ms.seconds) ? 'reached' : ''}`}
                style={{ left: `${(ms.seconds / SESSION_GOAL) * 100}%` }}>
                <div className="evo-marker-dot" />
              </div>
            ))}
          </div>
        </div>

        {/* Dialogue box */}
        <div className={`px-dialogue ${dialogue.visible ? 'show' : 'hide'}`}>
          <div className="px-dialogue-inner">
            {dialogue.speaker && <div className="px-dialogue-speaker">{dialogue.speaker}</div>}
            <div className="px-dialogue-text">{dialogue.text}</div>
            <div className="px-dialogue-triangle" />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="bottom-bar">
          <div className="px-milestone-row">
            {MILESTONES.map(ms => (
              <div key={ms.seconds} className={`px-ms ${triggeredMs.has(ms.seconds) ? 'lit' : ''}`}>
                <span className="px-ms-icon">{ms.icon}</span>
                <span className="px-ms-label">{ms.label}</span>
              </div>
            ))}
          </div>
          <div className="px-controls">
            {!running ? (
              <button className="px-btn px-btn-start" onClick={start}>
                {seconds > 0 ? '► Continue' : '► Start Walk'}
              </button>
            ) : (
              <button className="px-btn px-btn-stop" onClick={stop}>
                ▐▐ Rest
              </button>
            )}
            {!running && seconds > 0 && (
              <button className="px-btn px-btn-reset" onClick={reset}>
                ↺ New
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL CSS
// ═══════════════════════════════════════════════════════════════════════════════

const cssText = `
@import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { height: 100%; overflow: hidden; background: ${C.skyTop}; }

.app {
  position: fixed; inset: 0;
  font-family: 'Silkscreen', monospace;
  overflow: hidden; user-select: none;
  -webkit-user-select: none;
  image-rendering: pixelated;
}

/* ═══════════ SKY ═══════════ */
.sky {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, ${C.skyTop} 0%, ${C.skyMid} 45%, ${C.skyBot} 100%);
}
.px-stars { position: absolute; inset: 0; }
.px-star {
  position: absolute;
  background: ${C.star};
  animation: pxTwinkle 3s steps(2) infinite;
}
@keyframes pxTwinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.9; }
}

.px-moon {
  position: absolute; top: 8%; right: 14%;
  width: 32px; height: 32px;
  background: ${C.moon};
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(245,240,216,0.4);
}
.px-moon-dark {
  position: absolute; top: -4px; right: -4px;
  width: 26px; height: 26px;
  background: ${C.skyTop};
  border-radius: 50%;
}

.px-clouds { position: absolute; bottom: 30%; left: 0; right: 0; height: 60px; overflow: hidden; }
.px-cloud {
  position: absolute; background: rgba(255,255,255,0.25);
  border-radius: 2px; height: 8px;
}
.px-cloud-1 { width: 48px; top: 10px; animation: cloudSlide 50s linear infinite; }
.px-cloud-2 { width: 36px; top: 28px; animation: cloudSlide 38s linear infinite; animation-delay: -15s; }
.px-cloud-3 { width: 56px; top: 6px; animation: cloudSlide 65s linear infinite; animation-delay: -30s; }
.paused .px-cloud { animation-play-state: paused; }
.running .px-cloud { animation-play-state: running; }
@keyframes cloudSlide {
  0% { transform: translateX(110vw); }
  100% { transform: translateX(-80px); }
}

/* ═══════════ HILLS ═══════════ */
.hills-far {
  position: absolute; bottom: 34%; left: 0; right: 0; height: 80px; overflow: hidden;
}
.hills-far-strip {
  position: absolute; bottom: 0; left: 0; width: 200%; height: 100%;
  background:
    radial-gradient(ellipse 100px 55px at 8% 95%, ${C.hillFar} 70%, transparent 71%),
    radial-gradient(ellipse 140px 65px at 28% 92%, ${C.hillFar} 70%, transparent 71%),
    radial-gradient(ellipse 90px 50px at 50% 96%, ${C.hillFar} 70%, transparent 71%),
    radial-gradient(ellipse 130px 60px at 70% 93%, ${C.hillFar} 70%, transparent 71%),
    radial-gradient(ellipse 110px 55px at 92% 94%, ${C.hillFar} 70%, transparent 71%);
  animation: scrollHillsFar 40s linear infinite;
}
.paused .hills-far-strip { animation-play-state: paused; }
.running .hills-far-strip { animation-play-state: running; }
@keyframes scrollHillsFar { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

.hills-near {
  position: absolute; bottom: 30%; left: 0; right: 0; height: 70px; overflow: hidden;
}
.hills-near-strip {
  position: absolute; bottom: 0; left: 0; width: 200%; height: 100%;
  background:
    radial-gradient(ellipse 80px 45px at 5% 96%, ${C.hillNear} 70%, transparent 71%),
    radial-gradient(ellipse 120px 55px at 22% 93%, ${C.hillNear} 70%, transparent 71%),
    radial-gradient(ellipse 70px 40px at 42% 97%, ${C.hillNear} 70%, transparent 71%),
    radial-gradient(ellipse 110px 50px at 60% 94%, ${C.hillNear} 70%, transparent 71%),
    radial-gradient(ellipse 90px 48px at 80% 95%, ${C.hillNear} 70%, transparent 71%),
    radial-gradient(ellipse 100px 52px at 96% 93%, ${C.hillNear} 70%, transparent 71%);
  animation: scrollHillsNear 25s linear infinite;
}
.paused .hills-near-strip { animation-play-state: paused; }
.running .hills-near-strip { animation-play-state: running; }
@keyframes scrollHillsNear { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

/* ═══════════ GROUND ═══════════ */
.ground-layer {
  position: absolute; bottom: 0; left: 0; right: 0; height: 32%;
  z-index: 3; background: ${C.grass};
}
.grass-scroll { position: absolute; inset: 0; overflow: hidden; }
.grass-texture {
  position: absolute; top: 0; left: 0; width: 200%; height: 100%;
  background: repeating-linear-gradient(90deg,
    ${C.grass} 0px, ${C.grass} 8px, ${C.grassDark} 8px, ${C.grassDark} 10px);
  animation: scrollGrass 5s linear infinite;
}
.paused .grass-texture { animation-play-state: paused; }
.running .grass-texture { animation-play-state: running; }
@keyframes scrollGrass { 0% { transform: translateX(0); } 100% { transform: translateX(-20px); } }

.scenery-scroll {
  position: absolute; top: 0; left: 0; right: 0; height: 40%;
  overflow: hidden; z-index: 1;
}
.scenery-bottom-scroll {
  position: absolute; bottom: 0; left: 0; right: 0; height: 26%;
  overflow: hidden; z-index: 1;
}
.scenery-strip {
  position: relative; width: 200%; height: 100%;
  animation: scrollScenery 12s linear infinite;
}
.paused .scenery-strip { animation-play-state: paused; }
.running .scenery-strip { animation-play-state: running; }
@keyframes scrollScenery { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

.px-flower { position: absolute; width: 6px; height: 6px; border-radius: 1px; }
.px-flower::after {
  content: ''; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
  width: 2px; height: 5px; background: #5a8a3a;
}
.px-fl-pink { background: ${C.flowerPink}; box-shadow: 0 -3px 0 ${C.flowerPink}, 3px 0 0 ${C.flowerPink}, -3px 0 0 ${C.flowerPink}, 0 3px 0 ${C.flowerPink}; }
.px-fl-blue { background: ${C.flowerBlue}; box-shadow: 0 -3px 0 ${C.flowerBlue}, 3px 0 0 ${C.flowerBlue}, -3px 0 0 ${C.flowerBlue}, 0 3px 0 ${C.flowerBlue}; }
.px-fl-yellow { background: ${C.flowerYellow}; box-shadow: 0 -3px 0 ${C.flowerYellow}, 3px 0 0 ${C.flowerYellow}, -3px 0 0 ${C.flowerYellow}, 0 3px 0 ${C.flowerYellow}; }

.px-mushroom {
  position: absolute; width: 10px; height: 6px;
  background: ${C.mushroomCap}; border-radius: 5px 5px 0 0;
}
.px-mushroom::after {
  content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
  width: 6px; height: 4px; background: ${C.mushroom}; border-radius: 0 0 2px 2px;
}
.px-mushroom::before {
  content: ''; position: absolute; top: 1px; left: 3px;
  width: 2px; height: 2px; background: rgba(255,255,255,0.6);
  border-radius: 50%; box-shadow: 4px 1px 0 rgba(255,255,255,0.4);
}

.px-grass-tuft { position: absolute; width: 2px; height: 6px; background: #4a7a38; }
.px-grass-tuft::before {
  content: ''; position: absolute; top: 0; left: -3px;
  width: 2px; height: 5px; background: #5a8a42; transform: rotate(-10deg);
}
.px-grass-tuft::after {
  content: ''; position: absolute; top: 0; right: -3px;
  width: 2px; height: 4px; background: #5a8a42; transform: rotate(12deg);
}

.path-area { position: absolute; top: 38%; left: 0; right: 0; height: 26%; z-index: 2; }
.path-scroll { position: absolute; inset: 0; overflow: hidden; }
.path-texture {
  position: absolute; top: 0; left: 0; width: 200%; height: 100%;
  background: linear-gradient(180deg,
    ${C.pathEdge} 0%, ${C.path} 12%, ${C.path} 50%, ${C.pathDark} 88%, ${C.pathEdge} 100%);
  animation: scrollPath 3.5s linear infinite;
}
.paused .path-texture { animation-play-state: paused; }
.running .path-texture { animation-play-state: running; }
@keyframes scrollPath { 0% { transform: translateX(0); } 100% { transform: translateX(-80px); } }

.path-dashes-scroll { position: absolute; top: 48%; left: 0; right: 0; height: 3px; overflow: hidden; }
.path-dashes {
  position: absolute; top: 0; left: 0; width: 200%; height: 100%;
  background: repeating-linear-gradient(90deg,
    rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 10px,
    transparent 10px, transparent 22px);
  animation: scrollDashes 2s linear infinite;
}
.paused .path-dashes { animation-play-state: paused; }
.running .path-dashes { animation-play-state: running; }
@keyframes scrollDashes { 0% { transform: translateX(0); } 100% { transform: translateX(-22px); } }

/* ═══════════ MASCOT LAYER (real PNG assets) ═══════════ */
.mascot-layer {
  position: absolute;
  bottom: calc(32% + 32% * 0.02);
  left: 50%; transform: translateX(-50%);
  z-index: 6;
}

.loafy-walk-wrapper {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  will-change: transform;
}

.mascot-container {
  position: relative;
  width: 80px; height: 80px;
  cursor: pointer;
  display: flex; align-items: flex-end; justify-content: center;
}

.mascot-char {
  width: 72px; height: auto;
  image-rendering: pixelated;
  will-change: transform, opacity;
  transform-origin: center bottom;
  filter: drop-shadow(0 2px 1px rgba(0,0,0,0.15));
  position: relative; z-index: 2;
}

.mascot-shadow {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 48px; height: 8px;
  background: rgba(0,0,0,0.12);
  border-radius: 50%;
  z-index: 1;
}

/* WOOF bubble (happy expression) */
.mascot-woof-bubble {
  position: absolute; top: -6px; right: -18px;
  background: #fff;
  border: 3px solid #5a4a3a;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 8px; font-weight: 700;
  color: #5a4a3a;
  z-index: 10;
  animation: woofPop 0.3s ease-out;
  box-shadow: 2px 2px 0 rgba(90,74,58,0.15);
}
.mascot-woof-bubble::after {
  content: '';
  position: absolute; bottom: -6px; left: 10px;
  width: 0; height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid #5a4a3a;
}
@keyframes woofPop {
  0% { opacity: 0; transform: scale(0.5) translateY(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Sniff particles (smell expression) */
.mascot-sniff-particles {
  position: absolute; top: 10px; right: -12px;
  display: flex; flex-direction: column; gap: 2px;
  z-index: 10;
}
.sniff-p {
  font-size: 10px; color: ${C.accent};
  opacity: 0;
  animation: sniffFloat 1.5s ease-out infinite;
}
.sniff-p1 { animation-delay: 0s; }
.sniff-p2 { animation-delay: 0.3s; }
.sniff-p3 { animation-delay: 0.6s; }
@keyframes sniffFloat {
  0% { opacity: 0; transform: translateX(0) translateY(0); }
  30% { opacity: 0.8; }
  100% { opacity: 0; transform: translateX(12px) translateY(-10px); }
}

/* Blink overlay (covers eyes area briefly) */
.mascot-blink-overlay {
  position: absolute;
  top: 28%; left: 20%; right: 20%; height: 8px;
  z-index: 3;
  pointer-events: none;
}

/* Dust when walking */
.mascot-dust {
  position: absolute; bottom: 2px; right: -6px;
  width: 20px; height: 14px; pointer-events: none;
}
.m-dust {
  position: absolute; width: 4px; height: 4px;
  background: ${C.pathDark}; border-radius: 1px; opacity: 0.4;
}
.m-dust-1 {
  bottom: 2px; right: 0;
  animation: mDustGo 0.7s steps(3) infinite;
}
.m-dust-2 {
  bottom: 5px; right: 5px;
  animation: mDustGo 0.7s steps(3) infinite 0.25s;
}
@keyframes mDustGo {
  0% { opacity: 0.4; transform: translate(0, 0); }
  100% { opacity: 0; transform: translate(8px, -8px); }
}

/* ═══════════ EVOLVE FLASH ═══════════ */
.evolve-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(255,255,240,0.6);
  animation: evoFlash 2s steps(4) forwards;
  pointer-events: none;
}
@keyframes evoFlash {
  0% { opacity: 1; }
  30% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* ═══════════ UI OVERLAY ═══════════ */
.ui-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  justify-content: space-between;
  z-index: 10; pointer-events: none;
}
.ui-overlay > * { pointer-events: auto; }

.top-bar {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 10px 12px 0;
}

.px-timer-box {
  display: flex; align-items: center; gap: 6px;
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 5px 10px;
}
.px-status-dot {
  width: 6px; height: 6px; background: #888;
  border-radius: 1px; transition: background 0.3s;
}
.px-status-dot.active {
  background: #80e890;
  box-shadow: 0 0 4px rgba(128,232,144,0.6);
}
.px-timer-text {
  font-size: 14px; font-weight: 700;
  color: ${C.uiText}; font-variant-numeric: tabular-nums;
}

/* Tamagotchi device badge */
.tama-badge {
  width: 44px; height: 44px;
  border-radius: 6px;
  overflow: hidden;
  border: 3px solid ${C.dialogBorder};
  background: ${C.uiBg};
  display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 rgba(106,88,120,0.2);
}
.tama-img {
  width: 38px; height: 38px;
  object-fit: cover;
  image-rendering: pixelated;
}

.px-progress-pill {
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 5px 10px;
}
.px-progress-text {
  font-size: 12px; font-weight: 700;
  color: ${C.accent};
}

/* Progress bar */
.evo-bar-wrap {
  position: relative;
  margin: 6px 14px 0;
  height: 16px;
}
.evo-bar {
  position: relative; height: 8px;
  background: rgba(90,72,106,0.5);
  border: 2px solid ${C.dialogBorder};
  border-radius: 2px; overflow: visible;
}
.evo-fill {
  height: 100%;
  background: linear-gradient(90deg, ${C.accent}, ${C.accentAlt});
  border-radius: 1px;
  transition: width 1s ease;
}
.evo-marker {
  position: absolute; top: -3px;
  width: 8px; height: 14px;
  transform: translateX(-50%);
  display: flex; align-items: center; justify-content: center;
}
.evo-marker-dot {
  width: 6px; height: 6px;
  background: #888;
  border: 2px solid ${C.dialogBorder};
  border-radius: 1px;
  transition: background 0.5s;
}
.evo-marker.reached .evo-marker-dot {
  background: ${C.flowerYellow};
  box-shadow: 0 0 4px rgba(240,224,128,0.5);
}

/* ═══════════ PIXEL DIALOGUE BOX ═══════════ */
.px-dialogue {
  position: absolute;
  bottom: 130px;
  left: 8px; right: 8px;
  z-index: 15;
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: none;
}
.px-dialogue.show { opacity: 1; transform: translateY(0); }
.px-dialogue.hide { opacity: 0; transform: translateY(8px); }
.px-dialogue-inner {
  position: relative;
  background: ${C.dialogBg};
  border: 4px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 10px 14px;
  box-shadow: 4px 4px 0 rgba(106,88,120,0.2);
}
.px-dialogue-speaker {
  position: absolute;
  top: -12px; left: 10px;
  background: ${C.dialogBorder};
  color: ${C.uiText};
  font-size: 9px; font-weight: 700;
  padding: 2px 8px;
  border-radius: 3px 3px 0 0;
  letter-spacing: 0.05em;
}
.px-dialogue-text {
  font-size: 12px;
  color: ${C.dialogText};
  line-height: 1.6;
  letter-spacing: 0.02em;
}
.px-dialogue-triangle {
  position: absolute;
  bottom: 6px; right: 10px;
  width: 0; height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid ${C.dialogBorder};
  animation: pxTriPulse 1.2s steps(2) infinite;
}
@keyframes pxTriPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}

/* Bottom bar */
.bottom-bar {
  padding: 0 12px 14px;
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
}
.px-milestone-row { display: flex; gap: 8px; }
.px-ms {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: rgba(90,72,106,0.6);
  border: 2px solid ${C.dialogBorder};
  border-radius: 3px; padding: 4px 8px;
  filter: grayscale(0.7) brightness(0.6);
  transition: all 0.5s;
}
.px-ms.lit {
  filter: grayscale(0) brightness(1);
  border-color: ${C.flowerYellow};
  box-shadow: 0 0 6px rgba(240,224,128,0.3);
}
.px-ms-icon { font-size: 14px; }
.px-ms-label { font-size: 7px; color: ${C.uiText}; opacity: 0.7; }

.px-controls { display: flex; gap: 6px; }
.px-btn {
  padding: 8px 20px;
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  font-family: 'Silkscreen', monospace;
  font-size: 12px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.02em;
  transition: transform 0.1s;
  box-shadow: 3px 3px 0 rgba(106,88,120,0.25);
}
.px-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(106,88,120,0.25);
}
.px-btn-start {
  background: linear-gradient(180deg, ${C.accent}, #d08898);
  color: #fff; border-color: #a06878;
}
.px-btn-stop {
  background: linear-gradient(180deg, ${C.accentAlt}, #88b0c8);
  color: #fff; border-color: #6890a8;
}
.px-btn-reset {
  background: rgba(90,72,106,0.6);
  color: ${C.uiText}; font-size: 10px; padding: 8px 14px;
}

@media (max-width: 400px) {
  .px-timer-text { font-size: 12px; }
  .px-dialogue-text { font-size: 11px; }
  .px-btn { font-size: 11px; padding: 7px 16px; }
  .mascot-char { width: 60px; }
  .mascot-container { width: 68px; height: 68px; }
  .tama-badge { width: 38px; height: 38px; }
  .tama-img { width: 32px; height: 32px; }
}
`;
