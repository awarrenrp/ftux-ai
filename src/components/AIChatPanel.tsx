import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { colors, shadows, radii } from '../lib/tokens';
import { staggerContainer, staggerItem, springs, ease } from '../lib/animations';
import { PromptCardStack } from './ftux/WelcomeModal';
import type { PromptCard } from './ftux/WelcomeModal';

interface AIChatPanelProps {
  showSuggestions?: boolean;
  highlightInput?: boolean;
  /** When provided, activates demo mode: empty state + pills + live conversation on select */
  ftuxPrompts?: string[];
  /** When provided, immediately fires a conversation with this prompt (no pills) */
  autoFirePrompt?: string;
  /** When provided, shows prompt chips inline above the input bar (post-FTUX copilot mode) */
  inputSuggestions?: string[];
  /** Forces demo idle state — waiting for an external card selection (e.g. splash follow-up) */
  demoIdle?: boolean;
  /** Framer-style stacked prompt cards rendered above the input bar */
  ftuxCards?: PromptCard[];
  /** Expands to full-screen centered layout (600px content width) */
  fullScreen?: boolean;
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
    { type: 'heading', text: "Here's what Rippling AI can do" },
    { type: 'bullet',  text: 'Answer questions about your HR, payroll, benefits, and IT data — in plain English' },
    { type: 'bullet',  text: 'Create charts and visualizations to help you tell your story' },
    { type: 'bullet',  text: 'Use the @ command to reference specific people, requisitions, or other objects' },
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
  // ── Try me prompts ──
  "What would it cost me to visit the doctor": [
    { type: 'heading', text: 'Your Out-of-Pocket Cost to See a Doctor' },
    { type: 'subhead', text: 'Blue Shield of CA · PPO Gold' },
    { type: 'bullet',  text: 'Primary care visit: $30 copay (deductible met)' },
    { type: 'bullet',  text: 'Specialist visit: $60 copay' },
    { type: 'bullet',  text: 'Urgent care: $75 copay' },
    { type: 'note',    text: 'You\'ve met $340 of your $1,200 individual deductible this year.' },
  ],
  "Take me to my employee handbook": [
    { type: 'heading', text: 'Employee Handbook' },
    { type: 'body',    text: 'Here\'s a quick link to your handbook on file:' },
    { type: 'bullet',  text: 'Rippling Employee Handbook — v2.4 · Updated Jan 2026 · view →' },
    { type: 'note',    text: 'You can also find this under Documents in your Rippling profile.' },
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

export function AIChatPanel({ showSuggestions = true, highlightInput = false, ftuxPrompts, autoFirePrompt, inputSuggestions, demoIdle, ftuxCards, fullScreen }: AIChatPanelProps) {
  const demoMode = !!ftuxPrompts || !!autoFirePrompt || !!inputSuggestions || !!demoIdle || !!ftuxCards;

  // Pill state — track individually so clicking one prompt keeps the others visible
  const [dismissedPills, setDismissedPills] = useState<Set<number>>(new Set());
  const activePillCount = (ftuxPrompts?.length ?? 0) - dismissedPills.size;
  const showPills = !!ftuxPrompts && activePillCount > 0 && !autoFirePrompt && !inputSuggestions;


  // Copilot suggestion chips (post-splash): individually dismissable + global dismiss
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [suggestionsHidden, setSuggestionsHidden] = useState(false);
  const visibleSuggestions = (inputSuggestions ?? []).filter((s) => !dismissedSuggestions.has(s));
  const showSuggestionChips = !!inputSuggestions && !suggestionsHidden && visibleSuggestions.length > 0;

  // Card stack state
  const [cardsDismissed, setCardsDismissed] = useState(false);
  const [triedCardIds, setTriedCardIds] = useState<Set<string>>(new Set());
  const remainingCards = (ftuxCards ?? []).filter(c => !triedCardIds.has(c.id));
  const showCardStack = !!ftuxCards && ftuxCards.length > 0 && !cardsDismissed && remainingCards.length > 0;

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
    after(280, () => {
      setDismissedPills(prev => new Set([...prev, i]));
      clearTimers();
      startConversation(text, 1400);
    });
  }

  function resetConversation() {
    clearTimers();
    setConvPrompt(null);
    setConvPhase('idle');
    setVisibleLines(0);
    setDismissedPills(new Set());
    setTriedCardIds(new Set());
    setCardsDismissed(false);
  }

  // Derived display values — prevent a one-frame idle flash when autoFirePrompt first lands.
  const displayPhase: ConvPhase = autoFirePrompt && convPhase === 'idle' ? 'thinking' : convPhase;
  const displayPrompt: string | null = convPrompt ?? autoFirePrompt ?? null;

  const responseLines = displayPrompt ? (RESPONSES[displayPrompt] ?? []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: colors.white, fontFamily: 'inherit' }}>

      {/* Header */}
      <div id="chat-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: fullScreen ? '14px 24px' : '11px 14px',
        borderBottom: `1px solid ${colors.gray150}`, flexShrink: 0,
      }}>
        <button style={{ ...iconBtn, color: colors.gray400 }}><SidebarIcon /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ ...iconBtn, color: colors.gray400 }}><PlusSquareIcon /></button>
          <button style={{ ...iconBtn, color: colors.gray400 }}><ExpandIcon /></button>
          <motion.button
            onClick={demoMode ? resetConversation : undefined}
            whileHover={demoMode ? { backgroundColor: colors.gray150, color: colors.gray900 } : {}}
            whileTap={demoMode ? { scale: 0.92 } : {}}
            style={{
              ...iconBtn,
              borderRadius: 6,
              color: demoMode ? colors.gray600 : colors.gray400,
              cursor: demoMode ? 'pointer' : 'default',
            }}
          >✕</motion.button>
        </div>
      </div>

      {/* Conversation area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: fullScreen ? '32px 0 0' : '14px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: fullScreen ? 'center' : 'stretch' }}>

        {/* ── Demo mode ── */}
        <AnimatePresence mode="wait">
          {demoMode && displayPhase === 'idle' && (
            <motion.div
              key="demo-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                paddingBottom: fullScreen ? 0 : 8,
                width: '100%',
                ...(fullScreen ? { maxWidth: 600 } : {}),
              }}
            >
              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: ease.out }}
                style={{ marginBottom: 20 }}
              >
                {/* Animated AI icon */}
                <motion.div
                  animate={{ boxShadow: ['0 0 0px rgba(122,0,93,0)', '0 0 18px rgba(122,0,93,0.25)', '0 0 0px rgba(122,0,93,0)'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 12, display: 'inline-block' }}
                >
                  <img src="/rippling-ai-icon.png" alt="Rippling AI" style={{ width: 32, height: 32, borderRadius: 8, display: 'block' }} />
                </motion.div>
                <p style={{ fontSize: 22, fontWeight: 500, color: colors.gray900, lineHeight: 1.2, marginBottom: 4 }}>Hi there,</p>
                <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', lineHeight: 1.45 }}>What do you need help with?</p>
              </motion.div>

            </motion.div>
          )}

          {demoMode && displayPhase !== 'idle' && (
            <motion.div
              key="demo-conv"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 14,
                width: '100%',
                ...(fullScreen ? { maxWidth: 600 } : {}),
              }}
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


      {/* ── FTUX prompt card stack ────────────────────────────────────────── */}
      <AnimatePresence>
        {showPills && (
          <motion.div
            key="ftux-stack"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.22, ease: ease.in } }}
            transition={{ duration: 0.28, ease: ease.out }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{ padding: '10px 12px 14px', borderTop: `1px solid ${colors.gray150}`, background: colors.gray50 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>
                Try asking
              </span>
              <CopilotPromptStack
                prompts={ftuxPrompts ?? []}
                dismissedIndices={dismissedPills}
                onSelect={(prompt, i) => handlePillClick(prompt, i)}
                onDismiss={(i) => setDismissedPills((prev) => new Set([...prev, i]))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Examples / Card stack (above composer) ── */}
      <AnimatePresence>
        {showCardStack && (
          <motion.div
            key="ftux-card-stack"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: ease.out }}
            style={{
              flexShrink: 0, position: 'relative',
              padding: fullScreen ? '0 0 20px' : '16px 14px 4px',
              ...(fullScreen ? { display: 'flex', justifyContent: 'center' } : {}),
            }}
          >
            {fullScreen ? (
              <div style={{ width: '100%', maxWidth: 600 }}>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>
                  Get started by asking your first question to Rippling AI
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {remainingCards.map((card) => {
                    const label = card.segments.map(s => s.text).join('');
                    const prompt = card.prompt ?? label;
                    return (
                      <motion.button
                        key={card.id}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setTriedCardIds(prev => new Set([...prev, card.id]));
                          clearTimers();
                          startConversation(prompt, 1400);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '5px 0', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 15, color: colors.primary, flexShrink: 0 }}>↳</span>
                        <span style={{ fontSize: 14, color: colors.gray900 }}>{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  Try an example
                </p>
                <PromptCardStack
                  prompts={remainingCards}
                  onDismiss={() => setCardsDismissed(true)}
                  onSelect={(text) => {
                    const card = remainingCards.find(c => (c.prompt ?? c.segments.map(s => s.text).join('')) === text);
                    if (card) setTriedCardIds(prev => new Set([...prev, card.id]));
                    clearTimers();
                    startConversation(text, 1400);
                  }}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div style={{ padding: fullScreen ? '0 0 70px' : '8px 12px 6px', flexShrink: 0, ...(fullScreen ? { display: 'flex', justifyContent: 'center' } : {}) }}>
        <div style={fullScreen ? { width: '100%', maxWidth: 600 } : {}}>
        <motion.div
          id="prompt-input"
          animate={displayPhase === 'done' ? {
            borderColor: colors.primary,
            boxShadow: `0 0 0 3px ${colors.primaryLight}`,
            transition: { duration: 0.4, delay: 0.2 },
          } : {}}
          style={{
            background: colors.white,
            border: `1px solid ${highlightInput ? colors.primary : 'rgba(0,0,0,0.18)'}`,
            borderRadius: 8,
            padding: 8,
            boxShadow: highlightInput ? `0 0 0 3px ${colors.primaryLight}` : 'none',
          }}
        >
          {/* Text input row */}
          <div style={{ padding: '4px 0 10px', minHeight: 20 }}>
            <span style={{ fontSize: 14, color: '#716F6C' }}>Ask, make, or search anything…</span>
          </div>
          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Attachment */}
            <button style={{ ...squareBtn, border: `1px solid ${colors.gray200}` }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L8 3C8.9 2.1 10.4 2.1 11.3 3C12.2 3.9 12.2 5.4 11.3 6.3L6.3 11.3C5.9 11.7 5.2 11.7 4.8 11.3C4.4 10.9 4.4 10.2 4.8 9.8L9.3 5.3" stroke={colors.gray500} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* Model selector */}
            <button style={{
              height: 32, borderRadius: 6, padding: '0 10px',
              background: colors.white, border: `1px solid ${colors.gray200}`,
              display: 'flex', alignItems: 'center', gap: 5,
              cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: colors.gray700,
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L8 5H12L8.8 7.6L10 11.5L6.5 9L3 11.5L4.2 7.6L1 5H5L6.5 1Z" fill={colors.gray600}/>
              </svg>
              Fast
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2.5 4L5 6.5L7.5 4" stroke={colors.gray500} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{
                background: '#1E4AA9', color: 'white', borderRadius: 9999,
                padding: '1px 5px', fontSize: 10.5, fontWeight: 600, lineHeight: 1.3,
              }}>1</span>
            </button>
            {/* Spacer */}
            <div style={{ flex: 1 }} />
            {/* Mic */}
            <button style={{ ...squareBtn, border: `1px solid ${colors.gray200}` }}>
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <rect x="4" y="1" width="6" height="9" rx="3" stroke={colors.gray500} strokeWidth="1.25"/>
                <path d="M1 8C1 11.3 3.7 14 7 14C10.3 14 13 11.3 13 8" stroke={colors.gray500} strokeWidth="1.25" strokeLinecap="round"/>
                <line x1="7" y1="14" x2="7" y2="15.5" stroke={colors.gray500} strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Send */}
            <button style={{ ...squareBtn, background: 'rgba(0,0,0,0.05)', border: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="rgba(0,0,0,0.35)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </motion.div>
        <p style={{ fontSize: 10.5, color: colors.gray400, textAlign: 'center', marginTop: 6, paddingBottom: 2 }}>
          Rippling AI results may be inaccurate. Review before acting.
        </p>
        </div>{/* end 600px centering wrapper */}
      </div>

      {/* Copilot suggestion chips — below the input, individually dismissable */}
      <AnimatePresence>
        {showSuggestionChips && (
          <motion.div
            key="suggestion-chips"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            style={{
              borderTop: `1px solid ${colors.gray150}`,
              background: colors.gray50,
              padding: '8px 12px 10px',
              flexShrink: 0,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.gray400, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Try a prompt
              </span>
              <button
                onClick={() => setSuggestionsHidden(true)}
                aria-label="Dismiss suggestions"
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: colors.gray200, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colors.gray500, fontSize: 13, lineHeight: 1, flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            {/* Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <AnimatePresence>
                {visibleSuggestions.map((prompt) => (
                  <motion.button
                    key={prompt}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                    whileHover={{ background: colors.primaryLight, borderColor: `${colors.primary}50`, color: colors.primaryDark }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setDismissedSuggestions((prev) => new Set([...prev, prompt]));
                      clearTimers();
                      startConversation(prompt, 1400);
                    }}
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
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

// ─── Copilot prompt card stack ────────────────────────────────────────────────

function CopilotPromptStack({
  prompts,
  dismissedIndices,
  onSelect,
  onDismiss,
}: {
  prompts: string[];
  dismissedIndices: Set<number>;
  onSelect: (prompt: string, index: number) => void;
  onDismiss: (index: number) => void;
}) {
  const remaining = prompts
    .map((prompt, i) => ({ prompt, index: i }))
    .filter(({ index }) => !dismissedIndices.has(index));

  if (remaining.length === 0) return null;

  const visible = remaining.slice(0, 3);

  return (
    <div style={{ position: 'relative', width: '100%', height: 56, marginBottom: remaining.length > 1 ? 22 : 4 }}>
      <AnimatePresence>
        {[...visible].reverse().map(({ prompt, index }) => {
          const depth = visible.findIndex((v) => v.index === index);
          const isTop = depth === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.94, y: -5 }}
              animate={{
                opacity: 1 - depth * 0.2,
                scale: 1 - depth * 0.04,
                y: depth * 9,
                rotate: depth === 1 ? -1 : depth === 2 ? 0.8 : 0,
              }}
              exit={{ x: 220, rotate: 10, opacity: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.8, 1] } }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                position: 'absolute',
                left: 0, right: 0, top: 0,
                background: isTop ? colors.white : colors.gray50,
                border: `1px solid ${isTop ? colors.gray200 : colors.gray150}`,
                borderRadius: radii.md,
                padding: '9px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                pointerEvents: isTop ? 'auto' : 'none',
                cursor: isTop ? 'pointer' : 'default',
                zIndex: 3 - depth,
                boxShadow: isTop ? shadows.sm : 'none',
              }}
              onClick={isTop ? () => onSelect(prompt, index) : undefined}
            >
              <span style={{ fontSize: 10, color: colors.primary, opacity: 0.6, flexShrink: 0 }}>✦</span>
              <span style={{
                flex: 1,
                fontSize: 13,
                color: isTop ? colors.gray700 : colors.gray400,
                lineHeight: 1.35,
                fontWeight: 500,
              }}>
                {prompt}
              </span>
              {isTop && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  <motion.button
                    whileHover={{ backgroundColor: colors.gray200 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onDismiss(index); }}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: colors.gray100, border: 'none',
                      color: colors.gray400, fontSize: 9, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</motion.button>
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={(e) => { e.stopPropagation(); onSelect(prompt, index); }}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: colors.primary, border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: shadows.primary, cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Dot pager */}
      {remaining.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 3,
          alignItems: 'center',
        }}>
          {remaining.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? 14 : 4,
                height: 3,
                borderRadius: 999,
                background: i === 0 ? colors.primary : colors.gray300,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
  color: colors.gray400, fontSize: 14,
};

const squareBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 6,
  background: colors.white, border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
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
