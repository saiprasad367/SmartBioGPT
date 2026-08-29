import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin progress bar pinned to the top of the viewport that fills as the page
 * scrolls. Part of the app-wide scroll-driven motion language.
 */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-foreground"
      aria-hidden
    />
  );
};

export default ScrollProgress;
