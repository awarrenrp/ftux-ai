import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, shadows, radii } from '../lib/tokens';
import { springs, staggerContainer, staggerItem, ease } from '../lib/animations';

interface ChatDemoPanelProps {
  active: boolean;
}

// ─── Sequence timing (ms) ────────────────────────────────────────────────────
const T = {
  startDelay:    600,   // pause before typing begins
  charInterval:  48,    // ms per character typed
  sendDelay:     420,   // pause after typing before send
  thinkingMs:    1800,  // duration of thinking dots
  lineDelay:     260,   // ms between streamed response lines
  followUpDelay: 700,   // pause before follow-up suggestions appear
};

const PROMPT_1 = "Help me understand my benefits";

const RESPONSE_LINES = [
  { type: 'heading',  text: 'Benefits Overview' },
  { type: 'subhead',  text: 'Employee + Family (spouse + 2) — San Bernardino, CA' },
  { type: 'body',     text: 'Your employer offers family-tier medical coverage in the San Bernardino / Inland Empire market.' },
  { type: 'label',    text: 'Common carrier options:' },
  { type: 'bullet',   text: 'Kaiser Permanente — HMO; typically the lowest-premium option' },
  { type: 'bullet',   text: 'Blue Shield of California / Anthem Blue Cross — PPO and HMO; broader provider flexibility' },
  { type: 'bullet',   text: 'Health Net — HMO option common in Southern California' },
];

const FOLLOW_UPS = [
  "How much does my health insurance cost per month?",
  "What's my out-of-pocket maximum this year?",
];

type Phase =
  | 'idle'
  | 'typing'
  | 'typed'
  | 'sending'
  | 'thinking'
  | 'streaming'
  | 'done';

export function ChatDemoPanel({ active }: ChatDemoPanelProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [inputText, setInputText] = useState('');
  const [visibleLines, setVisibleLines] = useState(0);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [sentPrompt, setSentPrompt] = useState('');

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }

  useEffect(() => {
    if (!active) {
      clearTimers();
      setPhase('idle');
      setInputText('');
      setVisibleLines(0);
      setShowFollowUps(false);
      setSentPrompt('');
      return;
    }

    // ── Step 1: start typing after initial delay ──────────────────────────────
    after(T.startDelay, () => {
      setPhase('typing');
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setInputText(PROMPT_1.slice(0, i));
        if (i >= PROMPT_1.length) {
          clearInterval(interval);
          after(T.sendDelay, () => {
            setPhase('typed');
            after(300, () => {
              // ── Step 2: send ─────────────────────────────────────────────────
              setSentPrompt(PROMPT_1);
              setInputText('');
              setPhase('sending');
              after(200, () => {
                setPhase('thinking');
                // ── Step 3: stream response ──────────────────────────────────
                after(T.thinkingMs, () => {
                  setPhase('streaming');
                  RESPONSE_LINES.forEach((_, idx) => {
                    after(T.thinkingMs + idx * T.lineDelay, () => {
                      setVisibleLines(idx + 1);
                    });
                  });
                  // ── Step 4: follow-ups ───────────────────────────────────────
                  after(
                    T.thinkingMs + RESPONSE_LINES.length * T.lineDelay + T.followUpDelay,
                    () => {
                      setPhase('done');
                      setShowFollowUps(true);
                    }
                  );
                });
              });
            });
          });
        }
      }, T.charInterval);
      timers.current.push(interval as unknown as ReturnType<typeof setTimeout>);
    });

    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const showConversation = ['sending', 'thinking', 'streaming', 'done'].includes(phase);
  const showThinking     = phase === 'thinking';
  const isTyping         = phase === 'typing' || phase === 'typed';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: colors.white,
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 14px',
        borderBottom: `1px solid ${colors.gray150}`,
        flexShrink: 0,
      }}>
        <button style={iconBtn}><SidebarIcon /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={iconBtn}><PlusSquareIcon /></button>
          <button style={iconBtn}><ExpandIcon /></button>
          <button style={iconBtn}>✕</button>
        </div>
      </div>

      {/* Conversation body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {/* ── Idle placeholder ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, paddingTop: 40 }}
            >
              <img src="/rippling-ai-icon.png" alt="Rippling AI" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.gray700 }}>Rippling AI</p>
              <p style={{ fontSize: 13, color: colors.gray400, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
                Ask anything about your team, benefits, payroll, and more.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Live conversation ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {showConversation && (
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* User bubble */}
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={springs.snappy}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
              >
                <div style={{
                  maxWidth: '76%',
                  padding: '10px 14px',
                  background: colors.gray100,
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: 13.5,
                  color: colors.gray900,
                  lineHeight: 1.5,
                }}>
                  {sentPrompt}
                </div>
              </motion.div>

              {/* Thinking dots */}
              <AnimatePresence>
                {showThinking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ThinkingDots />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Streamed response */}
              <AnimatePresence>
                {visibleLines > 0 && (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                  >
                    {/* "Thinking Completed" label */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke={colors.gray400} strokeWidth="1.5"/>
                        <path d="M7 4.5V7L8.5 8.5" stroke={colors.gray400} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: 12.5, color: colors.gray500 }}>Thinking Completed</span>
                      <span style={{ fontSize: 10, color: colors.gray400 }}>▾</span>
                    </motion.div>

                    {RESPONSE_LINES.slice(0, visibleLines).map((line, i) => (
                      <ResponseLine key={i} line={line} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Follow-up suggestions */}
              <AnimatePresence>
                {showFollowUps && (
                  <motion.div
                    key="followups"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: ease.out }}
                  >
                    <p style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.gray400,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 8,
                      marginTop: 8,
                    }}>
                      Ask a follow-up
                    </p>
                    <motion.div
                      variants={staggerContainer(0.1, 0)}
                      initial="hidden"
                      animate="visible"
                      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                    >
                      {FOLLOW_UPS.map((prompt, i) => (
                        <motion.button
                          key={prompt}
                          variants={staggerItem}
                          whileHover={{
                            backgroundColor: colors.primaryLight,
                            borderColor: colors.primary + '50',
                            color: colors.primaryDark,
                            x: 2,
                          }}
                          whileTap={{ scale: 0.98 }}
                          initial={i === 0 ? { opacity: 0, x: 0 } : undefined}
                          animate={i === 0 ? {
                            opacity: [0, 1, 1, 1, 1],
                            boxShadow: [
                              'none',
                              `0 0 0 2px ${colors.primaryLight}`,
                              `0 0 0 3px ${colors.primaryMid}`,
                              `0 0 0 2px ${colors.primaryLight}`,
                              'none',
                            ],
                            transition: { delay: 0.3, duration: 1.4, times: [0, 0.2, 0.5, 0.8, 1] },
                          } : undefined}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '9px 12px',
                            background: colors.white,
                            border: `1px solid ${colors.gray200}`,
                            borderRadius: radii.md,
                            fontSize: 13,
                            color: colors.gray700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            lineHeight: 1.4,
                          }}
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trial banner */}
      <div style={{
        padding: '7px 14px',
        background: colors.gray50,
        borderTop: `1px solid ${colors.gray150}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: colors.gray500 }}>
          You have <strong>14 days left</strong> on your trial
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary, cursor: 'pointer' }}>
          Purchase
        </span>
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px 6px', borderTop: `1px solid ${colors.gray150}`, flexShrink: 0 }}>
        <motion.div
          animate={{
            borderColor: isTyping ? colors.primary : colors.gray200,
            boxShadow: isTyping ? `0 0 0 3px ${colors.primaryLight}` : 'none',
          }}
          transition={{ duration: 0.25 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            border: `1.5px solid ${colors.gray200}`,
            borderRadius: radii.lg,
            padding: '6px 8px',
            gap: 8,
            background: colors.white,
          }}
        >
          <button style={{ ...iconBtn, color: colors.gray400, flexShrink: 0, fontSize: 16 }}>+</button>

          {/* Input text with blinking cursor */}
          <div style={{ flex: 1, fontSize: 13.5, color: colors.gray700, minWidth: 0, display: 'flex', alignItems: 'center' }}>
            {inputText || (
              <span style={{ color: colors.gray400 }}>Ask, make, or search anything…</span>
            )}
            {(isTyping || phase === 'idle') && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                style={{
                  display: 'inline-block',
                  width: 1.5,
                  height: 15,
                  background: colors.primary,
                  marginLeft: 1,
                  verticalAlign: 'middle',
                  borderRadius: 1,
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px',
              border: `1px solid ${colors.gray200}`,
              borderRadius: radii.sm,
              fontSize: 12, color: colors.gray600, cursor: 'pointer',
            }}>
              Fast <span style={{ fontSize: 10 }}>▾</span>
            </div>
            <motion.button
              animate={phase === 'typed' ? {
                scale: [1, 1.12, 1.08],
                boxShadow: [`0 4px 12px ${colors.primaryGlow}`, `0 6px 20px ${colors.primaryGlow}`, `0 4px 12px ${colors.primaryGlow}`],
              } : {}}
              transition={{ duration: 0.4, ease: ease.out }}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: colors.primary,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.primary,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>
        </motion.div>

        <p style={{ fontSize: 10.5, color: colors.gray400, textAlign: 'center', marginTop: 6, paddingBottom: 2 }}>
          Rippling AI results may be inaccurate. Review before acting.
        </p>
      </div>
    </div>
  );
}

// ─── Animated thinking dots ───────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: colors.gray50, borderRadius: '16px 16px 16px 4px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: colors.gray400 }}
        />
      ))}
    </div>
  );
}

// ─── Streamed response line ───────────────────────────────────────────────────

function ResponseLine({ line, index }: { line: { type: string; text: string }; index: number }) {
  const styleMap: Record<string, React.CSSProperties> = {
    heading: { fontSize: 14, fontWeight: 700, color: colors.gray900, marginTop: index > 0 ? 4 : 0 },
    subhead:  { fontSize: 13, fontWeight: 600, color: colors.gray700 },
    body:     { fontSize: 13, color: colors.gray600, lineHeight: 1.6 },
    label:    { fontSize: 13, fontWeight: 600, color: colors.gray700, marginTop: 4 },
    bullet:   { fontSize: 12.5, color: colors.gray600, lineHeight: 1.55, paddingLeft: 8, display: 'flex', alignItems: 'flex-start', gap: 5 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.out }}
      style={styleMap[line.type] ?? {}}
    >
      {line.type === 'bullet' ? (
        <><span style={{ color: colors.gray400 }}>·</span>{line.text}</>
      ) : (
        line.text
      )}
    </motion.div>
  );
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
  color: colors.gray400, fontSize: 14,
};

function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="5.5" y1="2" x2="5.5" y2="14" stroke="currentColor" strokeWidth="1.25"/>
    </svg>
  );
}
function PlusSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}
function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 2h4v4M6 14H2v-4M14 2l-5 5M2 14l5-5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
