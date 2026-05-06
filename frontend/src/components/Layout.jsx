import {
  Bell, FolderKanban, LayoutDashboard, LogOut,
  Settings, ChevronLeft, ChevronRight, Sparkles, Sun, Moon
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { getSocket } from "../api/socket.js";
import { useAuth } from "../state/AuthContext.jsx";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
];

export const Layout = () => {
  console.log("Layout Component Reloaded", Math.random());
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("ds-theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem("ds-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  useEffect(() => {
    api.get("/notifications")
      .then((res) => setNotifications(res.data.notifications))
      .catch(() => {});
    const socket = getSocket();
    socket.connect();
    socket.on("notification:new", (n) => setNotifications((items) => [n, ...items]));
    return () => socket.off("notification:new");
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const roleLabel = {
    admin: { text: "System Admin", color: "var(--ds-accent)" },
    manager: { text: "Team Manager", color: "var(--ds-warning)" },
    member: { text: "Member", color: "var(--ds-muted)" },
  };
  const rl = roleLabel[user?.role] || roleLabel.member;

  return (
    <div className="ds-app-shell">
      {/* ── Topbar (Full Width Header) ── */}
      <header className="ds-topbar">
        <div className="ds-topbar-left">
          <div className="ds-sidebar-brand">
            <div className="ds-brand-mark">
              <Sparkles size={16} />
            </div>
            <span className="ds-brand-name" style={{ color: "var(--ds-text)" }}>WorkOS</span>
          </div>
        </div>

        <div className="ds-topbar-right">
          <div className="ds-topbar-user-badge">
            <span className="ds-topbar-role" style={{ color: rl.color }}>{rl.text}</span>
            <strong className="ds-topbar-name" style={{ color: "var(--ds-text)" }}>{user?.name}</strong>
          </div>

          <button className="ds-topbar-icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>

          <div className="ds-notif-wrap">
            <button className="ds-topbar-icon-btn" onClick={() => setShowNotif((s) => !s)} title="Notifications">
              <Bell size={18} strokeWidth={1.5} />
              {unread > 0 && <span className="ds-notif-badge">{unread}</span>}
            </button>
            {showNotif && (
              <div className="ds-notif-dropdown">
                <div className="ds-notif-dropdown-head">
                  <strong>Notifications</strong>
                  {unread > 0 && <span className="ds-badge-count">{unread} new</span>}
                </div>
                <div className="ds-notif-dropdown-list">
                  {notifications.length === 0 ? (
                    <div className="ds-notif-empty">All caught up ✓</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div key={n._id} className={`ds-notif-dd-item ${n.read ? "" : "unread"}`}>
                        <div className={`ds-notif-dd-dot ${n.read ? "" : "active"}`} />
                        <div>
                          <p className="ds-notif-dd-msg">{n.message}</p>
                          <span className="ds-notif-dd-type">{n.type}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="ds-topbar-icon-btn" title="Settings">
            <Settings size={18} strokeWidth={1.5} />
          </button>

          <div style={{ width: "1px", height: "24px", background: "var(--ds-border)", margin: "0 8px" }} />

          <button className="ds-topbar-icon-btn logout-btn" onClick={logout} title="Logout">
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* ── Content Area (Sidebar + Main) ── */}
      <div className="ds-content-area">
        {/* ── Sidebar ── */}
        <aside className={`ds-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <nav className="ds-sidebar-nav">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `ds-nav-item ${isActive ? "ds-nav-item--active" : ""}`}
                title={sidebarOpen ? "" : label}
              >
                <span className="ds-nav-icon"><Icon size={18} strokeWidth={1.5} /></span>
                {sidebarOpen && <span className="ds-nav-label">{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="ds-sidebar-spacer" />

          <button
            className="ds-sidebar-toggle"
            onClick={() => setSidebarOpen((s) => !s)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </aside>

        {/* ── Main ── */}
        <main className="ds-main">
          <div className="ds-page-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
