import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, shadows, radii } from './lib/tokens';
import { springs, buttonTap, fadeIn } from './lib/animations';
import { FullscreenSplash } from './components/ftux/FullscreenSplash';
import { ModalWalkthrough } from './components/ftux/ModalWalkthrough';
import { SpotlightTour, RipplingShell } from './components/ftux/SpotlightTour';
import { WelcomeModal } from './components/ftux/WelcomeModal';
import type { PromptCard } from './components/ftux/WelcomeModal';

type Variant = 'splash' | 'splash2' | 'modal' | 'spotlight' | 'welcome';

interface VariantConfig {
  id: Variant;
  label: string;
  icon: string;
  tagline: string;
}

const variants: VariantConfig[] = [
  { id: 'splash',    label: 'Splash',        icon: '✦',  tagline: 'Animated dark intro → inline examples' },
  { id: 'splash2',   label: 'Splash + Cards', icon: '✦',  tagline: 'Animated dark intro → card stack' },
  { id: 'modal',     label: 'Walkthrough',   icon: '📖', tagline: 'Teach prompting step-by-step' },
  { id: 'spotlight', label: 'Spotlight',     icon: '🔦', tagline: 'Tour the AI chat panel' },
  { id: 'welcome',   label: 'Welcome',       icon: '👋', tagline: 'Welcome modal + prompt starter' },
];

export default function App() {
  const [active, setActive] = useState<Variant | null>(null);
  const [key, setKey] = useState(0);
  const [splashDone, setSplashDone] = useState(false);
  const [splashExited, setSplashExited] = useState(false);
  const [splashAutoPrompt, setSplashAutoPrompt] = useState<string | undefined>(undefined);
  // Welcome variant: after the user clicks "Use this", keep the shell visible
  // and auto-fire the selected prompt in the chat panel.
  const [welcomePrompt, setWelcomePrompt] = useState<string | null>(null);

  function launch(v: Variant) {
    setActive(v);
    setKey((k) => k + 1);
    setSplashDone(false);
    setSplashExited(false);
    setWelcomePrompt(null);
    setSplashAutoPrompt(undefined);
  }

  function reset() {
    setActive(null);
    setSplashDone(false);
    setSplashExited(false);
    setWelcomePrompt(null);
    setSplashAutoPrompt(undefined);
  }

  // "Exit demo" dismisses the demo button but keeps the card stack visible
  function handleExitDemo() {
    setSplashExited(true);
  }

  function handleSplashGetStarted(_remainingPrompts: string[]) {
    setSplashDone(true);
  }

  function handleSplashActionPrompt(prompt: string) {
    setSplashAutoPrompt(prompt);
    setSplashDone(true);
  }

  // Close button on splash → skip to copilot (card stack still shows)
  function handleSplashExitToShell(_remainingPrompts: string[]) {
    setSplashDone(true);
    setSplashExited(true);
  }

  function handleWelcomePromptSelected(prompt: string) {
    setWelcomePrompt(prompt);
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.gray50 }}>
      {/* Fixed close button — only during the splash demo state */}
      <AnimatePresence>
        {(active === 'splash' || active === 'splash2') && splashDone && !splashExited && (
          <motion.button
            key="splash-close"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.4, duration: 0.25 }}
            whileHover={{ scale: 1.04, background: 'rgba(255,255,255,1)' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleExitDemo}
            style={{
              position: 'fixed',
              top: 64,
              right: 40,
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px 7px 11px',
              borderRadius: radii.full,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${colors.gray200}`,
              boxShadow: shadows.md,
              fontSize: 12.5,
              fontWeight: 600,
              color: colors.gray600,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 9 }}>✕</span> Exit demo
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 400,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${colors.gray200}`,
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <img
            src="/rippling-ai-icon.png"
            alt="Rippling AI"
            style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: colors.gray900, lineHeight: 1, letterSpacing: '-0.2px' }}>Rippling AI</p>
            <p style={{ fontSize: 10.5, color: colors.gray400, lineHeight: 1, marginTop: 2 }}>FTUX Playground</p>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: colors.gray200 }} />

        {/* Variant tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {variants.map((v) => {
            const isActive = active === v.id;
            return (
              <motion.button
                key={v.id}
                whileHover={{ scale: 1.02 }}
                whileTap={buttonTap}
                onClick={() => launch(v.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: radii.full,
                  background: isActive ? colors.primary : colors.white,
                  color: isActive ? colors.white : colors.gray600,
                  border: `1px solid ${isActive ? colors.primary : colors.gray200}`,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  boxShadow: isActive ? shadows.primary : shadows.sm,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}
              >
                <span style={{ fontSize: 12 }}>{v.icon}</span>
                {v.label}
              </motion.button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <AnimatePresence>
            {active && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springs.snappy}
                whileHover={{ backgroundColor: colors.gray100 }}
                whileTap={buttonTap}
                onClick={reset}
                style={{
                  padding: '6px 14px',
                  borderRadius: radii.full,
                  background: colors.white,
                  border: `1px solid ${colors.gray200}`,
                  fontSize: 13,
                  fontWeight: 500,
                  color: colors.gray600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                ↺ Reset
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main */}
      <div style={{ padding: '28px 32px 90px', maxWidth: 1240, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div key="landing" variants={fadeIn} initial="hidden" animate="visible" exit="exit">
              <LandingState onLaunch={launch} />
            </motion.div>
          ) : (
            <motion.div
              key={`shell-${active}`}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ position: 'relative' }}
            >
              <motion.div
                animate={
                  (active === 'splash' || active === 'splash2') && !splashDone
                    ? { opacity: 0.5, scale: 0.97, y: 14, filter: 'blur(3px)' }
                    : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
                }
                transition={{ duration: 0.65, ease: [0.0, 0.0, 0.2, 1.0] }}
                style={(active === 'splash' || active === 'splash2') && splashDone ? {
                  position: 'fixed',
                  inset: 0,
                  zIndex: 20,
                  borderRadius: 0,
                  overflow: 'hidden',
                } : {
                  height: 'calc(100vh - 110px)',
                  minHeight: 580,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: shadows.xl,
                  border: `1px solid ${colors.gray200}`,
                }}
              >
                <RipplingShell
                  chatDemoActive={(active === 'splash' || active === 'splash2') && splashDone && !splashExited}
                  ftuxCards={(active === 'splash' || active === 'splash2') && splashDone ? SPLASH_PROMPT_CARDS : undefined}
                  ftuxCardsInline={active === 'splash' && splashDone}
                  autoFirePrompt={active === 'welcome' ? (welcomePrompt ?? undefined) : ((active === 'splash' || active === 'splash2') ? (splashAutoPrompt ?? undefined) : undefined)}
                  buildReveal={(active === 'splash' || active === 'splash2') ? splashDone : undefined}
                />
              </motion.div>

              <AnimatePresence>
                {/* Splash only shows its overlay while splashDone is false */}
                {(active === 'splash' || active === 'splash2') && !splashDone && (
                  <FullscreenSplash
                    key={`splash-${key}`}
                    onComplete={reset}
                    onGetStarted={handleSplashGetStarted}
                    onExitToShell={handleSplashExitToShell}
                    onActionPrompt={handleSplashActionPrompt}
                  />
                )}

                {active === 'modal'     && <ModalWalkthrough key={`modal-${key}`}     onComplete={reset} />}
                {active === 'spotlight' && <SpotlightTour    key={`spotlight-${key}`} onComplete={reset} />}
                {active === 'welcome' && (
                  <WelcomeModal
                    key={`welcome-${key}`}
                    onComplete={reset}
                    onPromptSelected={handleWelcomePromptSelected}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Splash follow-up card stack (no overlay) ────────────────────────────────

const SPLASH_PROMPT_CARDS: PromptCard[] = [
  {
    id: 'growth',
    segments: [{ text: 'Analyze the last 12 months of employee growth and attrition by top level department', type: 'text' }],
    caption: 'Deep workforce analytics in plain English',
    prompt: 'Analyze the last 12 months of employee growth and attrition by top level department',
    tag: 'Admin',
  },
  {
    id: 'pto',
    segments: [{ text: 'Which employees in my department who started before this year began have not taken any days off this year?', type: 'text' }],
    caption: 'Spot patterns across your team instantly',
    prompt: 'Which employees in my department who started before this year began have not taken any days off this year?',
    tag: 'Admin',
  },
  {
    id: 'paychecks',
    segments: [{ text: 'Compare my last two paychecks and highlight any differences', type: 'text' }],
    caption: 'Understand your pay at a glance',
    prompt: 'Compare my last two paychecks and highlight any differences',
    tag: 'Employee',
  },
];

// ─── Landing / home ───────────────────────────────────────────────────────────

function LandingState({ onLaunch }: { onLaunch: (v: Variant) => void }) {
  const details: Record<Variant, { detail: string; tags: string[] }> = {
    splash: {
      detail: 'Dark full-screen overlay with ambient glow, floating prompt bubbles that scroll upward, word-by-word headline reveal, and a fake AI input bar.',
      tags: ['dark hero', 'floating bubbles', 'word stagger', 'spring CTA'],
    },
    splash2: {
      detail: 'Same animated dark intro as Splash, but transitions into the AI panel with a dismissable Framer-style card stack instead of inline example links.',
      tags: ['dark hero', 'card stack', 'dismissable', 'spring CTA'],
    },
    modal: {
      detail: 'Four-step modal that teaches prompting: intro → specificity → follow-ups → starter prompts. Each step slides in with directional transitions.',
      tags: ['directional slide', 'prompting tips', 'progress bar', 'AnimatePresence'],
    },
    spotlight: {
      detail: 'SVG mask spotlight tracks across the real AI chat panel DOM elements using useSpring. Each stop explains a UI feature with an inline tip.',
      tags: ['SVG mask', 'useSpring', 'chat panel tour', 'tooltip cards'],
    },
    welcome: {
      detail: 'Welcome modal with branded header, then click "Show me how" to reveal 3 sample prompts anchored above the real input bar — including one with @payroll command syntax.',
      tags: ['welcome modal', 'DOM-anchored', '@command chip', 'copy to clipboard'],
    },
  };

  const activeVariants  = variants.filter((v) => v.id === 'splash' || v.id === 'splash2');
  const rejectedVariants = variants.filter((v) => v.id === 'modal' || v.id === 'spotlight' || v.id === 'welcome');

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 44 }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 14px',
          background: colors.primaryLight,
          borderRadius: radii.full,
          fontSize: 11,
          fontWeight: 700,
          color: colors.primary,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}>
          ✦ Prompting FTUX · 4 concepts
        </div>
        <h1 style={{
          fontSize: 38,
          fontWeight: 800,
          color: colors.gray900,
          letterSpacing: '-1.5px',
          lineHeight: 1.15,
          marginBottom: 14,
        }}>
          Rippling AI <span style={{ color: colors.primary }}>FTUX</span>
        </h1>
        <p style={{ fontSize: 17, color: colors.gray500, lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>
          Four FTUX concepts — all focused on getting new users to understand and use the AI chat. Click to preview against a live mock.
        </p>
      </motion.div>

      {/* Active concepts */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 44 }}
      >
        {activeVariants.map((v) => (
          <VariantCard key={v.id} config={v} detail={details[v.id]} onLaunch={onLaunch} />
        ))}
      </motion.div>

      {/* Rejected concepts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: colors.gray200 }} />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: colors.gray50,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radii.full,
            fontSize: 11,
            fontWeight: 600,
            color: colors.gray400,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}>
            ✕ Rejected ideas
          </div>
          <div style={{ flex: 1, height: 1, background: colors.gray200 }} />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.4 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}
        >
          {rejectedVariants.map((v) => (
            <VariantCard key={v.id} config={v} detail={details[v.id]} onLaunch={onLaunch} rejected />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function VariantCard({
  config,
  detail,
  onLaunch,
  rejected = false,
}: {
  config: VariantConfig;
  detail: { detail: string; tags: string[] };
  onLaunch: (v: Variant) => void;
  rejected?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: springs.gentle },
      }}
      whileHover={{ y: -3, boxShadow: rejected ? shadows.md : shadows.lg }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onLaunch(config.id)}
      style={{
        background: rejected ? colors.gray50 : colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radii.xl,
        padding: '24px',
        cursor: 'pointer',
        boxShadow: shadows.sm,
        transition: 'box-shadow 0.2s',
        opacity: rejected ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: radii.md,
          background: rejected ? colors.gray100 : colors.primaryLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          filter: rejected ? 'grayscale(1)' : 'none',
        }}>
          {config.icon}
        </div>
        <div>
          <p style={{
            fontSize: 16, fontWeight: 700,
            color: rejected ? colors.gray400 : colors.gray900,
            letterSpacing: '-0.2px',
            textDecoration: rejected ? 'line-through' : 'none',
          }}>
            {config.label}
          </p>
          <p style={{ fontSize: 12.5, color: rejected ? colors.gray400 : colors.primary, fontWeight: 500 }}>{config.tagline}</p>
        </div>
      </div>

      <p style={{ fontSize: 13.5, color: rejected ? colors.gray400 : colors.gray500, lineHeight: 1.65, marginBottom: 14 }}>
        {detail.detail}
      </p>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        {detail.tags.map((tag) => (
          <span key={tag} style={{
            padding: '3px 9px',
            background: colors.gray50,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radii.full,
            fontSize: 11,
            fontWeight: 500,
            color: rejected ? colors.gray400 : colors.gray600,
          }}>
            {tag}
          </span>
        ))}
      </div>

      <motion.div
        whileHover={{ background: rejected ? colors.gray200 : colors.primary, color: rejected ? colors.gray600 : colors.white }}
        transition={{ duration: 0.14 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '9px 16px',
          background: rejected ? colors.gray100 : colors.primaryLight,
          borderRadius: radii.md,
          fontSize: 13,
          fontWeight: 600,
          color: rejected ? colors.gray500 : colors.primary,
        }}
      >
        Preview →
      </motion.div>
    </motion.div>
  );
}
