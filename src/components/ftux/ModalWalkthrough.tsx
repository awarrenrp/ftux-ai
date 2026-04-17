import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { colors, shadows, radii } from '../../lib/tokens';
import {
  backdropVariants,
  slideInRight,
  slideInLeft,
  springs,
  buttonTap,
  staggerContainer,
  staggerItem,
  ease,
} from '../../lib/animations';

interface ModalWalkthroughProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'intro',
    eyebrow: 'Step 1 of 4',
    title: 'Your AI is ready to chat',
    body: 'The Rippling AI panel lives on the right side of every screen. Just type what you need — no special syntax, no training required.',
    visual: <IntroVisual />,
  },
  {
    id: 'specificity',
    eyebrow: 'Step 2 of 4 · Better prompts',
    title: 'Be specific to get better answers',
    body: 'Vague questions get vague answers. Adding a little context — your role, the timeframe, or what you\'re trying to do — makes a big difference.',
    visual: <SpecificityVisual />,
  },
  {
    id: 'context',
    eyebrow: 'Step 3 of 4 · Better prompts',
    title: 'Ask follow-ups to go deeper',
    body: 'AI remembers your conversation. If the first answer isn\'t quite right, ask it to refine, expand, or reformat. Treat it like a knowledgeable colleague.',
    visual: <FollowUpVisual />,
  },
  {
    id: 'try',
    eyebrow: 'Step 4 of 4',
    title: 'Ready to try your first prompt?',
    body: 'Here are a few prompts that work great as starting points. You can copy any of these directly into the chat.',
    visual: <StarterPromptsVisual />,
  },
];

export function ModalWalkthrough({ onComplete }: ModalWalkthroughProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [visible, setVisible] = useState(true);

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  function goNext() {
    if (isLast) { setVisible(false); setTimeout(onComplete, 400); }
    else { setDirection('forward'); setStep((s) => s + 1); }
  }

  function goBack() {
    setDirection('back');
    setStep((s) => s - 1);
  }

  const slideVariant = direction === 'forward' ? slideInRight : slideInLeft;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => { setVisible(false); setTimeout(onComplete, 400); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            key="modal-shell"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={springs.modal}
            style={{
              position: 'fixed', inset: 0, zIndex: 201,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%', maxWidth: 540, margin: '0 24px',
              borderRadius: radii.xl, background: colors.white,
              boxShadow: shadows.xl, overflow: 'hidden', pointerEvents: 'all',
            }}>
              {/* Progress bar */}
              <div style={{ height: 3, background: colors.gray100 }}>
                <motion.div
                  animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: ease.smooth }}
                  style={{
                    height: '100%',
                    background: colors.primary,
                    borderRadius: 999,
                  }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  variants={slideVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ padding: '32px 36px 28px' }}
                >
                  {/* Visual */}
                  <div style={{
                    height: 200,
                    borderRadius: radii.lg,
                    background: colors.gray50,
                    border: `1px solid ${colors.gray150}`,
                    marginBottom: 28,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {currentStep.visual}
                  </div>

                  <p style={{
                    fontSize: 11, fontWeight: 700, color: colors.primary,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                  }}>
                    {currentStep.eyebrow}
                  </p>
                  <h2 style={{
                    fontSize: 22, fontWeight: 700, color: colors.gray900,
                    letterSpacing: '-0.4px', lineHeight: 1.25, marginBottom: 12,
                  }}>
                    {currentStep.title}
                  </h2>
                  <p style={{ fontSize: 15, color: colors.gray500, lineHeight: 1.65, marginBottom: 32 }}>
                    {currentStep.body}
                  </p>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {steps.map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            width: i === step ? 20 : 6,
                            background: i === step ? colors.primary : i < step ? colors.primaryMid : colors.gray200,
                          }}
                          transition={{ duration: 0.3 }}
                          style={{ height: 6, borderRadius: 999 }}
                        />
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {step > 0 && (
                        <motion.button
                          whileHover={{ backgroundColor: colors.gray100 }}
                          whileTap={buttonTap}
                          onClick={goBack}
                          style={{
                            padding: '10px 20px', borderRadius: radii.md,
                            background: colors.white, border: `1px solid ${colors.gray200}`,
                            color: colors.gray600, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Back
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={buttonTap}
                        onClick={goNext}
                        style={{
                          padding: '10px 24px', borderRadius: radii.md,
                          background: colors.primary, color: colors.white,
                          fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                          boxShadow: shadows.primary,
                        }}
                      >
                        {isLast ? 'Open AI chat →' : 'Next →'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Step visuals ─────────────────────────────────────────────────────────────

function IntroVisual() {
  return (
    <div style={{ width: '100%', display: 'flex', padding: '16px 20px', gap: 12, height: '100%' }}>
      {/* Main app (grayed) */}
      <div style={{ flex: 1, background: colors.gray100, borderRadius: 8, opacity: 0.5 }} />
      {/* Chat panel */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ...springs.gentle, delay: 0.2 }}
        style={{
          width: 160,
          background: colors.white,
          borderRadius: 8,
          border: `1px solid ${colors.gray200}`,
          boxShadow: shadows.md,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 28, borderBottom: `1px solid ${colors.gray100}`, background: colors.gray50 }} />
        <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ alignSelf: 'flex-end', background: colors.gray100, borderRadius: '10px 10px 2px 10px', padding: '6px 8px', fontSize: 10, color: colors.gray600 }}>
            Help me with PTO
          </div>
          <div style={{ background: colors.primaryLight, borderRadius: 6, padding: '6px 8px', fontSize: 10, color: colors.primaryDark, lineHeight: 1.5 }}>
            You have 12 days of PTO remaining this year…
          </div>
        </div>
        <div style={{ height: 32, borderTop: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
          <div style={{ flex: 1, height: 16, background: colors.gray100, borderRadius: 4 }} />
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: colors.primary }} />
        </div>
      </motion.div>
    </div>
  );
}

function SpecificityVisual() {
  const pairs = [
    { bad: 'Tell me about benefits', good: 'Explain my health benefits for family of 4 in California' },
    { bad: 'Payroll question', good: 'What drove the increase in payroll costs in Q3 vs Q2?' },
  ];
  return (
    <motion.div
      variants={staggerContainer(0.12, 0.1)}
      initial="hidden"
      animate="visible"
      style={{ padding: '14px 20px', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {pairs.map((pair, i) => (
        <motion.div key={i} variants={staggerItem} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{
            padding: '7px 10px', background: '#fff0f0', border: '1px solid #fca5a5',
            borderRadius: radii.md, fontSize: 11.5, color: '#dc2626', flex: 1, lineHeight: 1.4,
            textDecoration: 'line-through', opacity: 0.75,
          }}>
            {pair.bad}
          </div>
          <span style={{ fontSize: 13, color: colors.gray400, paddingTop: 6 }}>→</span>
          <div style={{
            padding: '7px 10px', background: colors.primaryLight, border: `1px solid ${colors.primaryMid}`,
            borderRadius: radii.md, fontSize: 11.5, color: colors.primaryDark, flex: 1.5, lineHeight: 1.4,
          }}>
            {pair.good}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FollowUpVisual() {
  const messages = [
    { role: 'user', text: 'Summarize last quarter payroll' },
    { role: 'ai', text: 'Total payroll was $2.4M, up 8% from Q2. Largest driver was 3 new hires in Engineering.' },
    { role: 'user', text: 'Which department had the highest cost per employee?' },
    { role: 'ai', text: 'Sales: $18,200 avg per employee, including commissions.' },
  ];
  return (
    <motion.div
      variants={staggerContainer(0.1, 0.15)}
      initial="hidden"
      animate="visible"
      style={{ padding: '12px 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}
    >
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          variants={staggerItem}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <div style={{
            maxWidth: '80%',
            padding: '8px 12px',
            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: msg.role === 'user' ? colors.gray100 : colors.primaryLight,
            fontSize: 11.5,
            color: msg.role === 'user' ? colors.gray700 : colors.primaryDark,
            lineHeight: 1.5,
          }}>
            {msg.text}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function StarterPromptsVisual() {
  const prompts = [
    "What's my PTO balance?",
    "Who's pending onboarding approval?",
    "Draft a 30-60-90 plan for a new PM",
    "Show payroll anomalies from last month",
  ];
  return (
    <motion.div
      variants={staggerContainer(0.1, 0.1)}
      initial="hidden"
      animate="visible"
      style={{ padding: '14px 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}
    >
      {prompts.map((p) => (
        <motion.div
          key={p}
          variants={staggerItem}
          whileHover={{ x: 4, borderColor: colors.primary + '50', color: colors.primaryDark }}
          style={{
            padding: '8px 12px',
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radii.md,
            fontSize: 12.5,
            color: colors.gray700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <span style={{ color: colors.primary, fontSize: 12 }}>↗</span>
          {p}
        </motion.div>
      ))}
    </motion.div>
  );
}
