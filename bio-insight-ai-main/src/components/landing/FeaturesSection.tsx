import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Box, 
  Activity, 
  Shield, 
  Database, 
  Zap 
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Chat-Based Research",
    description: "Interact with biological data through natural language. Ask questions about proteins, genes, and get instant structured responses.",
  },
  {
    icon: Box,
    title: "3D Protein Visualization",
    description: "View protein structures in interactive 3D. Rotate, zoom, and explore AlphaFold and PDB models with ease.",
  },
  {
    icon: Activity,
    title: "Disease & Drug Association",
    description: "Discover disease correlations and drug interactions. Access DrugBank and ChEMBL data seamlessly.",
  },
  {
    icon: Shield,
    title: "Secure Workspace",
    description: "Your research data is protected with enterprise-grade security. Private sessions and encrypted storage.",
  },
  {
    icon: Database,
    title: "Multi-Database Integration",
    description: "Connect to UniProt, AlphaFold, STRING DB, and more. All major bioinformatics databases in one place.",
  },
  {
    icon: Zap,
    title: "Real-Time Analysis",
    description: "Get instant insights powered by AI. No waiting for batch processing or manual data retrieval.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Research Tools, Reimagined
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to explore biological data, powered by AI and 
            designed for modern research workflows.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="premium-card p-8 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
