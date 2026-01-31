import { motion } from "framer-motion";

const technologies = [
  { name: "React", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "MongoDB", category: "Database" },
  { name: "Firebase", category: "Auth" },
  { name: "UniProt", category: "API" },
  { name: "AlphaFold", category: "API" },
  { name: "DrugBank", category: "API" },
  { name: "STRING DB", category: "API" },
  { name: "PDB", category: "API" },
  { name: "ChEMBL", category: "API" },
];

const TechShowcase = () => {
  return (
    <section id="technology" className="py-24 bg-secondary">
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
            Powered By Industry Leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We integrate with the most trusted databases and use cutting-edge 
            technologies to deliver accurate, reliable research insights.
          </p>
        </motion.div>

        {/* Tech Pills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto"
        >
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="px-6 py-3 rounded-full bg-background border border-border hover:border-foreground/20 hover:shadow-soft transition-all duration-300 cursor-default group"
            >
              <span className="font-medium">{tech.name}</span>
              <span className="ml-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {tech.category}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Architecture Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-background rounded-3xl border border-border p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">01</span>
              </div>
              <h4 className="font-semibold mb-2">Query</h4>
              <p className="text-sm text-muted-foreground">
                Input gene or protein names in natural language
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">02</span>
              </div>
              <h4 className="font-semibold mb-2">Process</h4>
              <p className="text-sm text-muted-foreground">
                AI fetches and structures data from multiple APIs
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">03</span>
              </div>
              <h4 className="font-semibold mb-2">Visualize</h4>
              <p className="text-sm text-muted-foreground">
                Get structured insights with 3D protein views
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechShowcase;
