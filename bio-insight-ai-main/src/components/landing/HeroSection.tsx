import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HeroButton } from "@/components/ui/hero-button";
import { ArrowRight, Sparkles } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

const HeroSection = () => {
  const { user } = useAuthStore();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-muted/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="section-container relative z-10 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8"
        >
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            AI-Powered Bioinformatics
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6"
        >
          Protein & Gene
          <br />
          <span className="text-muted-foreground">Intelligence</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Explore genes, proteins, diseases, and drug interactions through a
          conversational AI interface. Research-grade insights at your fingertips.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {user ? (
            <Link to="/dashboard">
              <HeroButton variant="hero" size="lg">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </HeroButton>
            </Link>
          ) : (
            <>
              <Link to="/signup">
                <HeroButton variant="hero" size="lg">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </HeroButton>
              </Link>
              <Link to="/login">
                <HeroButton variant="hero-secondary" size="lg">
                  Login
                </HeroButton>
              </Link>
            </>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: "500K+", label: "Proteins Indexed" },
            { value: "25K+", label: "Genes Mapped" },
            { value: "10K+", label: "Drug Compounds" },
            { value: "99.9%", label: "Accuracy Rate" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
