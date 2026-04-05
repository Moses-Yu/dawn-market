"use client";

import { motion, useReducedMotion } from "framer-motion";

const easeOutQuart = [0.25, 0.46, 0.45, 0.94] as const;

const variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: easeOutQuart },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15 },
  },
};

const noMotionVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
};

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={prefersReducedMotion ? noMotionVariants : variants}
    >
      {children}
    </motion.div>
  );
}
