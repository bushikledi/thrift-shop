"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Fade in from bottom
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

// Fade in from top
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: "100%", transition: { duration: 0.25 } },
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: "-100%" },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: "-100%", transition: { duration: 0.25 } },
};

// Scale up animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

// Stagger children container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// Fast stagger for lists
export const fastStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

// Child item animation
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Card hover animation
export const cardHover: {
  scale: number;
  y: number;
  transition: { duration: number; ease: "easeOut" };
} = {
  scale: 1.02,
  y: -5,
  transition: { duration: 0.2, ease: "easeOut" },
};

// Button tap animation
export const buttonTap = {
  scale: 0.98,
};

// Animated components
interface MotionDivProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  initial?: string;
  animate?: string;
  exit?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, className, delay = 0 }: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3, delay } },
        exit: { opacity: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, className, delay = 0 }: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut", delay },
        },
        exit: { opacity: 0, y: 20 },
      }}
    >
      {children}
    </motion.div>
  );
}

export function SlideInRight({ children, className }: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideInRight}
    >
      {children}
    </motion.div>
  );
}

export function SlideInLeft({ children, className }: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideInLeft}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className }: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  fast?: boolean;
}

export function StaggeredList({
  children,
  className,
  fast = false,
}: StaggeredListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={fast ? fastStagger : staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

// Animated card with hover effect
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  enableHover?: boolean;
}

export function AnimatedCard({
  children,
  className,
  onClick,
  enableHover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      whileHover={enableHover ? cardHover : undefined}
      whileTap={onClick ? buttonTap : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Animated button
interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  className,
  onClick,
  disabled,
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : buttonTap}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

// Overlay animation
export function AnimatedOverlay({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClick}
        />
      )}
    </AnimatePresence>
  );
}

// Page transition wrapper
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Loading spinner animation
export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      className="rounded-full border-2 border-primary border-t-transparent"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Pulse animation for notifications
export function PulseDot({ className }: { className?: string }) {
  return (
    <motion.span
      className={className}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Check mark animation for success states
export function AnimatedCheckmark({ size = 24 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

// Number counter animation
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

// Re-export AnimatePresence for convenience
export { AnimatePresence, motion };
