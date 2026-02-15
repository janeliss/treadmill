import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface EvolutionStage {
  minSeconds: number;
  name: string;
  bodyW: number;
  bodyH: number;
  hasEars: boolean;
  hasFeet: boolean;
  hasBlush: boolean;
  hasAccessory: boolean;
  accessory: 'none' | 'leaf' | 'scarf' | 'crown';
  walkMsg: string;
  evolveMsg: string;
}

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

const STAGES: EvolutionStage[] = [
  {
    minSeconds: 0, name: 'Pip',
    bodyW: 20, bodyH: 18,
    hasEars: false, hasFeet: false, hasBlush: false,
    hasAccessory: false, accessory: 'none',
    walkMsg: '...! *bounces along*',
    evolveMsg: 'A tiny pip appears!',
  },
  {
    minSeconds: 120, name: 'Sprout',
    bodyW: 24, bodyH: 22,
    hasEars: false, hasFeet: true, hasBlush: true,
    hasAccessory: true, accessory: 'leaf',
    walkMsg: '*waddle waddle* This is fun!',
    evolveMsg: 'Pip sprouted tiny feet!',
  },
  {
    minSeconds: 300, name: 'Bud',
    bodyW: 28, bodyH: 26,
    hasEars: true, hasFeet: true, hasBlush: true,
    hasAccessory: true, accessory: 'leaf',
    walkMsg: 'The breeze feels so nice~',
    evolveMsg: 'Look! Bud grew little ears!',
  },
  {
    minSeconds: 600, name: 'Bloom',
    bodyW: 32, bodyH: 28,
    hasEars: true, hasFeet: true, hasBlush: true,
    hasAccessory: true, accessory: 'scarf',
    walkMsg: 'I love our walks together!',
    evolveMsg: 'Bloom found a cozy scarf!',
  },
  {
    minSeconds: 1200, name: 'Flora',
    bodyW: 36, bodyH: 30,
    hasEars: true, hasFeet: true, hasBlush: true,
    hasAccessory: true, accessory: 'crown',
    walkMsg: 'We did it! What a journey!',
    evolveMsg: 'Flora earned a flower crown!',
  },
];

const WALK_MESSAGES = [
  "Look at those flowers!",
  "The air smells like honey~",
  "*happy humming*",
  "I wonder what's ahead...",
  "This path is so pretty!",
  "Can you hear the birds?",
  "Let's keep going!",
  "I feel so warm and cozy~",
  "The sky looks amazing!",
  "Best walk ever!",
  "*tiny yawn* ...still going!",
  "I see something sparkly!",
  "Nature is so peaceful~",
  "My little feet are dancing!",
];

const MILESTONES: Milestone[] = [
  { seconds: 120, label: '2 min', icon: '🌱', dialogue: "Something is happening... Pip is changing!" },
  { seconds: 300, label: '5 min', icon: '🌸', dialogue: "The journey grows! Ears have appeared!" },
  { seconds: 600, label: '10 min', icon: '🧣', dialogue: "A cozy reward for a dedicated walker!" },
  { seconds: 1200, label: '20 min', icon: '👑', dialogue: "The ultimate form! A true walking champion!" },
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
  body: '#f5dca8',
  bodyShade: '#e8c88c',
  outline: '#5a4a3a',
  earInner: '#f0b8a0',
  blush: '#f0a0a0',
  eyeColor: '#3a2a2a',
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
  mushroom: '#e0a0a0',
  mushroomCap: '#c87878',
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

function getStage(seconds: number): EvolutionStage {
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (seconds >= s.minSeconds) stage = s;
  }
  return stage;
}

function getStageIndex(seconds: number): number {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (seconds >= STAGES[i].minSeconds) idx = i;
  }
  return idx;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIXEL MASCOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PixelMascot({ stage, running, seconds }: { stage: EvolutionStage; running: boolean; seconds: number }) {
  const stageIdx = getStageIndex(seconds);

  return (
    <div className={`px-mascot ${running ? 'px-walking' : 'px-idle'} px-stage-${stageIdx}`}>
      {/* Shadow */}
      <div className="px-shadow" style={{ width: stage.bodyW + 8 }} />

      <div className="px-body-group">
        {/* Accessory above */}
        {stage.hasAccessory && stage.accessory === 'leaf' && (
          <div className="px-leaf">
            <div className="px-leaf-stem" />
            <div className="px-leaf-blade" />
          </div>
        )}
        {stage.hasAccessory && stage.accessory === 'crown' && (
          <div className="px-crown">
            <div className="px-crown-point px-crown-l" />
            <div className="px-crown-point px-crown-m" />
            <div className="px-crown-point px-crown-r" />
            <div className="px-crown-base" />
          </div>
        )}

        {/* Ears */}
        {stage.hasEars && (
          <>
            <div className="px-ear px-ear-l" />
            <div className="px-ear px-ear-r" />
          </>
        )}

        {/* Main body */}
        <div className="px-body" style={{ width: stage.bodyW, height: stage.bodyH }}>
          {/* Eyes */}
          <div className="px-eyes">
            <div className={`px-eye ${!running ? 'px-blink' : ''}`} />
            <div className={`px-eye ${!running ? 'px-blink' : ''}`} />
          </div>
          {/* Blush */}
          {stage.hasBlush && (
            <div className="px-blush-row">
              <div className="px-blush" />
              <div className="px-blush" />
            </div>
          )}
          {/* Mouth */}
          <div className="px-mouth">
            {running ? <div className="px-mouth-o" /> : <div className="px-mouth-w" />}
          </div>
        </div>

        {/* Scarf */}
        {stage.hasAccessory && stage.accessory === 'scarf' && (
          <div className="px-scarf">
            <div className="px-scarf-knot" />
            <div className="px-scarf-tail" />
          </div>
        )}

        {/* Feet */}
        {stage.hasFeet && (
          <div className="px-feet">
            <div className="px-foot px-foot-l" />
            <div className="px-foot px-foot-r" />
          </div>
        )}
      </div>

      {/* Dust when walking */}
      {running && stage.hasFeet && (
        <div className="px-dust-wrap">
          <div className="px-dust px-dust-1" />
          <div className="px-dust px-dust-2" />
        </div>
      )}

      {/* Sparkles for final evolution */}
      {stageIdx >= 4 && (
        <div className="px-sparkles">
          <div className="px-sparkle px-sp-1" />
          <div className="px-sparkle px-sp-2" />
          <div className="px-sparkle px-sp-3" />
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
  const [triggeredEvos, setTriggeredEvos] = useState<Set<number>>(() => new Set([0]));
  const [evolveFlash, setEvolveFlash] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueIdRef = useRef(0);
  const prevStageRef = useRef(0);

  const stage = getStage(seconds);
  const stageIdx = getStageIndex(seconds);
  const progress = Math.min(seconds / SESSION_GOAL, 1);

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
      const msgs = [...WALK_MESSAGES, stage.walkMsg];
      showDialogue(msgs[Math.floor(Math.random() * msgs.length)], stage.name);
      scheduleWalkMsg();
    }, delay);
  }, [stage, showDialogue]);

  // ── Timer controls ─────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    showDialogue("Let's go for a walk!", stage.name);
    timerRef.current = setInterval(() => setSeconds(p => p + 1), 1000);
    scheduleWalkMsg();
  }, [running, showDialogue, scheduleWalkMsg, stage]);

  const stop = useCallback(() => {
    if (!running) return;
    setRunning(false);
    showDialogue("*sits down* ...nice break~", stage.name);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (walkMsgTimerRef.current) { clearTimeout(walkMsgTimerRef.current); walkMsgTimerRef.current = null; }
  }, [running, stage, showDialogue]);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
    setTriggeredMs(new Set());
    setTriggeredEvos(new Set([0]));
    setEvolveFlash(false);
    prevStageRef.current = 0;
    showDialogue("A new adventure awaits!", 'Pip');
  }, [stop, showDialogue]);

  // ── Evolution checker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const curIdx = getStageIndex(seconds);
    if (curIdx > prevStageRef.current && !triggeredEvos.has(curIdx)) {
      const s = STAGES[curIdx];
      setTriggeredEvos(p => new Set(p).add(curIdx));
      prevStageRef.current = curIdx;
      setEvolveFlash(true);
      showDialogue(s.evolveMsg, s.name, 6000);
      setTimeout(() => setEvolveFlash(false), 2000);
    }
    // Milestone messages
    for (const ms of MILESTONES) {
      if (seconds >= ms.seconds && !triggeredMs.has(ms.seconds)) {
        setTriggeredMs(p => new Set(p).add(ms.seconds));
      }
    }
  }, [seconds, running, triggeredMs, triggeredEvos, showDialogue]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    if (walkMsgTimerRef.current) clearTimeout(walkMsgTimerRef.current);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`app ${running ? 'running' : 'paused'} ${evolveFlash ? 'evolve-flash' : ''}`}>
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
        <div className="px-moon">
          <div className="px-moon-dark" />
        </div>
        <div className="px-clouds">
          <div className="px-cloud px-cloud-1" />
          <div className="px-cloud px-cloud-2" />
          <div className="px-cloud px-cloud-3" />
        </div>
      </div>

      {/* ══════ FAR HILLS ══════ */}
      <div className="hills-far">
        <div className="hills-far-strip" />
      </div>

      {/* ══════ NEAR HILLS ══════ */}
      <div className="hills-near">
        <div className="hills-near-strip" />
      </div>

      {/* ══════ GROUND + SCENERY ══════ */}
      <div className="ground-layer">
        {/* Grass texture scroll */}
        <div className="grass-scroll">
          <div className="grass-texture" />
        </div>

        {/* Pixel flowers and mushrooms */}
        <div className="scenery-scroll">
          <div className="scenery-strip">
            {/* Flowers */}
            <div className="px-flower px-fl-pink" style={{ left: '5%', bottom: 14 }} />
            <div className="px-flower px-fl-blue" style={{ left: '18%', bottom: 10 }} />
            <div className="px-flower px-fl-yellow" style={{ left: '30%', bottom: 16 }} />
            <div className="px-flower px-fl-pink" style={{ left: '44%', bottom: 8 }} />
            <div className="px-flower px-fl-blue" style={{ left: '58%', bottom: 14 }} />
            <div className="px-flower px-fl-yellow" style={{ left: '70%', bottom: 12 }} />
            <div className="px-flower px-fl-pink" style={{ left: '85%', bottom: 10 }} />
            <div className="px-flower px-fl-blue" style={{ left: '95%', bottom: 16 }} />
            {/* Mushrooms */}
            <div className="px-mushroom" style={{ left: '12%', bottom: 6 }} />
            <div className="px-mushroom" style={{ left: '52%', bottom: 8 }} />
            <div className="px-mushroom" style={{ left: '78%', bottom: 6 }} />
            {/* Grass tufts */}
            <div className="px-grass-tuft" style={{ left: '8%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '25%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '40%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '62%', bottom: 2 }} />
            <div className="px-grass-tuft" style={{ left: '88%', bottom: 2 }} />
          </div>
        </div>

        {/* Walking path */}
        <div className="path-area">
          <div className="path-scroll">
            <div className="path-texture" />
          </div>
          <div className="path-dashes-scroll">
            <div className="path-dashes" />
          </div>
        </div>

        {/* Bottom scenery (below path) */}
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

      {/* ══════ MASCOT ══════ */}
      <div className="mascot-layer">
        <PixelMascot stage={stage} running={running} seconds={seconds} />
      </div>

      {/* ══════ EVOLVE FLASH OVERLAY ══════ */}
      {evolveFlash && <div className="evolve-overlay" />}

      {/* ══════ UI OVERLAY ══════ */}
      <div className="ui-overlay">
        {/* Top bar - pixel style */}
        <div className="top-bar">
          <div className="px-timer-box">
            <div className={`px-status-dot ${running ? 'active' : ''}`} />
            <span className="px-timer-text">{fmt(seconds)}</span>
          </div>
          <div className="px-stage-badge">
            <span className="px-stage-name">{stage.name}</span>
            <span className="px-stage-lvl">Lv.{stageIdx + 1}</span>
          </div>
        </div>

        {/* Evolution progress bar */}
        <div className="evo-bar-wrap">
          <div className="evo-bar">
            <div className="evo-fill" style={{ width: `${progress * 100}%` }} />
            {STAGES.map((s, i) => (
              <div key={i} className={`evo-marker ${stageIdx >= i ? 'reached' : ''}`}
                style={{ left: `${(s.minSeconds / SESSION_GOAL) * 100}%` }}>
                <div className="evo-marker-dot" />
              </div>
            ))}
          </div>
          <div className="evo-labels">
            {STAGES.map((s, i) => (
              <span key={i} className={`evo-label ${stageIdx >= i ? 'reached' : ''}`}
                style={{ left: `${(s.minSeconds / SESSION_GOAL) * 100}%` }}>
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Dialogue box (pixel style, bottom) */}
        <div className={`px-dialogue ${dialogue.visible ? 'show' : 'hide'}`}>
          <div className="px-dialogue-inner">
            {dialogue.speaker && (
              <div className="px-dialogue-speaker">{dialogue.speaker}</div>
            )}
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
// ALL CSS — pixel art pastel world
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
  position: absolute;
  background: rgba(255,255,255,0.25);
  border-radius: 2px;
  height: 8px;
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
  position: absolute; bottom: 34%; left: 0; right: 0; height: 80px;
  overflow: hidden;
}
.hills-far-strip {
  position: absolute; bottom: 0; left: 0;
  width: 200%; height: 100%;
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
@keyframes scrollHillsFar {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.hills-near {
  position: absolute; bottom: 30%; left: 0; right: 0; height: 70px;
  overflow: hidden;
}
.hills-near-strip {
  position: absolute; bottom: 0; left: 0;
  width: 200%; height: 100%;
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
@keyframes scrollHillsNear {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ═══════════ GROUND ═══════════ */
.ground-layer {
  position: absolute; bottom: 0; left: 0; right: 0; height: 32%;
  z-index: 3;
  background: ${C.grass};
}

.grass-scroll {
  position: absolute; inset: 0; overflow: hidden;
}
.grass-texture {
  position: absolute; top: 0; left: 0;
  width: 200%; height: 100%;
  background:
    repeating-linear-gradient(90deg,
      ${C.grass} 0px, ${C.grass} 8px,
      ${C.grassDark} 8px, ${C.grassDark} 10px
    );
  animation: scrollGrass 5s linear infinite;
}
.paused .grass-texture { animation-play-state: paused; }
.running .grass-texture { animation-play-state: running; }
@keyframes scrollGrass {
  0% { transform: translateX(0); }
  100% { transform: translateX(-20px); }
}

/* Scenery (flowers, mushrooms) scrolling */
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
@keyframes scrollScenery {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Pixel flowers */
.px-flower {
  position: absolute;
  width: 6px; height: 6px;
  border-radius: 1px;
}
.px-flower::after {
  content: '';
  position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
  width: 2px; height: 5px;
  background: #5a8a3a;
}
.px-fl-pink { background: ${C.flowerPink}; box-shadow: 0 -3px 0 ${C.flowerPink}, 3px 0 0 ${C.flowerPink}, -3px 0 0 ${C.flowerPink}, 0 3px 0 ${C.flowerPink}; }
.px-fl-blue { background: ${C.flowerBlue}; box-shadow: 0 -3px 0 ${C.flowerBlue}, 3px 0 0 ${C.flowerBlue}, -3px 0 0 ${C.flowerBlue}, 0 3px 0 ${C.flowerBlue}; }
.px-fl-yellow { background: ${C.flowerYellow}; box-shadow: 0 -3px 0 ${C.flowerYellow}, 3px 0 0 ${C.flowerYellow}, -3px 0 0 ${C.flowerYellow}, 0 3px 0 ${C.flowerYellow}; }

/* Pixel mushrooms */
.px-mushroom {
  position: absolute;
  width: 10px; height: 6px;
  background: ${C.mushroomCap};
  border-radius: 5px 5px 0 0;
}
.px-mushroom::after {
  content: '';
  position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
  width: 6px; height: 4px;
  background: ${C.mushroom};
  border-radius: 0 0 2px 2px;
}
.px-mushroom::before {
  content: '';
  position: absolute; top: 1px; left: 3px;
  width: 2px; height: 2px;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  box-shadow: 4px 1px 0 rgba(255,255,255,0.4);
}

/* Pixel grass tufts */
.px-grass-tuft {
  position: absolute;
  width: 2px; height: 6px;
  background: #4a7a38;
}
.px-grass-tuft::before {
  content: '';
  position: absolute; top: 0; left: -3px;
  width: 2px; height: 5px;
  background: #5a8a42;
  transform: rotate(-10deg);
}
.px-grass-tuft::after {
  content: '';
  position: absolute; top: 0; right: -3px;
  width: 2px; height: 4px;
  background: #5a8a42;
  transform: rotate(12deg);
}

/* Walking path */
.path-area {
  position: absolute; top: 38%; left: 0; right: 0; height: 26%;
  z-index: 2;
}
.path-scroll {
  position: absolute; inset: 0; overflow: hidden;
}
.path-texture {
  position: absolute; top: 0; left: 0;
  width: 200%; height: 100%;
  background: linear-gradient(180deg,
    ${C.pathEdge} 0%, ${C.path} 12%, ${C.path} 50%,
    ${C.pathDark} 88%, ${C.pathEdge} 100%
  );
  animation: scrollPath 3.5s linear infinite;
}
.paused .path-texture { animation-play-state: paused; }
.running .path-texture { animation-play-state: running; }
@keyframes scrollPath {
  0% { transform: translateX(0); }
  100% { transform: translateX(-80px); }
}

.path-dashes-scroll {
  position: absolute; top: 48%; left: 0; right: 0; height: 3px;
  overflow: hidden;
}
.path-dashes {
  position: absolute; top: 0; left: 0;
  width: 200%; height: 100%;
  background: repeating-linear-gradient(90deg,
    rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 10px,
    transparent 10px, transparent 22px
  );
  animation: scrollDashes 2s linear infinite;
}
.paused .path-dashes { animation-play-state: paused; }
.running .path-dashes { animation-play-state: running; }
@keyframes scrollDashes {
  0% { transform: translateX(0); }
  100% { transform: translateX(-22px); }
}

/* ═══════════ PIXEL MASCOT ═══════════ */
.mascot-layer {
  position: absolute;
  bottom: calc(32% + 32% * 0.05);
  left: 50%; transform: translateX(-50%);
  z-index: 6;
}

.px-mascot {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
}

.px-shadow {
  position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
  height: 4px;
  background: rgba(0,0,0,0.15);
  border-radius: 50%;
}

.px-body-group {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
}

/* Walking bob */
.px-walking .px-body-group {
  animation: pxWalkBob 0.4s steps(2) infinite;
}
@keyframes pxWalkBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Idle breathing */
.px-idle .px-body-group {
  animation: pxIdleBob 2.5s steps(4) infinite;
}
@keyframes pxIdleBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

/* Body */
.px-body {
  background: ${C.body};
  border: 3px solid ${C.outline};
  border-radius: 8px 8px 6px 6px;
  position: relative;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1px;
  box-shadow: inset -4px -4px 0 rgba(0,0,0,0.06);
  transition: width 0.6s, height 0.6s;
}

/* Scale up per stage */
.px-stage-0 .px-body { transform: scale(1); }
.px-stage-1 .px-body { transform: scale(1.1); }
.px-stage-2 .px-body { transform: scale(1.2); }
.px-stage-3 .px-body { transform: scale(1.3); }
.px-stage-4 .px-body { transform: scale(1.45); }

/* Eyes */
.px-eyes {
  display: flex; gap: 6px;
  margin-top: 2px;
}
.px-eye {
  width: 4px; height: 4px;
  background: ${C.eyeColor};
  border-radius: 1px;
}
.px-eye.px-blink {
  animation: pxBlink 4s steps(1) infinite;
}
@keyframes pxBlink {
  0%, 44%, 48%, 100% { height: 4px; }
  45%, 47% { height: 1px; }
}

/* Blush */
.px-blush-row {
  display: flex; gap: 10px;
  margin-top: 1px;
}
.px-blush {
  width: 4px; height: 2px;
  background: ${C.blush};
  border-radius: 1px;
  opacity: 0.7;
}

/* Mouth */
.px-mouth {
  margin-top: 1px;
  display: flex; justify-content: center;
}
.px-mouth-w {
  width: 4px; height: 2px;
  border-bottom: 2px solid ${C.outline};
  border-radius: 0 0 2px 2px;
}
.px-mouth-o {
  width: 3px; height: 3px;
  background: ${C.outline};
  border-radius: 50%;
  animation: pxMouthPulse 0.8s steps(2) infinite;
}
@keyframes pxMouthPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

/* Ears */
.px-ear {
  position: absolute;
  width: 8px; height: 10px;
  background: ${C.body};
  border: 2px solid ${C.outline};
  border-radius: 3px 3px 1px 1px;
  top: -8px;
  z-index: -1;
}
.px-ear::after {
  content: '';
  position: absolute; top: 2px; left: 50%; transform: translateX(-50%);
  width: 3px; height: 4px;
  background: ${C.earInner};
  border-radius: 1px;
}
.px-ear-l { left: 2px; transform: rotate(-8deg); }
.px-ear-r { right: 2px; transform: rotate(8deg); }

.px-walking .px-ear-l { animation: pxEarL 0.4s steps(2) infinite; }
.px-walking .px-ear-r { animation: pxEarR 0.4s steps(2) infinite; }
@keyframes pxEarL {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(-14deg) translateY(-1px); }
}
@keyframes pxEarR {
  0%, 100% { transform: rotate(8deg); }
  50% { transform: rotate(14deg) translateY(-1px); }
}

/* Feet */
.px-feet {
  display: flex; gap: 6px;
  margin-top: -1px;
}
.px-foot {
  width: 8px; height: 5px;
  background: ${C.bodyShade};
  border: 2px solid ${C.outline};
  border-radius: 2px;
}
.px-walking .px-foot-l { animation: pxFootL 0.4s steps(2) infinite; }
.px-walking .px-foot-r { animation: pxFootR 0.4s steps(2) infinite; }
@keyframes pxFootL {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px) translateX(-1px); }
}
@keyframes pxFootR {
  0%, 100% { transform: translateY(-2px) translateX(1px); }
  50% { transform: translateY(0); }
}

/* Leaf accessory */
.px-leaf {
  position: relative;
  width: 10px; height: 8px;
  margin-bottom: -2px;
}
.px-leaf-stem {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 2px; height: 5px;
  background: #5a8a3a;
}
.px-leaf-blade {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 8px; height: 5px;
  background: #7ab850;
  border-radius: 2px 2px 4px 4px;
  border: 1px solid #5a8a3a;
}
.px-walking .px-leaf {
  animation: pxLeafBounce 0.6s steps(3) infinite;
}
@keyframes pxLeafBounce {
  0%, 100% { transform: rotate(0deg); }
  33% { transform: rotate(-8deg); }
  66% { transform: rotate(8deg); }
}

/* Scarf accessory */
.px-scarf {
  position: relative;
  width: 100%; height: 6px;
  margin-top: -4px;
  display: flex; justify-content: center;
}
.px-scarf-knot {
  width: 14px; height: 6px;
  background: ${C.accent};
  border: 2px solid #c07888;
  border-radius: 2px;
}
.px-scarf-tail {
  position: absolute; right: -2px; top: 2px;
  width: 6px; height: 8px;
  background: ${C.accent};
  border: 2px solid #c07888;
  border-radius: 0 0 2px 2px;
}
.px-walking .px-scarf-tail {
  animation: pxScarfWave 0.5s steps(2) infinite;
}
@keyframes pxScarfWave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(8deg) translateX(1px); }
}

/* Crown accessory */
.px-crown {
  position: relative;
  width: 20px; height: 10px;
  margin-bottom: -3px;
  display: flex; flex-direction: column; align-items: center;
}
.px-crown-base {
  width: 18px; height: 5px;
  background: #f0d050;
  border: 2px solid #c0a030;
  border-radius: 1px;
}
.px-crown-point {
  position: absolute; top: 0;
  width: 4px; height: 5px;
  background: #f0d050;
  border: 1px solid #c0a030;
}
.px-crown-l { left: 1px; }
.px-crown-m { left: 50%; transform: translateX(-50%); height: 6px; }
.px-crown-r { right: 1px; }

/* Dust */
.px-dust-wrap {
  position: absolute; bottom: 0; right: -8px;
  width: 16px; height: 12px;
}
.px-dust {
  position: absolute;
  width: 3px; height: 3px;
  background: ${C.pathDark};
  border-radius: 1px;
  opacity: 0.5;
}
.px-dust-1 {
  bottom: 2px; right: 0;
  animation: pxDustGo 0.7s steps(3) infinite;
}
.px-dust-2 {
  bottom: 4px; right: 4px;
  animation: pxDustGo 0.7s steps(3) infinite 0.2s;
}
@keyframes pxDustGo {
  0% { opacity: 0.5; transform: translate(0, 0); }
  100% { opacity: 0; transform: translate(6px, -6px); }
}

/* Sparkles for max evolution */
.px-sparkles {
  position: absolute; inset: -12px;
  pointer-events: none;
}
.px-sparkle {
  position: absolute;
  width: 3px; height: 3px;
  background: ${C.star};
  animation: pxSpark 1.5s steps(3) infinite;
}
.px-sp-1 { top: 0; left: 20%; animation-delay: 0s; }
.px-sp-2 { top: 30%; right: 0; animation-delay: 0.5s; }
.px-sp-3 { bottom: 10%; left: 10%; animation-delay: 1s; }
@keyframes pxSpark {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.5); }
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
  z-index: 10;
  pointer-events: none;
}
.ui-overlay > * { pointer-events: auto; }

/* Top bar */
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
  width: 6px; height: 6px;
  background: #888;
  border-radius: 1px;
  transition: background 0.3s;
}
.px-status-dot.active {
  background: #80e890;
  box-shadow: 0 0 4px rgba(128,232,144,0.6);
}
.px-timer-text {
  font-size: 14px; font-weight: 700;
  color: ${C.uiText};
  font-variant-numeric: tabular-nums;
}

.px-stage-badge {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  background: ${C.uiBg};
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 4px 10px;
}
.px-stage-name {
  font-size: 11px; font-weight: 700;
  color: ${C.accent};
}
.px-stage-lvl {
  font-size: 9px;
  color: ${C.uiText};
  opacity: 0.7;
}

/* Evolution progress bar */
.evo-bar-wrap {
  position: relative;
  margin: 6px 14px 0;
  height: 24px;
}
.evo-bar {
  position: relative;
  height: 8px;
  background: rgba(90,72,106,0.5);
  border: 2px solid ${C.dialogBorder};
  border-radius: 2px;
  overflow: visible;
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
.evo-labels {
  position: relative; height: 12px; margin-top: 2px;
}
.evo-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 7px;
  color: rgba(255,255,255,0.4);
  transition: color 0.5s;
}
.evo-label.reached {
  color: ${C.uiText};
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
.px-dialogue.show {
  opacity: 1; transform: translateY(0);
}
.px-dialogue.hide {
  opacity: 0; transform: translateY(8px);
}
.px-dialogue-inner {
  position: relative;
  background: ${C.dialogBg};
  border: 4px solid ${C.dialogBorder};
  border-radius: 4px;
  padding: 10px 14px 10px 14px;
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

.px-milestone-row {
  display: flex; gap: 8px;
}
.px-ms {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: rgba(90,72,106,0.6);
  border: 2px solid ${C.dialogBorder};
  border-radius: 3px;
  padding: 4px 8px;
  filter: grayscale(0.7) brightness(0.6);
  transition: all 0.5s;
}
.px-ms.lit {
  filter: grayscale(0) brightness(1);
  border-color: ${C.flowerYellow};
  box-shadow: 0 0 6px rgba(240,224,128,0.3);
}
.px-ms-icon { font-size: 14px; }
.px-ms-label {
  font-size: 7px;
  color: ${C.uiText};
  opacity: 0.7;
}

.px-controls {
  display: flex; gap: 6px;
}

.px-btn {
  padding: 8px 20px;
  border: 3px solid ${C.dialogBorder};
  border-radius: 4px;
  font-family: 'Silkscreen', monospace;
  font-size: 12px; font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: transform 0.1s;
  box-shadow: 3px 3px 0 rgba(106,88,120,0.25);
}
.px-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(106,88,120,0.25);
}

.px-btn-start {
  background: linear-gradient(180deg, ${C.accent}, #d08898);
  color: #fff;
  border-color: #a06878;
}
.px-btn-stop {
  background: linear-gradient(180deg, ${C.accentAlt}, #88b0c8);
  color: #fff;
  border-color: #6890a8;
}
.px-btn-reset {
  background: rgba(90,72,106,0.6);
  color: ${C.uiText};
  font-size: 10px;
  padding: 8px 14px;
}

/* ═══════════ RESPONSIVE ═══════════ */
@media (max-width: 400px) {
  .px-timer-text { font-size: 12px; }
  .px-dialogue-text { font-size: 11px; }
  .px-btn { font-size: 11px; padding: 7px 16px; }
}
`;
