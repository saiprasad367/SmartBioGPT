import { motion } from "framer-motion";

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
};

export default TypingIndicator;
