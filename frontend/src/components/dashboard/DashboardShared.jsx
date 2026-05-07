import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle, ArrowRight, Bot, Brain, CheckCircle2,
  Clock, Send, Sparkles, TrendingUp, Zap
} from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

/* â”€â”€â”€ Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const formatAgo = (date) => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/* â”€â”€â”€ Skeleton Loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const Skeleton = ({ width = "100%", height = 16, radius = 6, style = {} }) => (
  <div className="ds-skeleton" style={{ width, height, borderRadius: radius, ...style }} />
);

export const SkeletonCard = () => (
  <div className="ds-panel" style={{ gap: 12, display: "grid" }}>
    <Skeleton width="40%" height={12} />
    <Skeleton width="60%" height={28} />
    <Skeleton width="80%" height={12} />
  </div>
);

/* â”€â”€â”€ Glass Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const Panel = ({ title, icon, action, children, className = "", accent = false, danger = false }) => (
  <section className={`ds-panel ${accent ? "ds-panel--accent" : ""} ${danger ? "ds-panel--danger" : ""} ${className}`}>
    {(title || icon || action) && (
      <header className="ds-panel-header">
        <div className="ds-panel-title">
          {icon && <span className="ds-panel-icon">{icon}</span>}
          {title && <h2 className="ds-panel-heading">{title}</h2>}
        </div>
        {action && <div className="ds-panel-action">{action}</div>}
      </header>
    )}
    <div className="ds-panel-body">{children}</div>
  </section>
);

/* â”€â”€â”€ Stat Card (Ghost Card Strategy) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const StatCard = ({ label, value, note, icon, danger = false, accent = false, trend }) => {
  let iconClass = "ds-stat-icon-wrap";
  if (danger) iconClass += " rose";
  else if (accent) iconClass += " emerald";
  else iconClass += " indigo";

  return (
    <article className="ds-stat hover:shadow-md transition-all">
      <div className={iconClass}>
        {icon}
      </div>
      <div className="ds-stat-content">
        <p className="ds-stat-label">
          {label}
          {trend !== undefined && (
            <span className={`ds-stat-trend ${trend >= 0 ? "up" : "down"}`} style={{ marginLeft: 6 }}>
              {trend >= 0 ? "â†‘" : "â†“"} {Math.abs(trend)}%
            </span>
          )}
        </p>
        <h3 className="ds-stat-value">{value ?? <Skeleton width="60%" height={28} />}</h3>
      </div>
    </article>
  );
};

/* â”€â”€â”€ Metric Chip (inline, no box) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const MetricChip = ({ label, value, danger = false }) => (
  <div className="ds-metric-chip">
    <strong className={danger && Number(value) > 0 ? "ds-metric-chip-value danger" : "ds-metric-chip-value"}>{value}</strong>
    <span className="ds-metric-chip-label">{label}</span>
  </div>
);

/* â”€â”€â”€ AI Insight Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const AiInsightItem = ({ text, icon, type = "info" }) => (
  <div className={`ds-ai-insight ds-ai-insight--${type}`}>
    <span className="ds-ai-insight-icon">
      {icon || <Sparkles size={14} />}
    </span>
    <p className="ds-ai-insight-text">{text}</p>
  </div>
);

/* â”€â”€â”€ Task Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const TaskRows = ({ tasks = [], empty = "No tasks found.", loading = false }) => {
  if (loading) return (
    <div className="ds-task-list">
      {[1,2,3].map(i => <div key={i} className="ds-task-row"><Skeleton width="60%" /><Skeleton width="20%" /></div>)}
    </div>
  );
  return (
    <div className="ds-task-list">
      {tasks.length === 0 && <EmptyState text={empty} icon={<CheckCircle2 size={28} />} />}
      {tasks.map((task) => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
        return (
          <Link
            className={`ds-task-row ${isOverdue ? "ds-task-row--overdue" : ""}`}
            to={`/projects/${task.projectId?._id || task.projectId}`}
            key={task._id}
          >
            <div className="ds-task-row-dot" />
            <div className="ds-task-row-body">
              <strong className="ds-task-row-title">{task.title}</strong>
              <span className="ds-task-row-meta">{task.projectId?.name || "Project"} Â· {task.assignedTo?.name || task.status}</span>
            </div>
            <div className="ds-task-row-right">
              {task.dueDate && (
                <span className={`ds-task-row-due ${isOverdue ? "overdue" : ""}`}>
                  <Clock size={11} />
                  {formatAgo(task.dueDate)}
                </span>
              )}
              <ArrowRight size={14} className="ds-task-row-arrow" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/* â”€â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const EmptyState = ({ text, icon, cta, ctaHref }) => (
  <div className="ds-empty">
    {icon && <div className="ds-empty-icon">{icon}</div>}
    <p className="ds-empty-text">{text}</p>
    {cta && ctaHref && <Link className="ds-empty-cta" to={ctaHref}>{cta}</Link>}
  </div>
);

/* â”€â”€â”€ Mini Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const MiniBarChart = ({ series = [] }) => {
  if (!series.length) return <EmptyState text="No performance data yet." icon={<TrendingUp size={28} />} />;
  const max = Math.max(...series.map((item) => item.value), 1);
  return (
    <div className="ds-bar-chart">
      {series.map((item) => (
        <div className="ds-bar-chart-row" key={item.label}>
          <span className="ds-bar-label">{item.label}</span>
          <div className="ds-bar-track">
            <div
              className="ds-bar-fill"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || "var(--ds-accent)",
              }}
            />
          </div>
          <strong className="ds-bar-value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* â”€â”€â”€ Workload Heatmap Bars â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const WorkloadBars = ({ workload = [] }) => {
  if (!workload.length) return <EmptyState text="No workload data yet." icon={<Zap size={28} />} cta="Add members to projects" ctaHref="/projects" />;

  const getStatus = (active, total) => {
    if (!total) return { label: "Idle", color: "var(--ds-muted)", pct: 0 };
    const pct = (active / total) * 100;
    if (pct >= 90) return { label: "Overloaded", color: "var(--ds-danger)", pct };
    if (pct >= 70) return { label: "Busy", color: "var(--ds-warning)", pct };
    if (pct >= 40) return { label: "Balanced", color: "var(--ds-success)", pct };
    return { label: "Light", color: "var(--ds-muted)", pct };
  };

  return (
    <div className="ds-workload">
      {workload.slice(0, 8).map((item) => {
        const { label, color, pct } = getStatus(item.active, item.total);
        return (
          <div className="ds-workload-row" key={item._id || "unassigned"}>
            <div className="ds-workload-info">
              <div className="ds-workload-avatar">
                {(item.user?.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <span className="ds-workload-name">{item.user?.name || "Unassigned"}</span>
                <span className="ds-workload-tasks">{item.active} active Â· {item.done}/{item.total} done</span>
              </div>
            </div>
            <div className="ds-workload-bar-wrap">
              <div className="ds-workload-bar-track">
                <div
                  className="ds-workload-bar-fill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="ds-workload-status" style={{ color }}>
                {label} Â· {Math.round(pct)}%
              </span>
            </div>
            {item.overdue > 0 && (
              <span className="ds-workload-overdue">
                <AlertTriangle size={11} /> {item.overdue} overdue
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* â”€â”€â”€ Notifications List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const NotificationsList = ({ items = [] }) => (
  <div className="ds-notifications">
    {items.length === 0 && <EmptyState text="You're all caught up." icon={<CheckCircle2 size={28} />} />}
    {items.map((item) => (
      <div className={`ds-notif-item ${item.read ? "" : "unread"}`} key={item._id}>
        <div className={`ds-notif-dot ${item.read ? "" : "active"}`} />
        <div className="ds-notif-body">
          <strong className="ds-notif-msg">{item.message}</strong>
          <span className="ds-notif-meta">{item.type} Â· {formatAgo(item.createdAt)}</span>
        </div>
      </div>
    ))}
  </div>
);

/* â”€â”€â”€ Activity Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const ActivityTimeline = ({ items = [] }) => (
  <div className="ds-timeline">
    {items.length === 0 && <EmptyState text="No activity recorded yet." icon={<Clock size={28} />} />}
    {items.map((item, i) => (
      <div className="ds-timeline-item" key={item._id || i}>
        <div className="ds-timeline-line">
          <div className="ds-timeline-dot" />
          {i < items.length - 1 && <div className="ds-timeline-track" />}
        </div>
        <div className="ds-timeline-content">
          <strong className="ds-timeline-actor">{item.userId?.name || "System"}</strong>
          <span className="ds-timeline-action">{item.action}</span>
          {item.projectId?.name && <span className="ds-timeline-project">{item.projectId.name}</span>}
          <small className="ds-timeline-time">{formatAgo(item.createdAt)}</small>
        </div>
      </div>
    ))}
  </div>
);

/* â”€â”€â”€ AI Assistant Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const AiAssistantSidebar = ({ role, overview }) => {
  const [messages, setMessages] = useState([{ from: "ai", text: roleIntro(role, overview) }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const scrollRef = useRef(null);
  const suggestions = useMemo(() => (overview.aiInsights || []).slice(0, 3), [overview.aiInsights]);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(scrollToBottom, [messages]);

  const send = async (text) => {
    const q = text || input;
    if (!q.trim() || typing) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTyping(true);
    try {
      const response = await api.post("/ai/dashboard/chat", { question: q.trim() });
      setMessages((m) => [...m, { from: "ai", text: formatAiReply(response.data) }]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: `AI provider unavailable: ${error.message}. Live dashboard fallback: ${buildRoleAnswer(role, overview, q)}`
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {collapsed && (
        <button type="button" className="ds-ai-fab" onClick={() => setCollapsed(false)} title="Open AI Assistant">
          <div className="ds-ai-orb"><Brain size={18} /></div>
          <span>AI Assistant</span>
        </button>
      )}
      {!collapsed && (
        <aside className="ds-ai-sidebar">
          <div className="ds-ai-sidebar-header">
            <div className="ds-ai-sidebar-title">
              <div className="ds-ai-orb"><Brain size={16} /></div>
              <div><strong>AI Assistant</strong><span>{role} context</span></div>
            </div>
            <button type="button" className="ds-ai-toggle" onClick={() => setCollapsed(true)} title="Minimize">
              <span style={{ fontSize: 18, lineHeight: 1 }}>&#8722;</span>
            </button>
          </div>
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="ds-ai-suggestions">
              {suggestions.map((s) => (
                <button type="button" key={s} className="ds-ai-chip" onClick={() => send(s)}><Sparkles size={11} /> {s}</button>
              ))}
            </div>
          )}
          <div className="ds-ai-log" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`ds-ai-msg ds-ai-msg--${msg.from}`}>
                {msg.from === "ai" && <div className="ds-ai-msg-dot"><Bot size={12} /></div>}
                <div className="ds-ai-msg-bubble">{msg.text}</div>
              </div>
            ))}
            {typing && (
              <div className="ds-ai-msg ds-ai-msg--ai">
                <div className="ds-ai-msg-dot"><Bot size={12} /></div>
                <div className="ds-ai-msg-bubble ds-ai-typing"><span /><span /><span /></div>
              </div>
            )}
          </div>
          <div className="ds-ai-input-wrap">
            <input className="ds-ai-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask AI something..." disabled={typing} />
            <button type="button" className="ds-ai-send" onClick={() => send()} title="Send" disabled={typing}><Send size={14} /></button>
          </div>
        </aside>
      )}
    </>
  );
};

/* â”€â”€â”€ AI Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const roleIntro = (role, overview) => {
  if (role === "admin")
    return `I'm monitoring ${overview.projectCount} projects, ${overview.totalUsers} users, and ${overview.overdueTasks} overdue tasks across your workspace.`;
  if (role === "manager")
    return `I'm tracking ${overview.pendingTasks} pending tasks and your team's workload. Ask me about risks or reassignments.`;
  return overview.myTasks?.[0]
    ? `Your next best task is "${overview.myTasks[0].title}". Want me to help break it down?`
    : "You're clear! No active assignments. Ask me what to work on next.";
};

const formatAiReply = (data = {}) => {
  const sections = [data.answer].filter(Boolean);
  if (data.recommendedActions?.length) {
    sections.push(`Actions:\n${data.recommendedActions.slice(0, 3).map((item) => `- ${item}`).join("\n")}`);
  }
  if (data.risks?.length) {
    sections.push(`Risks:\n${data.risks.slice(0, 3).map((item) => `- ${item}`).join("\n")}`);
  }
  return sections.join("\n\n") || "AI did not return a usable answer. Try asking again with more detail.";
};

const buildRoleAnswer = (role, overview, input) => {
  const lower = input.toLowerCase();
  if (lower.includes("next") || lower.includes("priority")) {
    if (role === "member")
      return overview.myTasks?.[0]
        ? `Start with "${overview.myTasks[0].title}" â€” it's highest in your due-date queue.`
        : "No assigned tasks. Check with your manager or open projects to volunteer.";
    if (role === "manager")
      return overview.overdueList?.[0]
        ? `Focus on "${overview.overdueList[0].title}" first, then rebalance overloaded assignees.`
        : "Review due-this-week tasks and confirm all have owners.";
    return overview.riskAlerts?.[0]?.message || "No critical system risk visible. Review project creation and user coverage.";
  }
  if (lower.includes("risk"))
    return overview.riskAlerts?.[0]?.message || "No high-risk alerts currently visible. System looks healthy.";
  if (lower.includes("overdue"))
    return overview.overdueTasks > 0
      ? `There are ${overview.overdueTasks} overdue tasks. Review the Risk Alerts panel for details.`
      : "No overdue tasks right now. Great work!";
  if (lower.includes("workload") || lower.includes("team"))
    return overview.workload?.length
      ? `Your team has ${overview.workload.length} tracked members. Check the workload panel for capacity.`
      : "No workload data yet. Add members to projects to see capacity.";
  return overview.aiInsights?.[0] || "Open the most active project and review task ownership, overdue work, and recent activity.";
};
