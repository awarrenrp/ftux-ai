import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { colors, shadows, radii } from '../../lib/tokens';
import { backdropVariants, scaleIn, buttonTap, buttonHover } from '../../lib/animations';
import { AIChatPanel } from '../AIChatPanel';

const SPLASH_PROMPTS = [
  "What can I do with Rippling AI?",
  "Compare my last few paychecks",
  "Who hasn't taken PTO this year?",
];

interface SpotlightTourProps {
  onComplete: () => void;
}

interface TourStep {
  id: string;
  target: string;
  title: string;
  body: string;
  placement: 'bottom' | 'right' | 'left' | 'top';
  tip?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'prompt-input',
    target: 'prompt-input',
    title: 'Type your prompt here',
    body: 'This is where you talk to Rippling AI. Type naturally — no special commands. Ask questions, request drafts, or kick off automations.',
    placement: 'top',
    tip: 'Try: "Summarize headcount changes this year"',
  },
  {
    id: 'suggested-prompts',
    target: 'suggested-prompts',
    title: 'Suggested prompts',
    body: 'These are personalized to your role and company. Click any one to send it instantly — great for exploring what AI can do.',
    placement: 'left',
    tip: 'Suggestions update based on your usage',
  },
  {
    id: 'ai-response',
    target: 'ai-response',
    title: 'Rich, structured answers',
    body: 'Rippling AI formats responses clearly — with headers, bullets, and summaries. If you need it in a different format, just ask.',
    placement: 'left',
    tip: 'Try: "Format that as a table"',
  },
  {
    id: 'thinking-indicator',
    target: 'thinking-indicator',
    title: 'See the AI\'s reasoning',
    body: 'Click "Thinking Completed" to expand and see how AI reached its answer — useful for verifying accuracy on complex questions.',
    placement: 'bottom',
    tip: 'Transparency builds trust',
  },
];

export function SpotlightTour({ onComplete }: SpotlightTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const spotW = useMotionValue(0);
  const spotH = useMotionValue(0);

  const animX = useSpring(spotX, { stiffness: 280, damping: 30 });
  const animY = useSpring(spotY, { stiffness: 280, damping: 30 });
  const animW = useSpring(spotW, { stiffness: 280, damping: 30 });
  const animH = useSpring(spotH, { stiffness: 280, damping: 30 });

  const updateSpotlight = useCallback(() => {
    const el = document.getElementById(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      spotX.set(rect.left - 8);
      spotY.set(rect.top - 8);
      spotW.set(rect.width + 16);
      spotH.set(rect.height + 16);
    }
  }, [currentStep.target, spotX, spotY, spotW, spotH]);

  useEffect(() => {
    const timer = setTimeout(updateSpotlight, 100);
    return () => clearTimeout(timer);
  }, [step, updateSpotlight]);

  function goNext() {
    if (isLast) { setVisible(false); setTimeout(onComplete, 400); }
    else setStep((s) => s + 1);
  }

  function dismiss() {
    setVisible(false);
    setTimeout(onComplete, 400);
  }

  function getTooltipStyle(): React.CSSProperties {
    if (!targetRect) return { top: '50%', left: '50%' };
    const PAD = 16;
    const W = 300;
    const p = currentStep.placement;
    if (p === 'top')   return { bottom: window.innerHeight - targetRect.top + PAD, left: Math.max(12, targetRect.left), width: W };
    if (p === 'bottom')return { top: targetRect.bottom + PAD, left: Math.max(12, targetRect.left), width: W };
    if (p === 'right') return { top: targetRect.top, left: targetRect.right + PAD, width: W };
    if (p === 'left')  return { top: targetRect.top, left: Math.max(12, targetRect.left - W - PAD), width: W };
    return { top: targetRect.bottom + PAD, left: targetRect.left, width: W };
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* SVG spotlight mask */}
          <motion.svg
            key="spotlight-svg"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none', width: '100%', height: '100%' }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <motion.rect style={{ x: animX, y: animY, width: animW, height: animH }} rx={10} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(17,24,39,0.55)" mask="url(#spotlight-mask)" />
          </motion.svg>

          {/* Spotlight ring */}
          <motion.div
            key="spotlight-ring"
            style={{
              position: 'fixed',
              zIndex: 201,
              pointerEvents: 'none',
              border: `2px solid ${colors.primary}`,
              borderRadius: 14,
              boxShadow: `0 0 0 4px ${colors.primaryLight}60, ${shadows.primary}`,
              x: animX,
              y: animY,
              width: animW,
              height: animH,
            }}
          />

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'fixed',
                zIndex: 202,
                background: colors.white,
                borderRadius: radii.lg,
                boxShadow: shadows.xl,
                border: `1px solid ${colors.gray150}`,
                padding: '18px 20px',
                ...getTooltipStyle(),
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {step + 1} / {tourSteps.length}
                </span>
                <button
                  onClick={dismiss}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: colors.gray100, border: 'none', cursor: 'pointer',
                    fontSize: 11, color: colors.gray500, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.gray900, marginBottom: 6, letterSpacing: '-0.2px' }}>
                {currentStep.title}
              </h3>
              <p style={{ fontSize: 13, color: colors.gray500, lineHeight: 1.6, marginBottom: currentStep.tip ? 12 : 18 }}>
                {currentStep.body}
              </p>

              {currentStep.tip && (
                <div style={{
                  padding: '7px 10px',
                  background: colors.primaryLight,
                  borderRadius: radii.sm,
                  fontSize: 12,
                  color: colors.primaryDark,
                  fontWeight: 500,
                  marginBottom: 18,
                }}>
                  💡 {currentStep.tip}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {tourSteps.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === step ? 14 : 5,
                        background: i === step ? colors.primary : i < step ? colors.primaryMid : colors.gray200,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ height: 5, borderRadius: 999 }}
                    />
                  ))}
                </div>
                <motion.button
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  onClick={goNext}
                  style={{
                    padding: '7px 16px', borderRadius: radii.md,
                    background: colors.primary, color: colors.white,
                    fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    boxShadow: shadows.primary,
                  }}
                >
                  {isLast ? 'Done' : 'Next'}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Click-through zone */}
          <div onClick={goNext} style={{ position: 'fixed', inset: 0, zIndex: 199, cursor: 'pointer' }} />
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mock Rippling shell — used as backdrop for both Spotlight and other variants

interface RipplingShellProps {
  chatDemoActive?: boolean;
  ftuxPrompts?: string[];
  autoFirePrompt?: string;
  inputSuggestions?: string[];
}

export function RipplingShell({ chatDemoActive = false, ftuxPrompts, autoFirePrompt, inputSuggestions }: RipplingShellProps) {
  return (
    <div style={{ display: 'flex', height: '100%', background: colors.gray50 }}>
      {/* Left sidebar */}
      <div style={{
        width: 200,
        background: colors.gray900,
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: colors.primary, flexShrink: 0 }} />
          <span style={{ color: colors.white, fontWeight: 700, fontSize: 14 }}>Rippling</span>
        </div>
        {['Home', 'People', 'Payroll', 'Benefits', 'IT', 'Finance'].map((item, i) => (
          <div key={item} style={{
            padding: '8px 10px', borderRadius: 7,
            background: i === 0 ? 'rgba(122,0,93,0.3)' : 'transparent',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: colors.gray600, opacity: 0.6 }} />
            <span style={{ fontSize: 13, color: i === 0 ? colors.white : colors.gray400, fontWeight: i === 0 ? 600 : 400 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ width: 120, height: 18, background: colors.gray200, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: 200, height: 13, background: colors.gray150, borderRadius: 4 }} />
          </div>
          <div style={{ width: 80, height: 32, background: colors.primary, borderRadius: 8, opacity: 0.85 }} />
        </div>
        {/* Fake table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            height: 40, background: colors.white,
            borderRadius: 8, border: `1px solid ${colors.gray150}`,
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: colors.gray200 }} />
            <div style={{ flex: 1, height: 10, background: colors.gray150, borderRadius: 4 }} />
            <div style={{ width: 80, height: 10, background: colors.gray150, borderRadius: 4 }} />
            <div style={{ width: 60, height: 10, background: colors.gray150, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* AI Chat panel — right side */}
      <motion.div
        animate={chatDemoActive ? {
          boxShadow: [`0 0 0 0px ${colors.primaryLight}`, `0 0 0 3px ${colors.primaryMid}`, `0 0 0 2px ${colors.primaryLight}`],
          transition: { duration: 0.9, ease: 'easeOut' },
        } : {}}
        style={{
          width: 340,
          borderLeft: `1px solid ${colors.gray200}`,
          flexShrink: 0,
          background: colors.white,
          position: 'relative',
        }}
      >
        {autoFirePrompt
          ? <AIChatPanel showSuggestions={false} autoFirePrompt={autoFirePrompt} />
          : inputSuggestions
            ? <AIChatPanel showSuggestions={false} inputSuggestions={inputSuggestions} />
            : chatDemoActive
              ? <AIChatPanel showSuggestions={false} ftuxPrompts={ftuxPrompts ?? SPLASH_PROMPTS} />
              : <AIChatPanel showSuggestions={true} />
        }
      </motion.div>
    </div>
  );
}
