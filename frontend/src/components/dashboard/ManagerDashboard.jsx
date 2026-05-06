import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  AlertTriangle, ArrowUpRight, Bell, Calendar, CheckCircle2,
  FolderKanban, GripVertical, KanbanSquare, Plus,
  Sparkles, Users, Zap, Target, TrendingDown
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import {
  AiAssistantSidebar, AiInsightItem, EmptyState,
  NotificationsList, Panel, StatCard, TaskRows, WorkloadBars
} from "./DashboardShared.jsx";

/* ─── Priority Badge ──────────────────────────────────────────── */
const PriorityBadge = ({ priority }) => {
  const map = {
    high: { color: "#f87171", bg: "rgba(248,113,113,0.1)", label: "High" },
    medium: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", label: "Med" },
    low: { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "Low" },
  };
  const s = map[priority] || map.low;
  return (
    <span className="ds-priority-badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
};

/* ─── Kanban Task Card ────────────────────────────────────────── */
const KanbanCard = ({ task, drag }) => (
  <article
    className="ds-kanban-card"
    ref={drag.innerRef}
    {...drag.draggableProps}
    {...drag.dragHandleProps}
  >
    <div className="ds-kanban-card-top">
      <PriorityBadge priority={task.priority || "low"} />
      <GripVertical size={13} className="ds-drag-handle" />
    </div>
    <p className="ds-kanban-card-title">{task.title}</p>
    {task.description && (
      <p className="ds-kanban-card-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}</p>
    )}
    <div className="ds-kanban-card-footer">
      <span className="ds-kanban-assignee">
        {task.assignedTo ? (
          <>
            <div className="ds-mini-avatar">{task.assignedTo.name[0]}</div>
            {task.assignedTo.name.split(" ")[0]}
          </>
        ) : "Unassigned"}
      </span>
      {task.dueDate && (
        <span className={`ds-kanban-due ${new Date(task.dueDate) < new Date() ? "overdue" : ""}`}>
          <Calendar size={11} />
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      )}
    </div>
  </article>
);

/* ─── Column Header Config ────────────────────────────────────── */
const COLUMNS = [
  { id: "todo", title: "To Do", color: "var(--ds-muted)" },
  { id: "in-progress", title: "In Progress", color: "var(--ds-warning)" },
  { id: "done", title: "Done", color: "var(--ds-success)" },
];

/* ─── Manager Dashboard ───────────────────────────────────────── */
export const ManagerDashboard = ({ user, overview }) => {
  const [tasks, setTasks] = useState(overview.dashboardTasks || []);

  const onDragEnd = async ({ destination, draggableId }) => {
    if (!destination) return;
    const previous = tasks;
    setTasks((items) =>
      items.map((task) =>
        task._id === draggableId ? { ...task, status: destination.droppableId } : task
      )
    );
    try {
      await api.patch(`/tasks/${draggableId}`, { status: destination.droppableId });
    } catch {
      setTasks(previous);
    }
  };

  const completionPct = overview.completionRate ?? 0;

  return (
    <section className="ds-manager-page">
      {/* ── Hero Strip (full width) ── */}
      <div className="ds-manager-hero">
        <div className="ds-hero-badge">
          <Zap size={12} /> Delivery Hub
        </div>
        <h1 className="ds-hero-title">Delivery Command Center</h1>
        <p className="ds-hero-sub">
          Move tasks, rebalance ownership, and keep your team laser-focused on delivery.
        </p>
        <div className="ds-manager-quickstats">
          <div className="ds-manager-qs">
            <FolderKanban size={14} className="ds-qs-icon" />
            <strong>{overview.projectCount}</strong>
            <span>Projects</span>
          </div>
          <div className="ds-manager-qs-divider" />
          <div className="ds-manager-qs">
            <KanbanSquare size={14} className="ds-qs-icon" />
            <strong>{overview.pendingTasks}</strong>
            <span>Pending</span>
          </div>
          <div className="ds-manager-qs-divider" />
          <div className={`ds-manager-qs ${overview.overdueTasks > 0 ? "danger" : ""}`}>
            <AlertTriangle size={14} className="ds-qs-icon" />
            <strong>{overview.overdueTasks}</strong>
            <span>Overdue</span>
          </div>
          <div className="ds-manager-qs-divider" />
          <div className="ds-manager-qs accent">
            <CheckCircle2 size={14} className="ds-qs-icon" />
            <strong>{completionPct}%</strong>
            <span>Complete</span>
          </div>
        </div>
        <div className="ds-hero-actions" style={{ marginTop: 20 }}>
          <Link className="ds-btn ds-btn--primary" to="/projects">
            <Plus size={15} /> New Task
          </Link>
          <Link className="ds-btn ds-btn--ghost" to="/projects">
            All Projects <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="ds-dashboard-wrapper">
        <main className="ds-dashboard-content">
          {/* Insights Grid: Organizes the scattered boxes neatly */}
          <div className="ds-two-col">
            <Panel title="Team Workload" icon={<Users size={15} />}>
              <WorkloadBars workload={overview.workload} />
            </Panel>

            <div className="ds-admin-main"> {/* Stack vertically in the second column */}
              <div className="ds-manager-stat-pair">
                <StatCard
                  label="Avg Completion"
                  value={`${overview.avgCompletionHours ?? 0}h`}
                  note="Per task"
                  icon={<Target size={15} />}
                />
                <StatCard
                  label="Overdue Rate"
                  value={overview.overdueTasks > 0 ? `${Math.round((overview.overdueTasks / Math.max(overview.pendingTasks, 1)) * 100)}%` : "0%"}
                  note="Risk indicator"
                  icon={<TrendingDown size={15} />}
                  danger={overview.overdueTasks > 0}
                />
              </div>
              <Panel
                title="Due This Week"
                icon={<Calendar size={15} />}
                danger={overview.dueSoon?.length > 0}
              >
                <TaskRows tasks={overview.dueSoon} empty="No near-term deadlines." />
              </Panel>
            </div>
          </div>

          <div className="ds-two-col">
            <Panel title="Notifications" icon={<Bell size={15} />}>
              <NotificationsList items={overview.notifications} />
            </Panel>

            <Panel title="AI Suggestions" icon={<Sparkles size={15} />} accent>
              {!overview.aiInsights?.length ? (
                <EmptyState text="No suggestions yet." icon={<Sparkles size={28} />} />
              ) : (
                <div className="ds-ai-insights-list">
                  {overview.aiInsights.map((item, i) => (
                    <AiInsightItem
                      key={i}
                      text={item}
                      type={item.toLowerCase().includes("risk") || item.toLowerCase().includes("overload") ? "warn" : "info"}
                    />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Kanban Board spans full width at the bottom */}
          <div className="ds-manager-board-container" style={{ marginTop: "12px" }}>
            <Panel
              title="Interactive Kanban"
              icon={<KanbanSquare size={15} />}
              action={
                <Link to="/projects" className="ds-panel-link">
                  Full Board <ArrowUpRight size={13} />
                </Link>
              }
            >
              {tasks.length === 0 ? (
                <EmptyState
                  text="No tasks yet. Create a project and add tasks to activate the Kanban board."
                  icon={<KanbanSquare size={36} />}
                  cta="Create Project"
                  ctaHref="/projects"
                />
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="ds-kanban">
                    {COLUMNS.map((col) => {
                      const colTasks = tasks.filter((t) => t.status === col.id);
                      return (
                        <Droppable droppableId={col.id} key={col.id}>
                          {(provided, snapshot) => (
                            <div
                              className={`ds-kanban-col ${snapshot.isDraggingOver ? "ds-kanban-col--over" : ""}`}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              <div className="ds-kanban-col-header">
                                <div className="ds-kanban-col-dot" style={{ background: col.color }} />
                                <span className="ds-kanban-col-title">{col.title}</span>
                                <span className="ds-kanban-col-count">{colTasks.length}</span>
                              </div>
                              <div className="ds-kanban-cards">
                                {colTasks.map((task, index) => (
                                  <Draggable draggableId={task._id} index={index} key={task._id}>
                                    {(drag) => <KanbanCard task={task} drag={drag} />}
                                  </Draggable>
                                ))}
                                {colTasks.length === 0 && (
                                  <div className="ds-kanban-empty-col">
                                    Drop cards here
                                  </div>
                                )}
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                </DragDropContext>
              )}
            </Panel>
          </div>
        </main>

        {/* AI Sidebar (fixed right) */}
        <AiAssistantSidebar role={user.role} overview={overview} />
      </div>
    </section>
  );
};
