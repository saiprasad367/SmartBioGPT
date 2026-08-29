import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Wraps a routed page so route changes cross-fade with a small vertical slide.
 * Respects prefers-reduced-motion.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
