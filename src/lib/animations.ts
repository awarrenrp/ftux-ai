import type { Variants, Transition } from 'framer-motion';

// ─── Spring presets ────────────────────────────────────────────────────────────

export const springs = {
  gentle: { type: 'spring', stiffness: 200, damping: 28 } as Transition,
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  bouncy: { type: 'spring', stiffness: 500, damping: 22 } as Transition,
  slow:   { type: 'spring', stiffness: 120, damping: 24 } as Transition,
  modal:  { type: 'spring', stiffness: 280, damping: 32 } as Transition,
} as const;

export const ease = {
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  out:    [0.0,  0.0,  0.2,  1.0]  as const,
  in:     [0.4,  0.0,  1.0,  1.0]  as const,
  inOut:  [0.4,  0.0,  0.2,  1.0]  as const,
} as const;

// ─── Shared variants ──────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.out } },
  exit:   { opacity: 0, y: -12, transition: { duration: 0.3, ease: ease.in } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: 0.25, ease: ease.in } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springs.modal },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: ease.in } },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: springs.gentle },
  exit:    { opacity: 0, x: -20, transition: { duration: 0.2, ease: ease.in } },
};

export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: springs.gentle },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.2, ease: ease.in } },
};

export const slideInUp: Variants = {
  hidden:  { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
  exit:    { opacity: 0, y: 20, transition: { duration: 0.25, ease: ease.in } },
};

export const panelSlideRight: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: springs.modal },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.3, ease: ease.in } },
};

export const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};

// ─── Stagger containers ───────────────────────────────────────────────────────

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren, delayChildren },
  },
});

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.out } },
};

// ─── Word-by-word text animation ─────────────────────────────────────────────

export const wordContainer = (staggerChildren = 0.06, delayChildren = 0.1): Variants => ({
  hidden:  {},
  visible: { transition: { staggerChildren, delayChildren } },
});

export const wordItem: Variants = {
  hidden:  { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: ease.out },
  },
};

// ─── Button hover/tap ─────────────────────────────────────────────────────────

export const buttonTap = { scale: 0.96 };
export const buttonHover = { scale: 1.02 };
