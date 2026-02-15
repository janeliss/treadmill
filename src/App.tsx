import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Toast {
  id: number;
  message: string;
  type: 'prompt' | 'unlock';
  visible: boolean;
}

interface Milestone {
  seconds: number;
  label: string;
  emoji: string;
  unlockMsg: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MILESTONES: Milestone[] = [
  { seconds: 300, label: '5m', emoji: '⚡', unlockMsg: 'Iron Will activated!' },
  { seconds: 600, label: '10m', emoji: '🔥', unlockMsg: 'Steel Endurance earned!' },
  { seconds: 1200, label: '20m', emoji: '💎', unlockMsg: 'Diamond Focus achieved!' },
];

const MAX_PATHWAY_SECONDS = 1500; // 25 min = full pathway

const PROMPTS: string[] = [
  "You're doing amazing — keep pushing!",
  'Breathe deep. You got this.',
  'Every step is progress.',
  'Your future self thanks you.',
  'Pain is temporary. Growth is permanent.',
  'Lock in. No distractions.',
  'Champions are built on days like this.',
  'Feel the burn — that is evolution.',
  "You didn't come this far to quit.",
  'One more minute. Then another.',
  'Discipline beats motivation. Always.',
  'This is where legends are forged.',
];

// ── Color Palette (inspired by inspo images) ────────────────────────────────
const C = {
  bgDeep: '#0f1b2e',
  bgCard: '#162033',
  bgCardLight: '#1c2b44',
  accent: '#ff6b6b',      // warm coral
  accentAlt: '#ffa94d',   // orange
  accentPink: '#f06595',  // pink
  accentBlue: '#4dabf7',  // sky blue
  accentGreen: '#51cf66',  // fresh green
  accentYellow: '#ffd43b', // sunny yellow
  text: '#f1f3f5',
  textDim: '#868e96',
  trackBg: '#1a2740',
  trackRoad: '#263a56',
  glow: 'rgba(255, 107, 107, 0.35)',
  glowBlue: 'rgba(77, 171, 247, 0.3)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [xp, setXp] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [triggeredMs, setTriggeredMs] = useState<Set<number>>(() => new Set());
  const [showStars, setShowStars] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);

  // ── Toast system ───────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, message, type, visible: true }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    }, 4000);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 4700);
  }, []);

  // ── Star burst effect ──────────────────────────────────────────────────────
  const triggerStars = useCallback(() => {
    setShowStars(true);
    setTimeout(() => setShowStars(false), 1200);
  }, []);

  // ── Prompt scheduler ───────────────────────────────────────────────────────
  const schedulePrompt = useCallback(() => {
    const ms = randInt(120, 300) * 1000;
    promptRef.current = setTimeout(() => {
      const msg = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      addToast(msg, 'prompt');
      setXp((p) => p + 25);
      schedulePrompt();
    }, ms);
  }, [addToast]);

  // ── Timer controls ─────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    timerRef.current = setInterval(() => {
      setSeconds((p) => p + 1);
      setXp((p) => p + 1);
    }, 1000);
    schedulePrompt();
  }, [running, schedulePrompt]);

  const stop = useCallback(() => {
    if (!running) return;
    setRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (promptRef.current) { clearTimeout(promptRef.current); promptRef.current = null; }
  }, [running]);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
    setXp(0);
    setToasts([]);
    setTriggeredMs(new Set());
  }, [stop]);

  // ── Milestone checker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    for (const ms of MILESTONES) {
      if (seconds >= ms.seconds && !triggeredMs.has(ms.seconds)) {
        setTriggeredMs((p) => new Set(p).add(ms.seconds));
        addToast(`${ms.emoji} ${ms.label.toUpperCase()} UNLOCKED — ${ms.unlockMsg}`, 'unlock');
        setXp((p) => p + 50);
        triggerStars();
      }
    }
  }, [seconds, running, triggeredMs, addToast, triggerStars]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptRef.current) clearTimeout(promptRef.current);
    };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const level = Math.floor(xp / 100) + 1;
  const progress = (xp % 100) / 100;
  const pathwayProgress = Math.min(seconds / MAX_PATHWAY_SECONDS, 1);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.root}>
      <style>{globalCSS}</style>

      {/* ── Decorative background stars ── */}
      <div style={styles.bgDecor}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-star"
            style={{
              left: `${8 + (i * 7.5) % 90}%`,
              top: `${5 + ((i * 17) % 60)}%`,
              animationDelay: `${i * 0.4}s`,
              fontSize: i % 3 === 0 ? 14 : i % 3 === 1 ? 10 : 8,
              opacity: 0.15 + (i % 4) * 0.08,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* ── Star burst on milestone ── */}
      {showStars && (
        <div style={styles.starBurst}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="burst-particle"
              style={{
                '--angle': `${i * 45}deg`,
                '--dist': `${60 + randInt(0, 40)}px`,
                background: [C.accent, C.accentAlt, C.accentPink, C.accentYellow][i % 4],
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.titleEmoji}>🏃</span>
          <h1 style={styles.title}>Treadmill Lock IN</h1>
        </div>
        <p style={styles.subtitle}>EVOLVE EVERY STEP</p>
      </div>

      {/* ── Timer Display ── */}
      <div style={styles.timerContainer}>
        <div style={{
          ...styles.timerRing,
          boxShadow: running
            ? `0 0 40px ${C.glow}, inset 0 0 30px rgba(255,107,107,0.08)`
            : `0 0 10px rgba(0,0,0,0.3)`,
          borderColor: running ? C.accent : '#2a3a55',
        }}>
          <div style={{
            ...styles.timerText,
            color: running ? C.text : C.textDim,
          }}>
            {fmt(seconds)}
          </div>
          <div style={styles.timerLabel}>
            {running ? 'RUNNING' : seconds > 0 ? 'PAUSED' : 'READY'}
          </div>

          {/* Animated ring SVG */}
          <svg style={styles.ringSvg} viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={running ? C.accent : '#2a3a55'}
              strokeWidth="2.5"
              strokeDasharray={`${339.3 * progress} ${339.3 * (1 - progress)}`}
              strokeDashoffset="84.8"
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s' }}
              opacity={0.7}
            />
          </svg>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={styles.controls}>
        {!running ? (
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            className="btn-press"
            onClick={start}
          >
            {seconds > 0 ? '▶ Resume' : '▶ Start'}
          </button>
        ) : (
          <button
            style={{ ...styles.btn, ...styles.btnStop }}
            className="btn-press"
            onClick={stop}
          >
            ■ Stop
          </button>
        )}
        {!running && seconds > 0 && (
          <button
            style={{ ...styles.btn, ...styles.btnReset }}
            className="btn-press"
            onClick={reset}
          >
            ↺ Reset
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── VIRTUAL PATHWAY ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={styles.pathwaySection}>
        <div style={styles.sectionLabel}>VIRTUAL PATHWAY</div>
        <div style={styles.pathwayContainer}>
          {/* Track background */}
          <div style={styles.pathwayTrack}>
            {/* Dashed center line */}
            <div style={styles.pathwayDashes} />

            {/* Filled road progress */}
            <div style={{
              ...styles.pathwayFill,
              width: `${pathwayProgress * 100}%`,
            }} />

            {/* Scenery dots along the path */}
            {[0.15, 0.35, 0.55, 0.75, 0.9].map((pos, i) => (
              <div
                key={`tree-${i}`}
                style={{
                  position: 'absolute',
                  left: `${pos * 100}%`,
                  top: i % 2 === 0 ? -16 : 'auto',
                  bottom: i % 2 === 0 ? 'auto' : -16,
                  fontSize: 13,
                  opacity: pathwayProgress >= pos ? 1 : 0.25,
                  transition: 'opacity 0.6s ease',
                  filter: pathwayProgress >= pos ? 'none' : 'grayscale(1)',
                }}
              >
                {['🌲', '🌸', '🏔️', '🌿', '🌅'][i]}
              </div>
            ))}

            {/* Milestone markers */}
            {MILESTONES.map((ms) => {
              const pos = ms.seconds / MAX_PATHWAY_SECONDS;
              const reached = triggeredMs.has(ms.seconds);
              return (
                <div key={ms.seconds} style={{
                  position: 'absolute',
                  left: `${pos * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                }}>
                  {/* Marker post */}
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: reached ? C.accentAlt : C.bgCardLight,
                    border: `2px solid ${reached ? C.accentYellow : '#3a4f6f'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    boxShadow: reached
                      ? `0 0 12px ${C.accentAlt}, 0 0 24px rgba(255,169,77,0.2)`
                      : 'none',
                    transition: 'all 0.5s ease',
                  }}>
                    {reached ? ms.emoji : '🔒'}
                  </div>
                  {/* Label underneath */}
                  <div style={{
                    position: 'absolute',
                    top: 34,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: reached ? C.accentAlt : C.textDim,
                    whiteSpace: 'nowrap',
                    transition: 'color 0.4s',
                  }}>
                    {ms.label}
                  </div>
                </div>
              );
            })}

            {/* ── CHARACTER / RUNNER INDICATOR ── */}
            <div style={{
              position: 'absolute',
              left: `${pathwayProgress * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              transition: 'left 0.9s ease',
            }}>
              {/* Glow under character */}
              <div style={{
                position: 'absolute',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: running
                  ? `radial-gradient(circle, ${C.glow} 0%, transparent 70%)`
                  : 'none',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: running ? 'charPulse 1.5s ease-in-out infinite' : 'none',
              }} />
              {/* Character circle */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentPink})`,
                border: '3px solid #fff',
                boxShadow: `0 0 16px ${C.glow}, 0 2px 8px rgba(0,0,0,0.4)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                position: 'relative',
                zIndex: 2,
              }}>
                🏃
              </div>
              {/* Distance label */}
              <div style={{
                position: 'absolute',
                top: -18,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 9,
                fontWeight: 700,
                color: C.accent,
                whiteSpace: 'nowrap',
                textShadow: `0 0 8px ${C.glow}`,
              }}>
                {fmt(seconds)}
              </div>
            </div>

            {/* Start flag */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 16,
              zIndex: 2,
            }}>🚩</div>

            {/* End flag */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translate(50%, -50%)',
              fontSize: 16,
              zIndex: 2,
              opacity: 0.4,
            }}>🏁</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── LEVEL + XP CARD ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.sectionLabel}>EVOLUTION</div>
          <div style={styles.xpBadge}>+{xp % 100}/100 XP</div>
        </div>
        <div style={styles.levelRow}>
          <div style={styles.levelCircle}>
            <span style={styles.levelNum}>{level}</span>
            <span style={styles.levelLabel}>LVL</span>
          </div>
          <div style={styles.levelInfo}>
            <div style={styles.levelTitle}>
              {level < 3 ? 'Beginner Runner' : level < 6 ? 'Steady Pacer' : level < 10 ? 'Endurance Pro' : 'Ultra Legend'}
            </div>
            <div style={styles.levelSubtitle}>
              {100 - (xp % 100)} XP to next level
            </div>
            {/* Progress bar */}
            <div style={styles.barTrack}>
              <div style={{
                ...styles.barFill,
                width: `${progress * 100}%`,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── STATS ROW ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${C.accentBlue}` }}>
          <div style={styles.statEmoji}>⚡</div>
          <div style={styles.statValue}>{xp}</div>
          <div style={styles.statLabel}>Total XP</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${C.accentAlt}` }}>
          <div style={styles.statEmoji}>🏆</div>
          <div style={styles.statValue}>{triggeredMs.size}/{MILESTONES.length}</div>
          <div style={styles.statLabel}>Unlocks</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: `3px solid ${C.accentGreen}` }}>
          <div style={styles.statEmoji}>🎯</div>
          <div style={styles.statValue}>{level}</div>
          <div style={styles.statLabel}>Level</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TOASTS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={styles.toastContainer}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={t.visible ? 'toast-in' : 'toast-out'}
            style={{
              background: t.type === 'unlock'
                ? `linear-gradient(135deg, ${C.accentAlt}, ${C.accent})`
                : C.bgCard,
              color: '#fff',
              padding: '14px 18px',
              borderRadius: 16,
              border: t.type === 'unlock' ? 'none' : `1px solid ${C.accent}44`,
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center' as const,
              boxShadow: t.type === 'unlock'
                ? `0 8px 32px rgba(255,107,107,0.3)`
                : `0 4px 20px rgba(0,0,0,0.4)`,
              pointerEvents: 'auto' as const,
            }}
          >
            {t.type === 'unlock' && (
              <div style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.85, marginBottom: 3 }}>
                ★ MILESTONE UNLOCKED ★
              </div>
            )}
            {t.message}
            <div style={{ fontSize: 11, marginTop: 5, opacity: 0.7 }}>
              +{t.type === 'unlock' ? 50 : 25} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
    background: `linear-gradient(180deg, ${C.bgDeep} 0%, #0a1220 100%)`,
    color: C.text,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 16px 48px',
    boxSizing: 'border-box',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Background ──
  bgDecor: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },

  // ── Star burst ──
  starBurst: {
    position: 'fixed',
    top: '32%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    pointerEvents: 'none',
  },

  // ── Header ──
  header: {
    textAlign: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titleEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '0.06em',
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentAlt})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.35em',
    color: C.textDim,
    marginTop: 4,
  },

  // ── Timer ──
  timerContainer: {
    marginBottom: 20,
    zIndex: 1,
  },
  timerRing: {
    width: 160,
    height: 160,
    borderRadius: '50%',
    background: C.bgCard,
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'box-shadow 0.5s, border-color 0.5s',
  },
  timerText: {
    fontSize: 40,
    fontWeight: 200,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.04em',
    transition: 'color 0.4s',
    zIndex: 2,
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.25em',
    color: C.textDim,
    marginTop: 2,
    zIndex: 2,
  },
  ringSvg: {
    position: 'absolute',
    inset: 4,
    width: 'calc(100% - 8px)',
    height: 'calc(100% - 8px)',
    transform: 'rotate(-90deg)',
    zIndex: 1,
  },

  // ── Controls ──
  controls: {
    display: 'flex',
    gap: 10,
    marginBottom: 28,
    zIndex: 1,
  },
  btn: {
    padding: '11px 28px',
    border: 'none',
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  btnPrimary: {
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentPink})`,
    color: '#fff',
    boxShadow: `0 4px 20px ${C.glow}`,
  },
  btnStop: {
    background: 'transparent',
    color: C.accent,
    border: `2px solid ${C.accent}`,
  },
  btnReset: {
    background: 'transparent',
    color: C.textDim,
    border: '2px solid #2a3a55',
  },

  // ── Pathway section ──
  pathwaySection: {
    width: '100%',
    maxWidth: 380,
    marginBottom: 24,
    zIndex: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: C.textDim,
    marginBottom: 12,
  },
  pathwayContainer: {
    background: C.bgCard,
    borderRadius: 20,
    padding: '32px 24px 40px',
    border: '1px solid #1e3050',
  },
  pathwayTrack: {
    position: 'relative',
    height: 14,
    borderRadius: 7,
    background: C.trackBg,
    border: '1px solid #253550',
    overflow: 'visible',
  },
  pathwayDashes: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: 2,
    transform: 'translateY(-50%)',
    backgroundImage: `repeating-linear-gradient(90deg, #2a3f5c 0px, #2a3f5c 8px, transparent 8px, transparent 16px)`,
    opacity: 0.5,
  },
  pathwayFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 7,
    background: `linear-gradient(90deg, ${C.accentGreen}, ${C.accentBlue}, ${C.accentPink})`,
    boxShadow: `0 0 12px ${C.glowBlue}`,
    transition: 'width 0.9s ease',
    zIndex: 1,
  },

  // ── Level card ──
  card: {
    background: C.bgCard,
    borderRadius: 20,
    padding: '20px 22px',
    width: '100%',
    maxWidth: 380,
    marginBottom: 16,
    border: '1px solid #1e3050',
    zIndex: 1,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  xpBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: C.accentAlt,
    background: 'rgba(255,169,77,0.1)',
    padding: '3px 10px',
    borderRadius: 20,
    border: '1px solid rgba(255,169,77,0.2)',
  },
  levelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  levelCircle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentPink})`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 16px ${C.glow}`,
    flexShrink: 0,
  },
  levelNum: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1,
  },
  levelLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: '0.1em',
  },
  levelInfo: {
    flex: 1,
    minWidth: 0,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: C.text,
    marginBottom: 2,
  },
  levelSubtitle: {
    fontSize: 11,
    color: C.textDim,
    marginBottom: 10,
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    background: C.trackBg,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    background: `linear-gradient(90deg, ${C.accent}, ${C.accentAlt})`,
    boxShadow: `0 0 10px ${C.glow}`,
    transition: 'width 0.5s ease',
  },

  // ── Stats ──
  statsRow: {
    display: 'flex',
    gap: 10,
    width: '100%',
    maxWidth: 380,
    zIndex: 1,
  },
  statCard: {
    flex: 1,
    background: C.bgCard,
    borderRadius: 16,
    padding: '16px 10px 14px',
    border: '1px solid #1e3050',
    textAlign: 'center',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    color: C.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: C.textDim,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },

  // ── Toasts ──
  toastContainer: {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '90%',
    maxWidth: 360,
    pointerEvents: 'none',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL CSS (keyframes + utility classes)
// ═══════════════════════════════════════════════════════════════════════════════

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${C.bgDeep}; overflow-x: hidden; }

  .bg-star {
    position: absolute;
    color: ${C.accentYellow};
    animation: twinkle 3s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(1.3); }
  }

  @keyframes charPulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.2; }
  }

  .burst-particle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: burstOut 0.8s ease-out forwards;
  }

  @keyframes burstOut {
    0% { transform: rotate(var(--angle)) translateX(0); opacity: 1; }
    100% { transform: rotate(var(--angle)) translateX(var(--dist)); opacity: 0; }
  }

  .toast-in {
    animation: slideInToast 0.35s ease forwards;
  }
  .toast-out {
    animation: slideOutToast 0.5s ease forwards;
  }

  @keyframes slideInToast {
    from { transform: translateY(-24px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOutToast {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-24px); opacity: 0; }
  }

  .btn-press:active {
    transform: scale(0.95) !important;
  }
`;
