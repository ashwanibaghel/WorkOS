import { motion } from "framer-motion";
import { ArrowRight, Bot, Code2, Play, Shield, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import "../landing-styles.css";

export const Landing = () => {
  return (
    <div className="modern-landing">
      {/* Grid Background */}
      <div className="landing-bg-grid" />

      {/* Sticky Header */}
      <nav className="landing-navbar">
        <div className="navbar-content">
          <div className="landing-brand">
            <div className="brand-icon"><Zap size={18} /></div>
            <span className="brand-text">WorkOS</span>
          </div>
          <div className="navbar-actions">
            <Link className="nav-ghost-btn" to="/login">Sign in</Link>
            <Link className="nav-primary-btn" to="/signup">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <motion.section 
          className="hero-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-badge">
            <Sparkles size={14} /> The Future of Operations
          </div>
          <h1 className="hero-title">
            Managing Teams is hard.<br />
            <span className="text-gradient">Doing it with AI is WorkOS.</span>
          </h1>
          <p className="hero-subtitle">
            The world’s first AI-driven operation system that creates projects, assigns tasks, and assists your team in real-time. Built for production-grade execution.
          </p>
          <div className="hero-ctas">
            <Link className="cta-primary" to="/signup">
              Get Started — Free <ArrowRight size={18} />
            </Link>
            <button className="cta-secondary">
              <Play size={18} /> Watch Demo
            </button>
          </div>
        </motion.section>

        {/* AI Bento Box Grid */}
        <section className="bento-section">
          <motion.div 
            className="bento-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
              hidden: { opacity: 0 }
            }}
          >
            {/* Card 1: Project Architect (Spans 2 columns on wide screens) */}
            <motion.div 
              className="bento-card bento-wide"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="bento-content">
                <div className="bento-icon"><Code2 size={24} /></div>
                <h3>Project Architect</h3>
                <p>Just tell the AI what you want to build. WorkOS breaks it down into projects and tasks in seconds.</p>
              </div>
              <div className="bento-visual mockup-architect">
                <div className="prompt-bar">"Build an E-commerce app" <ArrowRight size={14} /></div>
                <div className="mockup-tasks">
                  <div className="mockup-task"><div className="task-circle"/> Initialize DB Schema</div>
                  <div className="mockup-task"><div className="task-circle"/> Setup Auth Middleware</div>
                  <div className="mockup-task"><div className="task-circle"/> Design Product API</div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Smart Allocation */}
            <motion.div 
              className="bento-card"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="bento-content">
                <div className="bento-icon"><Target size={24} /></div>
                <h3>Smart Allocation</h3>
                <p>AI analyzes team workload and automatically assigns tasks to the right person. No more manual tracking.</p>
              </div>
              <div className="bento-visual mockup-allocation">
                <div className="allocation-node user-node">Frontend Dev</div>
                <div className="allocation-line" />
                <div className="allocation-node ai-node"><Sparkles size={12}/> AI Match</div>
                <div className="allocation-line" />
                <div className="allocation-node task-node">React UI Ticket</div>
              </div>
            </motion.div>

            {/* Card 3: Real-time Assistant */}
            <motion.div 
              className="bento-card"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="bento-content">
                <div className="bento-icon"><Bot size={24} /></div>
                <h3>Real-time Assistant</h3>
                <p>A 24/7 AI partner for every member. From priority suggestions to technical help, AI does it all.</p>
              </div>
              <div className="bento-visual mockup-assistant">
                <div className="chat-bubble ai-bubble">You're clear! Ask me what to work on next.</div>
                <div className="chat-bubble user-bubble">Next priority?</div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Role Based Pitch */}
        <section className="roles-section">
          <div className="roles-header">
            <h2>Built for every level of execution.</h2>
          </div>
          <motion.div 
            className="roles-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
              hidden: { opacity: 0 }
            }}
          >
            <motion.div className="role-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <div className="role-icon-wrap"><Shield size={32} /></div>
              <h3>Admin</h3>
              <p>Full visibility with AI Risk Detection.</p>
            </motion.div>
            <motion.div className="role-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <div className="role-icon-wrap"><Target size={32} /></div>
              <h3>Manager</h3>
              <p>Seamless team control with Automated Workflows.</p>
            </motion.div>
            <motion.div className="role-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <div className="role-icon-wrap"><Zap size={32} /></div>
              <h3>Member</h3>
              <p>Focus Mode with AI-prioritized task lists.</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Pro-Tip Banner */}
        <motion.section 
          className="pro-tip-banner"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="banner-content">
            <Sparkles size={24} className="banner-icon" />
            <p>"WorkOS doesn't just store data; it understands your project's context using LLMs to drive execution."</p>
          </div>
        </motion.section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand">
          <div className="brand-icon"><Zap size={14} /></div>
          <span className="brand-text">WorkOS</span>
        </div>
        <p>© 2026 WorkOS Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};
