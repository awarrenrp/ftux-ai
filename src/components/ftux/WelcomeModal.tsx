import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { colors, shadows, radii } from '../../lib/tokens';
import { backdropVariants, scaleIn, springs, buttonTap, ease, staggerContainer, staggerItem } from '../../lib/animations';
// staggerContainer + staggerItem used in welcome modal feature list

interface WelcomeModalProps {
  onComplete: () => void;
  onPromptSelected?: (prompt: string) => void;
}

type Phase = 'modal' | 'prompts' | 'done';

// ─── Prompt data ──────────────────────────────────────────────────────────────

interface Segment { text: string; type: 'text' | 'command' }

interface PromptCard {
  id: string;
  segments: Segment[];
  caption: string;
  /** Optional override for the text sent to onSelect (defaults to joined segments) */
  prompt?: string;
  /** Optional visual illustration rendered at the top of the card */
  illustration?: ReactNode;
  /** Optional role/audience label badge */
  tag?: string;
}

const prompts: PromptCard[] = [
  {
    id: 'benefits',
    segments: [{ text: 'Help me understand my benefits', type: 'text' }],
    caption: 'Pulls your actual plan details — deductibles, carriers, coverage',
  },
  {
    id: 'onboarding',
    segments: [{ text: "Who hasn't completed their onboarding checklist?", type: 'text' }],
    caption: 'Queries your whole team and shows blockers at a glance',
  },
  {
    id: 'payroll',
    segments: [
      { text: '@payroll', type: 'command' },
      { text: ' What drove the engineering cost increase last month?', type: 'text' },
    ],
    caption: 'Use @ to scope your question to a specific Rippling module',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function WelcomeModal({ onComplete, onPromptSelected }: WelcomeModalProps) {
  const [phase, setPhase] = useState<Phase>('modal');
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(true);
  const measureRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== 'prompts') return;
    function measure() {
      const el = document.getElementById('prompt-input');
      if (el) setInputRect(el.getBoundingClientRect());
    }
    measureRef.current = setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => {
      if (measureRef.current) clearTimeout(measureRef.current);
      window.removeEventListener('resize', measure);
    };
  }, [phase]);

  function goToPrompts() { setPhase('prompts'); }

  function dismiss() {
    setPhase('done');
    setVisible(false);
    setTimeout(onComplete, 400);
  }

  function selectPromptAndFire(prompt: string) {
    // Fire the conversation but keep the card stack visible — only ✕ dismisses it.
    onPromptSelected?.(prompt);
  }

  // Cards panel sits directly above the input bar, right-aligned with it
  const cardPanelStyle: React.CSSProperties = inputRect
    ? {
        position: 'fixed',
        bottom: window.innerHeight - inputRect.top + 12,
        left: inputRect.left,
        width: inputRect.width,
        zIndex: 202,
      }
    : { position: 'fixed', bottom: 120, right: 24, width: 340, zIndex: 202 };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="welcome-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: phase === 'prompts'
                ? 'rgba(17,24,39,0.35)'
                : 'rgba(17,24,39,0.5)',
              backdropFilter: phase === 'prompts' ? 'blur(2px)' : 'blur(4px)',
              transition: 'background 0.4s, backdrop-filter 0.4s',
            }}
            onClick={phase === 'prompts' ? dismiss : undefined}
          />

          {/* ── Phase 1: Welcome modal ──────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {phase === 'modal' && (
              <motion.div
                key="welcome-modal"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.25, ease: ease.in } }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 201,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{
                  width: '100%',
                  maxWidth: 480,
                  margin: '0 24px',
                  background: colors.white,
                  borderRadius: radii.xl,
                  boxShadow: shadows.xl,
                  border: `1px solid ${colors.gray150}`,
                  overflow: 'hidden',
                  pointerEvents: 'all',
                }}>
                  {/* Purple header band */}
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDeep} 100%)`,
                    padding: '32px 36px 28px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Background orbs */}
                    <div style={{
                      position: 'absolute', top: -40, right: -40,
                      width: 160, height: 160, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: -20, left: 60,
                      width: 100, height: 100, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      pointerEvents: 'none',
                    }} />

                    {/* Logo */}
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ ...springs.bouncy, delay: 0.1 }}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.15)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                      }}
                    >
                      <img src="/rippling-ai-icon.png" alt="Rippling AI" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}
                    >
                      Rippling AI
                    </motion.p>
                    <motion.h2
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 }}
                      style={{ fontSize: 26, fontWeight: 800, color: colors.white, letterSpacing: '-0.5px', lineHeight: 1.2 }}
                    >
                      Welcome — let's get<br />you up and running.
                    </motion.h2>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '28px 36px 32px' }}>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.38 }}
                      style={{ fontSize: 15, color: colors.gray600, lineHeight: 1.7, marginBottom: 28 }}
                    >
                      Rippling AI is your copilot across HR, Payroll, Benefits, and IT. Just ask — in plain English — and get instant, accurate answers from your real company data.
                    </motion.p>

                    {/* Feature list */}
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={staggerContainer(0.08, 0.4)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}
                    >
                      {[
                        { icon: '💬', text: 'Ask anything in plain language' },
                        { icon: '⚡', text: 'Get answers from your actual data — instantly' },
                        { icon: '@',  text: 'Use @ to scope questions to a specific module', mono: true },
                      ].map((item) => (
                        <motion.div
                          key={item.text}
                          variants={staggerItem}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: colors.primaryLight,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: item.mono ? 13 : 15,
                            fontWeight: item.mono ? 700 : 400,
                            color: item.mono ? colors.primary : undefined,
                            fontFamily: item.mono ? 'monospace' : undefined,
                          }}>
                            {item.icon}
                          </div>
                          <p style={{ fontSize: 14, color: colors.gray700, lineHeight: 1.5, paddingTop: 5 }}>
                            {item.text}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={buttonTap}
                      onClick={goToPrompts}
                      style={{
                        width: '100%',
                        padding: '13px',
                        borderRadius: radii.md,
                        background: colors.primary,
                        color: colors.white,
                        fontSize: 15,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: shadows.primary,
                        letterSpacing: '-0.1px',
                      }}
                    >
                      Show me how to prompt →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Phase 2: Card stack floating above the input ─────────────── */}
          <AnimatePresence>
            {phase === 'prompts' && (
              <motion.div
                key="prompt-cards"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={springs.gentle}
                style={{ ...cardPanelStyle, padding: '0 2px' }}
              >
                {/* Dismiss button — floats top-right */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <motion.button
                    whileHover={{ background: colors.gray200 }}
                    onClick={dismiss}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(6px)',
                      border: `1px solid ${colors.gray200}`,
                      cursor: 'pointer', fontSize: 9, color: colors.gray500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: shadows.sm,
                    }}
                  >✕</motion.button>
                </div>

                <PromptCardStack prompts={prompts} onSelect={selectPromptAndFire} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spotlight ring on the input bar during prompts phase */}
          <AnimatePresence>
            {phase === 'prompts' && inputRect && (
              <motion.div
                key="input-ring"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed',
                  zIndex: 201,
                  pointerEvents: 'none',
                  top: inputRect.top - 6,
                  left: inputRect.left - 6,
                  width: inputRect.width + 12,
                  height: inputRect.height + 12,
                  borderRadius: 20,
                  border: `2px solid ${colors.primary}`,
                  boxShadow: `0 0 0 4px ${colors.primaryLight}70, ${shadows.primary}`,
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Shared types (exported for reuse) ────────────────────────────────────────

export type { Segment, PromptCard };

// ─── Card stack ───────────────────────────────────────────────────────────────

export const CARD_H = 116;

// Visual config for each stack slot (front → back)
const SLOT_CFG = [
  { y: 0,  x: 0,  rotate: 0,    scale: 1,    opacity: 1,    zIndex: 30 }, // front
  { y: 9,  x: 3,  rotate: -2,   scale: 0.97, opacity: 0.65, zIndex: 20 }, // mid
  { y: 17, x: 6,  rotate:  2.5, scale: 0.94, opacity: 0.4,  zIndex: 10 }, // back
] as const;

export function PromptCardStack({
  prompts,
  onSelect,
  onDismiss,
}: {
  prompts: PromptCard[];
  onSelect: (prompt: string) => void;
  onDismiss?: () => void;
}) {
  const n = prompts.length;
  const [frontIdx, setFrontIdx] = useState(0);

  // Map each stack slot → which prompt index occupies it
  const slotOrder = Array.from({ length: n }, (_, slot) => (frontIdx + slot) % n);

  function handleFrontClick() {
    const card = prompts[slotOrder[0]];
    const text = card.prompt ?? card.segments.map((s) => s.text).join('');
    onSelect(text);
  }

  function cyclePrev(e: React.MouseEvent) {
    e.stopPropagation();
    setFrontIdx((prev) => (prev - 1 + n) % n);
  }

  function cycleNext(e: React.MouseEvent) {
    e.stopPropagation();
    setFrontIdx((prev) => (prev + 1) % n);
  }

  return (
    <div>
      {/* Stack */}
      <div style={{ position: 'relative', height: CARD_H + 22, marginBottom: 14 }}>
        {/* Dismiss button — sits above all cards in the stack, z-index clear of card stacking contexts */}
        {onDismiss && (
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 100, pointerEvents: 'auto' }}>
            <DismissAllButton onDismiss={onDismiss} />
          </div>
        )}
        {slotOrder.map((promptIdx, slot) => {
          const prompt = prompts[promptIdx];
          const cfg = SLOT_CFG[slot];
          const isFront = slot === 0;

          return (
            <motion.div
              key={prompt.id}
              animate={{
                y: cfg.y, x: cfg.x,
                rotate: cfg.rotate, scale: cfg.scale, opacity: cfg.opacity,
              }}
              transition={springs.modal}
              whileHover={isFront ? { y: -4, scale: 1.015 } : undefined}
              whileTap={isFront ? buttonTap : undefined}
              onClick={isFront ? handleFrontClick : undefined}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: CARD_H,
                background: colors.white,
                borderRadius: radii.lg,
                border: isFront
                  ? `1.5px solid ${colors.primary}50`
                  : `1px solid ${colors.gray200}`,
                boxShadow: isFront ? shadows.md : shadows.sm,
                padding: '16px 18px 44px',
                cursor: isFront ? 'pointer' : 'default',
                zIndex: cfg.zIndex,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                userSelect: 'none',
                overflow: 'hidden',
              }}
            >
              {isFront && (
                <>
                  {prompt.illustration ? (
                    /* ── Illustrated card layout ── */
                    <>
                      <p style={{ fontSize: 10.5, fontWeight: 600, color: colors.gray600, lineHeight: 1, flexShrink: 0 }}>
                        {prompt.segments.map((seg, i) =>
                          seg.type === 'command'
                            ? <CommandChip key={i} text={seg.text} />
                            : <span key={i}>{seg.text}</span>
                        )}
                      </p>
                      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'stretch', minHeight: 0 }}>
                        {prompt.illustration}
                      </div>
                    </>
                  ) : (
                    /* ── Text card layout ── */
                    <>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 400,
                        color: '#000',
                        lineHeight: 1.4,
                        paddingRight: 28,
                      }}>
                        {prompt.segments.map((seg, i) =>
                          seg.type === 'command'
                            ? <CommandChip key={i} text={seg.text} />
                            : <span key={i}>{seg.text}</span>
                        )}
                      </p>
                      <p style={{ fontSize: 12, color: colors.gray400, lineHeight: 1.45 }}>
                        {prompt.caption}
                      </p>
                    </>
                  )}
                  {/* Tag — pinned to bottom-right */}
                  {!prompt.illustration && prompt.tag && (
                    <span style={{
                      position: 'absolute',
                      bottom: 16,
                      right: 14,
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: colors.primary,
                      background: `${colors.primary}12`,
                      borderRadius: 4,
                      padding: '2px 6px',
                      lineHeight: 1.4,
                    }}>
                      {prompt.tag}
                    </span>
                  )}
                  {/* Arrows — always pinned to bottom-left */}
                  <div
                    style={{ position: 'absolute', bottom: 14, left: 18, display: 'flex', gap: 2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      { label: '←', action: cyclePrev },
                      { label: '→', action: cycleNext },
                    ].map(({ label, action }) => (
                      <motion.button
                        key={label}
                        whileHover={{ color: colors.gray900 }}
                        whileTap={buttonTap}
                        onClick={(e) => { e.stopPropagation(); action(e); }}
                        style={{
                          width: 24, height: 24,
                          borderRadius: 6,
                          background: 'transparent',
                          border: 'none',
                          color: colors.gray400,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

// ─── Dismiss all button with tooltip ─────────────────────────────────────────

function DismissAllButton({ onDismiss }: { onDismiss: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
      <motion.button
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ color: colors.gray700 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{
          width: 20, height: 20,
          background: 'transparent', border: 'none',
          color: colors.gray400, fontSize: 13,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >
        ✕
      </motion.button>
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 5px)', right: 0,
              background: colors.gray900, color: colors.white,
              fontSize: 11, fontWeight: 500,
              padding: '3px 8px', borderRadius: 5,
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}
          >
            Dismiss all
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── @command inline chip ─────────────────────────────────────────────────────

export function CommandChip({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 7px 2px',
      borderRadius: 6,
      background: colors.primary,
      color: colors.white,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'ui-monospace, monospace',
      letterSpacing: '-0.2px',
      margin: '0 2px',
      verticalAlign: 'middle',
      lineHeight: 1.5,
    }}>
      {text}
    </span>
  );
}
