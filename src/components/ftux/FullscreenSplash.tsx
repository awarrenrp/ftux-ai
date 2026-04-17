import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { colors, shadows, radii } from '../../lib/tokens';
import {
  backdropVariants,
  wordContainer,
  wordItem,
  springs,
  buttonTap,
  ease,
} from '../../lib/animations';

interface FullscreenSplashProps {
  onComplete: () => void;
  onGetStarted?: (remainingPrompts: string[]) => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const promptBubbles = [
  { text: "How much will I pay to visit the doctor?", delay: 0.5, x: '-6%' },
  { text: "How much did I pay in taxes last year?",   delay: 0.9, x: '5%'  },
  { text: "Which team took the most PTO last year?",  delay: 1.3, x: '-3%' },
  { text: "How much will I pay to visit the doctor?", delay: 1.7, x: '8%'  },
  { text: "How much did I pay in taxes last year?",   delay: 2.1, x: '0%'  },
];

const headlineWords = ['Welcome', 'to', 'Rippling', 'AI'];

const samplePrompts = [
  { label: 'Visit the doctor?', full: 'How much will I pay to visit the doctor?' },
  { label: 'Taxes last year?',  full: 'How much did I pay in taxes last year?' },
  { label: 'PTO by team?',      full: 'Which team took the most PTO last year?' },
];

type ResponseLine = { type: string; text: string };

const chatResponses: Record<string, ResponseLine[]> = {
  'How much will I pay to visit the doctor?': [
    { type: 'heading', text: 'Doctor Visit Costs' },
    { type: 'body',    text: 'Based on your Kaiser Permanente HMO plan, primary care visits have a $20 copay once your deductible is met.' },
    { type: 'label',   text: 'Your 2025 coverage breakdown:' },
    { type: 'bullet',  text: 'Primary care copay — $20' },
    { type: 'bullet',  text: 'Specialist copay — $40' },
    { type: 'bullet',  text: 'Deductible remaining — $850 of $1,500' },
  ],
  'How much did I pay in taxes last year?': [
    { type: 'heading', text: '2025 Tax Summary' },
    { type: 'body',    text: 'Based on your W-2 and payroll records from last year:' },
    { type: 'bullet',  text: 'Federal income tax — $14,320' },
    { type: 'bullet',  text: 'California state tax — $4,108' },
    { type: 'bullet',  text: 'Social Security + Medicare — $5,890' },
    { type: 'bullet',  text: 'Total withheld — $24,318' },
  ],
  'Which team took the most PTO last year?': [
    { type: 'heading', text: 'PTO by Team — 2025' },
    { type: 'body',    text: 'Engineering led all departments in PTO usage last year.' },
    { type: 'bullet',  text: 'Engineering — 12.4 days avg' },
    { type: 'bullet',  text: 'Sales — 10.1 days avg' },
    { type: 'bullet',  text: 'Customer Success — 9.8 days avg' },
    { type: 'bullet',  text: 'Company average — 10.6 days' },
  ],
};

// ─── Timing (ms) ──────────────────────────────────────────────────────────────
const T = {
  thinkingMs: 1400,
  lineDelay:  220,
};

// ─── Component ────────────────────────────────────────────────────────────────

type ChatPhase = 'thinking' | 'streaming' | 'done';

export function FullscreenSplash({ onComplete, onGetStarted }: FullscreenSplashProps) {
  const [exiting, setExiting] = useState(false);

  // Chat state
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [chatPhase, setChatPhase] = useState<ChatPhase | null>(null);
  const [visibleLines, setVisibleLines] = useState(0);

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

  // Kick off the chat animation when a prompt is selected
  useEffect(() => {
    if (!selectedPrompt) return;
    clearTimers();

    const lines = chatResponses[selectedPrompt] ?? [];

    after(T.thinkingMs, () => {
      setChatPhase('streaming');
      lines.forEach((_, idx) => {
        after(T.thinkingMs + idx * T.lineDelay, () => {
          setVisibleLines(idx + 1);
          if (idx === lines.length - 1) {
            after(T.thinkingMs + lines.length * T.lineDelay + 300, () => {
              setChatPhase('done');
            });
          }
        });
      });
    });

    return clearTimers;
  }, [selectedPrompt]);

  function handlePromptClick(index: number) {
    setChatPhase('thinking');
    setVisibleLines(0);
    setSelectedPrompt(samplePrompts[index].full);
    setUsedIndices((prev) => prev.includes(index) ? prev : [...prev, index]);
  }

  const remainingPrompts = samplePrompts.filter((_, i) => !usedIndices.includes(i));

  function handleGetStarted() {
    setExiting(true);
    const remaining = remainingPrompts.map((p) => p.full);
    setTimeout(() => onGetStarted ? onGetStarted(remaining) : onComplete(), 550);
  }

  const responseLines = selectedPrompt ? (chatResponses[selectedPrompt] ?? []) : [];

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.5, ease: ease.in } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #1a0014 0%, #0f000b 40%, #0d0d14 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Radial glow behind content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: ease.out }}
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-50%)',
              width: 700,
              height: 500,
              background: `radial-gradient(ellipse, ${colors.primary}55 0%, ${colors.primaryDeep}22 45%, transparent 75%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Floating prompt bubbles — fade out in chat mode */}
          <motion.div
            animate={{ opacity: selectedPrompt ? 0 : 1 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {promptBubbles.map((bubble, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], y: [60, 0, -60, -120] }}
                transition={{
                  delay: bubble.delay,
                  duration: 4,
                  times: [0, 0.25, 0.7, 1],
                  ease: ease.out,
                  repeat: Infinity,
                  repeatDelay: promptBubbles.length * 0.3 + 1,
                }}
                style={{
                  position: 'absolute',
                  top: `${38 + i * 7}%`,
                  left: `calc(50% + ${bubble.x})`,
                  transform: 'translateX(-50%)',
                  padding: '10px 18px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: radii.full,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.75)',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {bubble.text}
              </motion.div>
            ))}
          </motion.div>

          {/* ── Main content: intro ↔ chat ─────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 620, padding: '0 32px' }}>
            <AnimatePresence mode="wait">
              {!selectedPrompt ? (
                /* ── Intro view ─────────────────────────────────────────────── */
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: ease.in } }}
                  transition={{ duration: 0.4, ease: ease.out }}
                  style={{ textAlign: 'center' }}
                >
                  {/* Logo */}
                  <motion.div
                    initial={{ opacity: 0, y: -16, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...springs.bouncy, delay: 0.1 }}
                    style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: colors.primary,
                        boxShadow: shadows.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <RipplingIcon />
                      </div>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.2px' }}>
                        Rippling AI
                      </span>
                    </div>
                  </motion.div>

                  {/* Headline — word by word */}
                  <motion.div
                    variants={wordContainer(0.07, 0.45)}
                    initial="hidden"
                    animate="visible"
                    style={{
                      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                      gap: '0 10px', marginBottom: 18,
                    }}
                  >
                    {headlineWords.map((word, i) => (
                      <motion.span
                        key={i}
                        variants={wordItem}
                        style={{
                          fontSize: 44,
                          fontWeight: 800,
                          letterSpacing: '-1.5px',
                          lineHeight: 1.2,
                          color: word === 'AI' ? colors.primaryMid : 'rgba(255,255,255,0.95)',
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.3, ease: ease.out }}
                    style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 44 }}
                  >
                    Ask anything about your team
                  </motion.p>

                  {/* Fake input bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...springs.gentle, delay: 1.55 }}
                    style={{ marginBottom: 20 }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: radii.xl,
                      padding: '12px 16px',
                      gap: 10,
                      backdropFilter: 'blur(12px)',
                    }}>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', flex: 1, textAlign: 'left' }}>
                        Ask, make, or search anything…
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={buttonTap}
                        onClick={handleGetStarted}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: colors.primary,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: shadows.primary,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Sample prompts row */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 1.8 } } }}
                    style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}
                  >
                    {samplePrompts.map((p, i) => (
                      <motion.button
                        key={p.label}
                        variants={{
                          hidden: { opacity: 0, scale: 0.85 },
                          visible: { opacity: 1, scale: 1, transition: springs.bouncy },
                        }}
                        whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.12)' }}
                        whileTap={buttonTap}
                        onClick={() => handlePromptClick(i)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: radii.full,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: 'rgba(255,255,255,0.65)',
                          fontSize: 13,
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {p.label}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>

              ) : (
                /* ── Chat view ──────────────────────────────────────────────── */
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: ease.in } }}
                  transition={{ duration: 0.4, ease: ease.out }}
                >
                  {/* Compact logo */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 28,
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: colors.primary,
                      boxShadow: shadows.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill="white" fillOpacity="0.85"/>
                        <path d="M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z" fill="white"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.2px' }}>
                      Rippling AI
                    </span>
                  </div>

                  {/* Chat thread */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 24,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}>
                    {/* User message bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={springs.snappy}
                      style={{ display: 'flex', justifyContent: 'flex-end' }}
                    >
                      <div style={{
                        maxWidth: '78%',
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.16)',
                        borderRadius: '18px 18px 4px 18px',
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 1.5,
                        backdropFilter: 'blur(10px)',
                      }}>
                        {selectedPrompt}
                      </div>
                    </motion.div>

                    {/* Thinking dots */}
                    <AnimatePresence>
                      {chatPhase === 'thinking' && (
                        <motion.div
                          key="thinking"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <DarkThinkingDots />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Streamed AI response */}
                    <AnimatePresence>
                      {visibleLines > 0 && (
                        <motion.div
                          key="response"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                        >
                          {/* Thinking completed label */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}
                          >
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                              <path d="M7 4.5V7L8.5 8.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Thinking Completed</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>▾</span>
                          </motion.div>

                          {responseLines.slice(0, visibleLines).map((line, i) => (
                            <DarkResponseLine key={i} line={line} index={i} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Remaining prompt chips */}
                  <AnimatePresence>
                    {chatPhase === 'done' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: ease.out }}
                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}
                      >
                        <p style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: 10,
                          textAlign: 'center',
                        }}>
                          Ask another question
                        </p>
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
                          style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}
                        >
                          {remainingPrompts.map((p) => {
                            const originalIndex = samplePrompts.findIndex((s) => s.label === p.label);
                            return (
                              <motion.button
                                key={p.label}
                                variants={{
                                  hidden: { opacity: 0, scale: 0.85 },
                                  visible: { opacity: 1, scale: 1, transition: springs.bouncy },
                                }}
                                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.12)' }}
                                whileTap={buttonTap}
                                onClick={() => handlePromptClick(originalIndex)}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: radii.full,
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: 'rgba(255,255,255,0.65)',
                                  fontSize: 13,
                                  cursor: 'pointer',
                                  backdropFilter: 'blur(8px)',
                                }}
                              >
                                {p.label}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dark-themed thinking dots ────────────────────────────────────────────────

function DarkThinkingDots() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '8px 14px',
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px 16px 16px 4px',
      backdropFilter: 'blur(8px)',
    }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}
        />
      ))}
    </div>
  );
}

// ─── Dark-themed response line ────────────────────────────────────────────────

function DarkResponseLine({ line, index }: { line: ResponseLine; index: number }) {
  const styleMap: Record<string, React.CSSProperties> = {
    heading: { fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: index > 0 ? 4 : 0 },
    subhead:  { fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' },
    body:     { fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 },
    label:    { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
    bullet:   { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, paddingLeft: 4, display: 'flex', alignItems: 'flex-start', gap: 6 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.out }}
      style={styleMap[line.type] ?? {}}
    >
      {line.type === 'bullet' ? (
        <><span style={{ color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>·</span>{line.text}</>
      ) : (
        line.text
      )}
    </motion.div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function RipplingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill="white" fillOpacity="0.85"/>
      <path d="M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z" fill="white"/>
    </svg>
  );
}
