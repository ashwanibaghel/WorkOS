import {
  AlertTriangle, BarChart3, CheckCircle2, Clock3,
  Flame, Sparkles, Target, Trophy, Zap, ArrowRight
} from "lucide-react";
import { AiAssistantSidebar, EmptyState, MiniBarChart, Panel, StatCard, TaskRows } from "./DashboardShared.jsx";
import { Link } from "react-router-dom";

/* ─── Next Task Hero Card ─────────────────────────────────────── */
const FocusCard = ({ task }) => {
  if (!task) {
    return (
      <div className="ds-focus-card ds-focus-card--empty">
        <div className="ds-focus-empty-icon"><CheckCircle2 size={36} /></div>
        <h2 className="ds-focus-empty-title">You're all clear!</h2>
        <p className="ds-focus-empty-sub">No active tasks assigned. Check with your manager or pick up something from the projects.</p>
        <Link className="ds-btn ds-btn--primary" to="/projects">
          <Zap size={14} /> Browse Projects
        </Link>
      </div>
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const hoursLeft = task.dueDate
    ? Math.max(0, Math.round((new Date(task.dueDate) - new Date()) / 3600000))
    : null;

  return (
    <div className={`ds-focus-card ${isOverdue ? "ds-focus-card--overdue" : "ds-focus-card--active"}`}>
      <div className="ds-focus-top">
        <div className="ds-focus-badge">
          <Flame size={12} /> Next Best Task
        </div>
        {hoursLeft !== null && (
          <span className={`ds-focus-deadline ${isOverdue ? "overdue" : hoursLeft <= 4 ? "urgent" : ""}`}>
            <Clock3 size={12} />
            {isOverdue ? "Overdue!" : hoursLeft === 0 ? "Due now" : `${hoursLeft}h left`}
          </span>
        )}
      </div>
      <h2 className="ds-focus-title">{task.title}</h2>
      {task.description && (
        <p className="ds-focus-desc">{task.description.slice(0, 120)}{task.description.length > 120 ? "…" : ""}</p>
      )}
      <div className="ds-focus-footer">
        <span className="ds-focus-project">
          {task.projectId?.name || "Project"}
        </span>
        <Link className="ds-btn ds-btn--primary ds-focus-cta" to={`/projects/${task.projectId?._id || task.projectId}`}>
          Open Task <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

/* ─── Productivity Ring ───────────────────────────────────────── */
const ProductivityRing = ({ completed, total }) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="ds-productivity-ring">
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r="36" fill="none"
          stroke="url(#ringGrad)" strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ds-ring-label">
        <strong>{pct}%</strong>
        <span>done</span>
      </div>
    </div>
  );
};

/* ─── Member Dashboard ────────────────────────────────────────── */
export const MemberDashboard = ({ user, overview }) => {
  const nextTask = overview.myTasks?.[0];
  const completedToday = overview.completedToday ?? 0;
  const totalOpen = overview.myTasks?.length ?? 0;

  return (
    <section className="ds-member-page">
      {/* ── Hero Strip (full width) ── */}
      <div className="ds-member-hero">
        <div className="ds-hero-badge">
          <Target size={12} /> Focus Mode
        </div>
        <h1 className="ds-hero-title">
          Good {getGreeting()}, <span className="ds-hero-name">{user.name.split(" ")[0]}</span>
        </h1>
        <p className="ds-hero-sub">Here's your personal workspace. Stay focused, stay in flow.</p>
      </div>

      {/* ── Layout ── */}
      <div className="ds-dashboard-wrapper">
        <div className="ds-member-layout">
          <main className="ds-dashboard-content">

            {/* Focus Card — Next Task */}
            <FocusCard task={nextTask} />

            {/* Stat Row */}
            <div className="ds-member-stat-grid">
              <StatCard
                label="Open Tasks"
                value={totalOpen}
                note="Assigned active work"
                icon={<Target size={16} />}
              />
              <StatCard
                label="Overdue"
                value={overview.overdueTasks}
                note="Needs attention"
                icon={<AlertTriangle size={16} />}
                danger={overview.overdueTasks > 0}
              />
              <StatCard
                label="Team Completion"
                value={`${overview.completionRate}%`}
                note="All team tasks"
                icon={<CheckCircle2 size={16} />}
                accent
              />
              <StatCard
                label="Avg Completion"
                value={`${overview.avgCompletionHours ?? 0}h`}
                note="Per task"
                icon={<Clock3 size={16} />}
              />
            </div>

            {/* My Priority Queue */}
            <Panel
              title="My Priority Queue"
              icon={<Target size={15} />}
              action={
                totalOpen > 0 && <span className="ds-badge-count">{totalOpen} tasks</span>
              }
            >
              {totalOpen === 0 ? (
                <EmptyState
                  text="No active tasks assigned. Pick something up or ask your manager."
                  icon={<Trophy size={32} />}
                  cta="Browse Projects"
                  ctaHref="/projects"
                />
              ) : (
                <TaskRows tasks={overview.myTasks} empty="No assigned tasks." />
              )}
            </Panel>

            {/* Bottom two-col */}
            <div className="ds-two-col">
              <Panel title="Overdue Alerts" icon={<AlertTriangle size={15} />} danger={overview.overdueList?.length > 0}>
                <TaskRows tasks={overview.overdueList} empty="No overdue work. Keep it up!" />
              </Panel>
              <Panel title="Productivity Stats" icon={<BarChart3 size={15} />}>
                <MiniBarChart series={overview.performanceSeries} />
              </Panel>
            </div>

          </main>

          {/* Right column: productivity ring + AI */}
          <aside className="ds-member-aside">
            {/* Productivity Summary */}
            <Panel title="Today's Progress" icon={<Zap size={15} />} accent>
              <div className="ds-productivity-summary">
                <ProductivityRing completed={completedToday} total={Math.max(completedToday + totalOpen, 1)} />
                <div className="ds-productivity-details">
                  <div className="ds-prod-item">
                    <CheckCircle2 size={14} className="ds-prod-icon done" />
                    <span>{completedToday} completed today</span>
                  </div>
                  <div className="ds-prod-item">
                    <Target size={14} className="ds-prod-icon pending" />
                    <span>{totalOpen} pending</span>
                  </div>
                  <div className="ds-prod-item">
                    <Clock3 size={14} className="ds-prod-icon" />
                    <span>{overview.avgCompletionHours ?? 0}h avg focus</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* AI Suggestions for member */}
            <Panel title="AI Nudges" icon={<Sparkles size={15} />}>
              {overview.aiInsights?.length > 0 ? (
                <div className="ds-ai-insights-list">
                  {overview.aiInsights.slice(0, 3).map((item, i) => (
                    <div key={i} className="ds-member-ai-nudge">
                      <Sparkles size={13} className="ds-nudge-icon" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No nudges yet. Complete tasks to get personalized suggestions." icon={<Sparkles size={28} />} />
              )}
            </Panel>
          </aside>
        </div>

        {/* AI Sidebar */}
        <AiAssistantSidebar role={user.role} overview={overview} />
      </div>
    </section>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};
