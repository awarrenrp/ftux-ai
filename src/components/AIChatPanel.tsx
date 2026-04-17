import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { colors, shadows, radii } from '../lib/tokens';
import { staggerContainer, staggerItem, springs, buttonTap, ease } from '../lib/animations';

interface AIChatPanelProps {
  showSuggestions?: boolean;
  highlightInput?: boolean;
  /** When provided, activates demo mode: empty state + pills + live conversation on select */
  ftuxPrompts?: string[];
  /** When provided, immediately fires a conversation with this prompt (no pills) */
  autoFirePrompt?: string;
  /** When provided, shows prompt chips inline above the input bar (post-FTUX copilot mode) */
  inputSuggestions?: string[];
}

// ─── Response data ────────────────────────────────────────────────────────────

type LineType = 'heading' | 'subhead' | 'body' | 'bullet' | 'note' | 'total' | 'chart';
interface ChartBar { label: string; value: number; highlight?: boolean }
interface ResponseLine { type: LineType; text: string; bars?: ChartBar[] }

const PAYCHECK_BARS: ChartBar[] = [
  { label: 'Feb 2',  value: 4620 },
  { label: 'Feb 16', value: 4620 },
  { label: 'Mar 2',  value: 4620 },
  { label: 'Mar 16', value: 5210, highlight: true },
];

const RESPONSES: Record<string, ResponseLine[]> = {
  // ── Splash variant prompts ──
  "What can I do with Rippling AI?": [
    { type: 'heading', text: 'What Rippling AI can do' },
    { type: 'body',    text: 'Ask anything about your HR, Payroll, Benefits, and IT data — in plain English.' },
    { type: 'bullet',  text: 'Benefits — coverage, deductibles, costs, open enrollment' },
    { type: 'bullet',  text: 'Payroll — pay history, tax summaries, compensation trends' },
    { type: 'bullet',  text: 'People — PTO, headcount, org changes, onboarding status' },
    { type: 'bullet',  text: 'IT — device inventory, app access, software usage' },
    { type: 'note',    text: 'Tip: use @ to scope — e.g. @payroll or @benefits' },
  ],
  "Compare my last few paychecks": [
    { type: 'heading', text: 'Your Last 4 Paychecks' },
    { type: 'chart',   text: 'Net pay · biweekly', bars: PAYCHECK_BARS },
    { type: 'note',    text: 'Mar 16 reflects your merit raise (+12.8%) effective Mar 1.' },
  ],
  "Who hasn't taken PTO this year?": [
    { type: 'heading', text: '8 Employees with Zero PTO in 2025' },
    { type: 'subhead', text: 'As of today · all departments' },
    { type: 'bullet',  text: 'Engineering: Alex Chen, Ryan Park, Jordan Smith, Sam Lee' },
    { type: 'bullet',  text: 'Sales: Marcus Rivera, Priya Patel' },
    { type: 'bullet',  text: 'Operations: Jamie Torres, Casey Kim' },
    { type: 'note',    text: 'Policy: 15 days/year · unused days expire Dec 31.' },
  ],
  // ── Welcome variant prompts ──
  "Help me understand my benefits": [
    { type: 'heading', text: 'Your Benefits Summary' },
    { type: 'subhead', text: 'Blue Shield of CA · PPO Gold · Enrolled since Jan 2024' },
    { type: 'bullet',  text: 'Medical: $1,200 individual deductible · $340 met so far' },
    { type: 'bullet',  text: 'Dental: MetLife · $1,500 annual max · cleanings 100% covered' },
    { type: 'bullet',  text: 'Vision: VSP · frames + lenses every 12 months, $150 allowance' },
    { type: 'bullet',  text: '401(k): 4% employer match · vesting over 4 years' },
    { type: 'note',    text: 'Open enrollment ends Nov 15 · no changes needed unless circumstances change.' },
  ],
  "Who hasn't completed their onboarding checklist?": [
    { type: 'heading', text: '5 Employees with Incomplete Onboarding' },
    { type: 'subhead', text: 'As of today · sorted by start date' },
    { type: 'bullet',  text: 'Marcus Chen — Mar 12 · Missing: Direct deposit, Benefits election' },
    { type: 'bullet',  text: 'Priya Patel — Mar 15 · Missing: I-9 verification' },
    { type: 'bullet',  text: 'Jordan Lee — Mar 18 · Missing: Policy acknowledgments (3)' },
    { type: 'bullet',  text: 'Alex Rivera — Mar 20 · Missing: Equipment request' },
    { type: 'bullet',  text: 'Sam Torres — Mar 22 · Missing: All items (just started)' },
    { type: 'note',    text: 'Send reminder emails to all 5 employees?' },
  ],
  "@payroll What drove the engineering cost increase last month?": [
    { type: 'heading', text: 'Engineering Payroll — March vs. February' },
    { type: 'subhead', text: '+$42,300 · +11.4% month-over-month' },
    { type: 'body',    text: 'Three factors drove the increase:' },
    { type: 'bullet',  text: 'New hires (3) — first full payroll: +$24,000' },
    { type: 'bullet',  text: 'Platform team overtime (18 employees, 6+ hrs): +$11,200' },
    { type: 'bullet',  text: 'Equity refresh payouts — 4 vesting cliff completions: +$7,100' },
    { type: 'note',    text: 'April forecast: $398,000 (+2.0%) assuming no additional hires.' },
  ],
};

const suggestedPrompts = [
  "Help me understand my benefits",
  "Who hasn't completed onboarding?",
  "Summarize last month's payroll",
  "Draft a PIP for an underperformer",
];

// ─── Component ────────────────────────────────────────────────────────────────

type ConvPhase = 'idle' | 'thinking' | 'streaming' | 'done';

export function AIChatPanel({ showSuggestions = true, highlightInput = false, ftuxPrompts, autoFirePrompt, inputSuggestions }: AIChatPanelProps) {
  const demoMode = !!ftuxPrompts || !!autoFirePrompt || !!inputSuggestions;

  // Pill state — track individually so clicking one prompt keeps the others visible
  const [dismissedPills, setDismissedPills] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const activePillCount = (ftuxPrompts?.length ?? 0) - dismissedPills.size;
  const showPills = !!ftuxPrompts && activePillCount > 0 && !autoFirePrompt && !inputSuggestions;

  // Conversation state (demo mode only)
  const [convPrompt, setConvPrompt] = useState<string | null>(null);
  const [convPhase, setConvPhase] = useState<ConvPhase>('idle');
  const [visibleLines, setVisibleLines] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }
  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }

  useEffect(() => () => clearTimers(), []);

  // Schedule a conversation — all delays are from t=0 (call time), never nested.
  function startConversation(text: string, thinkingMs: number) {
    const lines = RESPONSES[text] ?? [];
    setConvPrompt(text);
    setConvPhase('thinking');
    setVisibleLines(0);
    after(thinkingMs, () => setConvPhase('streaming'));
    lines.forEach((_, idx) => {
      after(thinkingMs + (idx + 1) * 250, () => setVisibleLines(idx + 1));
    });
    after(thinkingMs + lines.length * 250 + 300, () => setConvPhase('done'));
  }

  // Auto-fire when autoFirePrompt is supplied (welcome variant)
  useEffect(() => {
    if (!autoFirePrompt) return;
    clearTimers();
    startConversation(autoFirePrompt, 1500);
  }, [autoFirePrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePillClick(text: string, i: number) {
    setCopiedIndex(i);
    after(280, () => {
      setDismissedPills(prev => new Set([...prev, i]));
      setCopiedIndex(null);
      clearTimers();
      startConversation(text, 1400);
    });
  }

  // Derived display values — prevent a one-frame idle flash when autoFirePrompt first lands.
  const displayPhase: ConvPhase = autoFirePrompt && convPhase === 'idle' ? 'thinking' : convPhase;
  const displayPrompt: string | null = convPrompt ?? autoFirePrompt ?? null;

  const responseLines = displayPrompt ? (RESPONSES[displayPrompt] ?? []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white, fontFamily: 'inherit' }}>

      {/* Header */}
      <div id="chat-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', borderBottom: `1px solid ${colors.gray150}`, flexShrink: 0,
      }}>
        <button style={{ ...iconBtn, color: colors.gray400 }}><SidebarIcon /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ ...iconBtn, color: colors.gray400 }}><PlusSquareIcon /></button>
          <button style={{ ...iconBtn, color: colors.gray400 }}><ExpandIcon /></button>
          <button style={{ ...iconBtn, color: colors.gray400 }}>✕</button>
        </div>
      </div>

      {/* Conversation area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Demo mode ── */}
        <AnimatePresence mode="wait">
          {demoMode && displayPhase === 'idle' && (
            <motion.div
              key="demo-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 48 }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadows.primary }}>
                <RipplingMark />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.gray700 }}>Rippling AI</p>
              <p style={{ fontSize: 13, color: colors.gray400, textAlign: 'center', maxWidth: 200, lineHeight: 1.55 }}>
                Select a prompt below to see what happens
              </p>
            </motion.div>
          )}

          {demoMode && displayPhase !== 'idle' && (
            <motion.div
              key="demo-conv"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* User bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={springs.snappy}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
              >
                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  background: colors.gray100,
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: 13.5,
                  color: colors.gray900,
                  lineHeight: 1.5,
                }}>
                  {displayPrompt}
                </div>
              </motion.div>

              {/* Thinking dots */}
              <AnimatePresence>
                {displayPhase === 'thinking' && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
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
                    {/* Thinking Completed label */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke={colors.gray400} strokeWidth="1.5"/>
                        <path d="M7 4.5V7L8.5 8.5" stroke={colors.gray400} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: 12.5, color: colors.gray500 }}>Thinking Completed</span>
                      <span style={{ fontSize: 10, color: colors.gray400 }}>▾</span>
                    </motion.div>

                    {responseLines.slice(0, visibleLines).map((line, i) => (
                      <StreamedLine key={i} line={line} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Standard mode (spotlight tour, etc.) ── */}
        {!demoMode && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div id="user-message" style={{
                maxWidth: '75%', padding: '10px 14px',
                background: colors.gray100, borderRadius: '18px 18px 4px 18px',
                fontSize: 14, color: colors.gray900, lineHeight: 1.5,
              }}>
                Help me understand my benefits
              </div>
            </div>

            <div id="thinking-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke={colors.gray400} strokeWidth="1.5"/>
                <path d="M7 4.5V7L8.5 8.5" stroke={colors.gray400} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, color: colors.gray500 }}>Thinking Completed</span>
              <span style={{ fontSize: 11, color: colors.gray400 }}>▾</span>
            </div>

            <div id="ai-response" style={{ fontSize: 13.5, color: colors.gray900, lineHeight: 1.7 }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Benefits Overview</p>
              <p style={{ fontWeight: 600, marginBottom: 8, color: colors.gray700 }}>Employee + Family (spouse + 2) — San Bernardino, CA</p>
              <p style={{ marginBottom: 10, color: colors.gray600 }}>Your employer offers family-tier medical coverage in the San Bernardino/Inland Empire market.</p>
              <p style={{ marginBottom: 6, color: colors.gray700, fontWeight: 500 }}>Common carrier options:</p>
              <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {['Kaiser Permanente — HMO; typically the lowest-premium option', 'Blue Shield of California / Anthem Blue Cross — PPO and HMO', 'Health Net — HMO option common in Southern California'].map((item) => (
                  <li key={item} style={{ fontSize: 13, color: colors.gray600, lineHeight: 1.55 }}>· {item}</li>
                ))}
              </ul>
            </div>

            {showSuggestions && (
              <motion.div
                id="suggested-prompts"
                variants={staggerContainer(0.08, 0.2)}
                initial="hidden"
                animate="visible"
                style={{ marginTop: 8 }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Try asking
                </p>
                {suggestedPrompts.map((prompt) => (
                  <motion.button
                    key={prompt}
                    variants={staggerItem}
                    whileHover={{ backgroundColor: colors.primaryLight, borderColor: colors.primary + '40', color: colors.primaryDark }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', marginBottom: 6,
                      background: colors.white, border: `1px solid ${colors.gray200}`,
                      borderRadius: radii.md, fontSize: 13, color: colors.gray700,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Trial banner */}
      <div style={{
        padding: '7px 14px', background: colors.gray50,
        borderTop: `1px solid ${colors.gray150}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: colors.gray500 }}>You have <strong>14 days left</strong> on your trial</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary, cursor: 'pointer' }}>Purchase</span>
      </div>

      {/* ── FTUX prompt pills ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPills && (
          <motion.div
            key="ftux-pills"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.22, ease: ease.in } }}
            transition={{ duration: 0.28, ease: ease.out }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{ padding: '10px 12px 8px', borderTop: `1px solid ${colors.gray150}`, background: colors.gray50 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Try asking
                </span>
                <motion.button
                  whileHover={{ backgroundColor: colors.gray200 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDismissedPills(new Set(ftuxPrompts?.map((_, i) => i) ?? []))}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: colors.gray200,
                    border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 10, color: colors.gray500,
                  }}
                >✕</motion.button>
              </div>

              <motion.div
                variants={staggerContainer(0.08, 0.05)}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
              >
                {(ftuxPrompts ?? []).map((prompt, i) => {
                  if (dismissedPills.has(i)) return null;
                  const isCopied = copiedIndex === i;
                  return (
                    <motion.button
                      key={prompt}
                      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: springs.gentle } }}
                      whileHover={{ backgroundColor: colors.primaryLight, borderColor: colors.primary + '50', x: 2 }}
                      whileTap={buttonTap}
                      onClick={() => handlePillClick(prompt, i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        textAlign: 'left', padding: '8px 11px', borderRadius: radii.md,
                        background: isCopied ? colors.primaryLight : colors.white,
                        border: `1px solid ${isCopied ? colors.primary + '40' : colors.gray200}`,
                        fontSize: 13, color: isCopied ? colors.primary : colors.gray700,
                        cursor: 'pointer', fontWeight: 500, lineHeight: 1.35,
                        boxShadow: shadows.sm, transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 10, color: colors.primary, opacity: 0.6, flexShrink: 0 }}>✦</span>
                      <span style={{ flex: 1 }}>{prompt}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div style={{ padding: '10px 12px 6px', borderTop: `1px solid ${colors.gray150}`, flexShrink: 0 }}>
        {/* Suggestion chips — shown in copilot mode when no conversation is active */}
        <AnimatePresence>
          {inputSuggestions && displayPhase === 'idle' && (
            <motion.div
              key="input-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}
            >
              {inputSuggestions.map((prompt) => (
                <motion.button
                  key={prompt}
                  whileHover={{ background: colors.primaryLight, borderColor: `${colors.primary}50`, color: colors.primaryDark }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { clearTimers(); startConversation(prompt, 1400); }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: radii.full,
                    background: colors.white,
                    border: `1px solid ${colors.gray200}`,
                    fontSize: 12,
                    color: colors.gray600,
                    cursor: 'pointer',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {prompt}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          id="prompt-input"
          animate={displayPhase === 'done' ? {
            borderColor: colors.primary,
            boxShadow: `0 0 0 3px ${colors.primaryLight}`,
            transition: { duration: 0.4, delay: 0.2 },
          } : {}}
          style={{
            display: 'flex', alignItems: 'center',
            border: `1.5px solid ${highlightInput ? colors.primary : colors.gray200}`,
            borderRadius: radii.lg, padding: '6px 8px', gap: 8,
            background: colors.white,
            boxShadow: highlightInput ? `0 0 0 3px ${colors.primaryLight}` : 'none',
          }}
        >
          <button style={{ ...iconBtn, color: colors.gray400, flexShrink: 0 }}>+</button>
          <span style={{ flex: 1, fontSize: 13.5, color: colors.gray400 }}>Ask, make, or search anything…</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              border: `1px solid ${colors.gray200}`, borderRadius: radii.sm,
              fontSize: 12, color: colors.gray600, cursor: 'pointer',
            }}>
              Fast <span style={{ fontSize: 10 }}>▾</span>
            </div>
            <button style={{
              width: 32, height: 32, borderRadius: '50%', background: colors.primary,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: shadows.primary,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </motion.div>
        <p style={{ fontSize: 10.5, color: colors.gray400, textAlign: 'center', marginTop: 6, paddingBottom: 2 }}>
          Rippling AI results may be inaccurate. Review before acting.
        </p>
      </div>
    </div>
  );
}

// ─── Thinking dots ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: colors.gray50, borderRadius: '16px 16px 16px 4px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.65, delay: i * 0.14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: colors.gray400 }}
        />
      ))}
    </div>
  );
}

// ─── Streamed response line ───────────────────────────────────────────────────

function StreamedLine({ line }: { line: ResponseLine }) {
  const styleMap: Record<LineType, React.CSSProperties> = {
    heading: { fontSize: 14,   fontWeight: 700, color: colors.gray900 },
    subhead:  { fontSize: 12.5, fontWeight: 600, color: colors.gray600 },
    body:     { fontSize: 13,   color: colors.gray600, lineHeight: 1.6 },
    bullet:   { fontSize: 13,   color: colors.gray600, lineHeight: 1.55, paddingLeft: 4 },
    note:     { fontSize: 12,   color: colors.gray400, lineHeight: 1.55, fontStyle: 'italic' },
    total:    { fontSize: 13.5, fontWeight: 700, color: colors.gray900, paddingTop: 4 },
    chart:    {},
  };

  if (line.type === 'chart') {
    const bars = line.bars ?? [];
    const max = Math.max(...bars.map(b => b.value));
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: ease.out }}>
        <p style={{ fontSize: 10.5, color: colors.gray400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {line.text}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80, marginBottom: 2 }}>
          {bars.map((bar) => (
            <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <span style={{ fontSize: 9.5, fontWeight: bar.highlight ? 700 : 500, color: bar.highlight ? colors.primary : colors.gray500 }}>
                ${(bar.value / 1000).toFixed(1)}k{bar.highlight ? ' ↑' : ''}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.round((bar.value / max) * 52)}px` }}
                transition={{ duration: 0.5, delay: 0.08, ease: ease.out }}
                style={{
                  width: '100%',
                  background: bar.highlight ? colors.primary : colors.gray200,
                  borderRadius: '3px 3px 0 0',
                }}
              />
              <span style={{ fontSize: 9, color: colors.gray400 }}>{bar.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: ease.out }}
      style={styleMap[line.type]}
    >
      {line.type === 'bullet' ? `· ${line.text}` : line.text}
    </motion.div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
  color: colors.gray400, fontSize: 14,
};

function RipplingMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill="white" fillOpacity="0.85"/>
      <path d="M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z" fill="white"/>
    </svg>
  );
}
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
