import { ArrowRight, BarChart3, Bot, CheckCircle2, KanbanSquare, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const Landing = () => {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <div className="landing-brand">
          <div className="brand-mark">W</div>
          <span>WorkOS</span>
        </div>
        <Link className="ghost-button" to="/login">Sign in</Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">AI-assisted team task manager</p>
          <h1>Run projects with clarity, roles, and real-time execution.</h1>
          <p>WorkOS combines Kanban task tracking, team permissions, notifications, audit logs, analytics, and OpenRouter-powered AI assistance in one production-style workspace.</p>
          <div className="landing-actions">
            <Link className="primary-button landing-cta" to="/login">Get Started <ArrowRight size={18} /></Link>
            <Link className="ghost-button" to="/signup">Create account</Link>
          </div>
        </div>

        <div className="hero-product" aria-label="Product preview">
          <div className="preview-toolbar">
            <span>Workspace dashboard</span>
            <strong>Live</strong>
          </div>
          <div className="preview-metrics">
            <PreviewMetric icon={<KanbanSquare size={16} />} label="Tasks" value="48" />
            <PreviewMetric icon={<Users size={16} />} label="Team" value="12" />
            <PreviewMetric icon={<BarChart3 size={16} />} label="Done" value="82%" />
          </div>
          <div className="preview-lanes">
            <PreviewCard title="Todo" text="Prepare API validation" />
            <PreviewCard title="In Progress" text="Socket task updates" active />
            <PreviewCard title="Done" text="JWT auth and RBAC" />
          </div>
        </div>
      </section>

      <section className="landing-features">
        <Feature icon={<ShieldCheck />} title="Role-based access" text="Admin, manager, and member permissions are enforced in backend middleware and services." />
        <Feature icon={<Bot />} title="Practical AI support" text="Break tasks down, generate descriptions, summarize risk, and ask project-state questions." />
        <Feature icon={<CheckCircle2 />} title="Delivery visibility" text="Real-time Kanban updates, overdue alerts, activity logs, and workload analytics." />
      </section>
    </main>
  );
};

const PreviewMetric = ({ icon, label, value }) => (
  <div className="preview-metric">
    {icon}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const PreviewCard = ({ title, text, active = false }) => (
  <div className={active ? "preview-task active" : "preview-task"}>
    <span>{title}</span>
    <strong>{text}</strong>
  </div>
);

const Feature = ({ icon, title, text }) => (
  <article className="landing-feature">
    {icon}
    <h2>{title}</h2>
    <p>{text}</p>
  </article>
);
