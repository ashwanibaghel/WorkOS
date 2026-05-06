import {
  AlertTriangle, BarChart3, FolderKanban, Plus, Search,
  ShieldCheck, Sparkles, Users, UserCheck, Activity,
  TrendingUp, RefreshCw, Crown
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import {
  ActivityTimeline, AiAssistantSidebar, AiInsightItem,
  EmptyState, MiniBarChart, Panel, Skeleton, StatCard
} from "./DashboardShared.jsx";

/* ─── Risk Alert Item ─────────────────────────────────────────── */
const RiskAlert = ({ alert }) => {
  const isHigh = alert.level === "high" || alert.level === "critical";
  return (
    <div className={`ds-risk-item ${isHigh ? "ds-risk-item--high" : "ds-risk-item--med"}`}>
      <AlertTriangle size={14} className="ds-risk-icon" />
      <div className="ds-risk-body">
        <strong className="ds-risk-title">{alert.title}</strong>
        <span className="ds-risk-msg">{alert.message}</span>
      </div>
      <span className={`ds-risk-badge ${isHigh ? "high" : "med"}`}>{alert.level}</span>
    </div>
  );
};

/* ─── User Role Row ───────────────────────────────────────────── */
const RoleBadge = ({ role }) => {
  const styles = {
    admin:   { bg: "rgba(99,102,241,0.1)",  color: "#4f46e5", label: "Admin" },
    manager: { bg: "rgba(245,158,11,0.1)",  color: "#d97706", label: "Manager" },
    member:  { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: "Member" },
  };
  const s = styles[role] || styles.member;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: 700,
      padding: "3px 10px", borderRadius: "999px",
      letterSpacing: "0.03em", textTransform: "capitalize",
    }}>
      {s.label}
    </span>
  );
};

const UserRoleRow = ({ item, currentUserId, onUpdateRole, onToggleStatus }) => {
  const isMe = item._id === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (item.name || "?")[0].toUpperCase();
  const avatarColors = ["#6366f1","#10b981","#f59e0b","#f43f5e","#8b5cf6","#06b6d4"];
  const color = avatarColors[initials.charCodeAt(0) % avatarColors.length];

  return (
    <div className={`ds-user-row ${isMe ? "ds-user-row--me" : ""}`} style={{ position: "relative" }}>
      <div className="ds-user-avatar" style={{ background: `${color}20`, color, fontWeight: 700 }}>
        {initials}
      </div>
      <div className="ds-user-info">
        <strong className="ds-user-name">
          {item.name}
          {isMe && <span className="ds-user-you">you</span>}
        </strong>
        <span className="ds-user-email">{item.email}</span>
      </div>
      <div className="ds-user-controls">
        <span className="ds-user-status" style={{ color: item.active !== false ? "#10b981" : "var(--ds-muted)", fontSize: "12px" }}>
          <span style={{ fontSize: "8px", marginRight: "4px" }}>●</span>
          {item.active !== false ? "Active" : "Inactive"}
        </span>
        <RoleBadge role={item.role} />
        <select
          className="ds-role-select"
          value={item.role}
          onChange={(e) => onUpdateRole(item._id, e.target.value)}
          disabled={isMe}
          style={{ fontSize: "12px" }}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
        <button
          className="ds-user-more-btn"
          title="More actions"
          onClick={() => setMenuOpen(o => !o)}
        >⋯</button>
        {menuOpen && (
          <div className="ds-user-more-menu">
            <button onClick={() => { onToggleStatus && onToggleStatus(item._id); setMenuOpen(false); }}>
              {item.active !== false ? "Deactivate" : "Activate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Admin Dashboard ─────────────────────────────────────────── */
export const AdminDashboard = ({ user, overview }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [aiOpen, setAiOpen] = useState(true);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  const updateRole = async (userId, role) => {
    const res = await api.patch(`/users/${userId}/role`, { role });
    setUsers((items) => items.map((item) => item._id === userId ? res.data.user : item));
  };

  const filteredUsers = useMemo(() =>
    users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    }),
    [users, search, roleFilter]
  );

  const efficiency = overview.efficiency ?? overview.completionRate ?? 0;

  return (
    <section className="ds-admin-page">
      {/* ── Hero Strip ── */}
      <div className="ds-admin-hero">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="ds-hero-badge">
              <Crown size={12} />
              System Control
            </div>
            <h1 className="ds-hero-title">Admin Command Center</h1>
            <p className="ds-hero-sub">
              Full visibility across projects, users, risk, and delivery health.
            </p>
            <div className="ds-hero-actions">
              <Link className="ds-btn ds-btn--primary" to="/projects">
                <Plus size={15} /> New Project
              </Link>
              <Link className="ds-btn ds-btn--ghost" to="/projects">
                Manage Projects
              </Link>
            </div>
          </div>

          {/* Inline metrics — typography only, no boxes */}
          <div className="ds-admin-metrics-row">
            <div className="ds-admin-metric">
              <strong className="ds-admin-metric-num">{overview.projectCount ?? <Skeleton width={40} height={28} />}</strong>
              <span className="ds-admin-metric-lbl">Projects</span>
            </div>
            <div className="ds-admin-metric-divider" />
            <div className="ds-admin-metric">
              <strong className="ds-admin-metric-num">{overview.totalUsers ?? <Skeleton width={40} height={28} />}</strong>
              <span className="ds-admin-metric-lbl">Users</span>
            </div>
            <div className="ds-admin-metric-divider" />
            <div className="ds-admin-metric">
              <strong className={`ds-admin-metric-num ${overview.overdueTasks > 0 ? "danger" : ""}`}>
                {overview.overdueTasks ?? <Skeleton width={40} height={28} />}
              </strong>
              <span className="ds-admin-metric-lbl">Overdue</span>
            </div>
            <div className="ds-admin-metric-divider" />
            <div className="ds-admin-metric">
              <strong className="ds-admin-metric-num ds-metric-accent">{efficiency}%</strong>
              <span className="ds-admin-metric-lbl">Efficiency</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: Content + fixed AI Sidebar ── */}
      <div className="ds-dashboard-wrapper">
        <main className="ds-dashboard-content">

          {/* Stat Cards — 4 col bento */}
          <div className="ds-stat-grid">
            <StatCard
              label="Total Projects"
              value={overview.projectCount}
              icon={<FolderKanban size={20} />}
              trend={5}
            />
            <StatCard
              label="Registered Users"
              value={overview.totalUsers}
              icon={<Users size={20} />}
            />
            <StatCard
              label="Overdue Tasks"
              value={overview.overdueTasks}
              icon={<AlertTriangle size={20} />}
              danger={overview.overdueTasks > 0}
            />
            <StatCard
              label="Completion Rate"
              value={`${overview.completionRate}%`}
              icon={<TrendingUp size={20} />}
              accent
            />
          </div>

          {/* AI Insights + Performance Chart — 2 col */}
          <div className="ds-two-col">
            <Panel title="AI Insights" icon={<Sparkles size={15} />} accent>
              {!overview.aiInsights?.length && (
                <EmptyState
                  text="No AI insights yet. Create projects and tasks to get started."
                  icon={<Sparkles size={28} />}
                  cta="Create a Project"
                  ctaHref="/projects"
                />
              )}
              <div className="ds-ai-insights-list">
                {overview.aiInsights?.map((item, i) => (
                  <AiInsightItem
                    key={i}
                    text={item}
                    type={item.toLowerCase().includes("risk") || item.toLowerCase().includes("overload") ? "warn" : "info"}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Performance Graph" icon={<BarChart3 size={15} />}>
              <MiniBarChart series={overview.performanceSeries} />
            </Panel>
          </div>

          {/* Risk & User Management — 2 col */}
          <div className="ds-two-col">
            <Panel
              title="Project Risk Alerts"
              icon={<AlertTriangle size={15} />}
              danger={overview.riskAlerts?.length > 0}
              action={
                overview.riskAlerts?.length > 0 && (
                  <span className="ds-badge-danger">{overview.riskAlerts.length} active</span>
                )
              }
            >
              {overview.riskAlerts?.length === 0 ? (
                <EmptyState
                  text="No active risk detected. All projects are on track."
                  icon={<ShieldCheck size={28} />}
                />
              ) : (
                <div className="ds-risk-list">
                  {overview.riskAlerts.map((alert, i) => (
                    <RiskAlert key={i} alert={alert} />
                  ))}
                </div>
              )}
            </Panel>

            {/* Audit Activity */}
            <Panel title="Audit Activity" icon={<Activity size={15} />}>
              <ActivityTimeline items={overview.recentActivity} />
            </Panel>
          </div>

          {/* User Management — full width */}
          <Panel
            title="User Management"
            icon={<UserCheck size={15} />}
            action={
              <div className="ds-user-filters">
                <div className="ds-search-wrap">
                  <Search size={13} className="ds-search-icon" />
                  <input
                    className="ds-search-input"
                    placeholder="Search users…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="ds-filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                </select>
              </div>
            }
          >
            {loadingUsers ? (
              <div className="ds-user-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ds-user-row">
                    <Skeleton width={38} height={38} radius={999} />
                    <div style={{ flex: 1, display: "grid", gap: 6 }}>
                      <Skeleton width="40%" height={13} />
                      <Skeleton width="60%" height={11} />
                    </div>
                    <Skeleton width={100} height={32} />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState text="No users match your search." icon={<Users size={28} />} />
            ) : (
              <div className="ds-user-list">
                {filteredUsers.map((item) => (
                  <UserRoleRow
                    key={item._id}
                    item={item}
                    currentUserId={user._id}
                    onUpdateRole={updateRole}
                  />
                ))}
              </div>
            )}
            <div className="ds-user-list-footer">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </Panel>

        </main>

        {/* Fixed AI Sidebar */}
        <AiAssistantSidebar role={user.role} overview={overview} />
      </div>
    </section>
  );
};
