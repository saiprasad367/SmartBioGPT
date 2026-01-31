import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HeroButton } from "@/components/ui/hero-button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-primary text-primary-foreground rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-2xl mx-auto">
              Start Your Research Journey Today
            </h2>
            <p className="text-lg opacity-80 max-w-xl mx-auto mb-10">
              Join thousands of researchers using AI to accelerate their 
              bioinformatics discoveries.
            </p>
            <Link to="/signup">
              <HeroButton
                variant="secondary"
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </HeroButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
